import { readFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { isRoute, matchRoute } from './route-utils.mjs';
import { FFMPEG } from './bin-resolver.mjs';
import { runCmd, ffmpegDiagnostics, ffprobeInfo, ffprobeMetadata, mimeFor } from './ffmpeg-utils.mjs';
import { safeId, readLyricsFile, lrcRowsToSrt } from './media-utils.mjs';
import { deepMerge, defaultConfig, defaultState, workspaceDir } from './config.mjs';
import { loadState, saveState, activeProject, activeConfig, addLog } from './state.mjs';
import {
  renderLoopVideo,
  renderLoopSeamPreview,
  renderLoopBatch,
  validateLoopOptions,
  startLoopJob,
  publicLoopJob,
  analyzeLoopPoint,
} from './loop-engine.mjs';
import {
  analyzeLoudness,
  waveformData,
  detectBeatsFromPeaks,
  audioSafetyReport,
  tuneSpectrumFromWaveform,
} from './audio-engine.mjs';
import {
  rowsToLrc,
  rowsToVtt,
  autoAlignLyrics,
  readLyricSource,
  saveLyricsExport,
  scoreLyricTimeline,
  parseNowPlaying,
} from './lyrics-engine.mjs';
import {
  validateRenderConfig,
  outputName,
  ensureUniqueOutput,
  pairMedia,
  estimateRender,
  autoTargetTune,
  targetSummary,
} from './target-engine.mjs';
import { queueSummary, cloneJob, startJob } from './queue-engine.mjs';
import { previewConfig, previewDiagnostics, performanceStatus, performancePatch } from './preview-engine.mjs';
import { scanDir, enrichValidation, pathInfo, streamMediaFile } from './media-scanner.mjs';
import { renderJob } from './render-engine.mjs';
import { generateThumbnails } from './thumbnail-engine.mjs';
import { initHistory, recordRender, getHistory, getHistoryStats, clearHistory } from './history.mjs';
import { generateLivePreview, generateFullPreview, cleanupPreviews } from './preview-stream.mjs';

export async function handleRequest(req, res, url, ctx) {
  const { processes, loopJobs, runQueueLoop, requestQueueStop } = ctx;
  const { body, json, corsHeaders, sendError } = ctx.http;
  let state = await loadState();

  try {
    if (isRoute(req, url, 'GET', '/api/health')) {
      const diag = await ffmpegDiagnostics();
      return json(res, 200, {
        ok: true,
        app: 'PidioForge Production API',
        ffmpeg: diag.ffmpeg,
        ffprobe: diag.ffprobe,
        ffmpegPath: diag.ffmpegPath,
        dataDir: workspaceDir,
      });
    }
    if (isRoute(req, url, 'GET', '/api/system/diagnostics')) return json(res, 200, await ffmpegDiagnostics());
    if (isRoute(req, url, 'POST', '/api/path/info')) {
      const b = await body(req);
      return json(res, 200, await pathInfo(b.path, b.kind, b.filter));
    }
    if (isRoute(req, url, 'GET', '/api/media/file'))
      return streamMediaFile(req, res, url.searchParams.get('path') || '', corsHeaders);
    if (req.method === 'POST' && url.pathname === '/api/loop/validate') {
      const b = await body(req);
      const validation = await validateLoopOptions(b);
      return json(res, validation.ok ? 200 : 400, validation);
    }
    if (req.method === 'POST' && url.pathname === '/api/loop/start') {
      const b = await body(req);
      return json(res, 202, publicLoopJob(await startLoopJob(b, loopJobs)));
    }
    if (req.method === 'GET' && url.pathname === '/api/loop/status') {
      const id = url.searchParams.get('id') || '';
      return json(
        res,
        loopJobs.has(id) ? 200 : 404,
        publicLoopJob(loopJobs.get(id)) || { error: 'loop job tidak ditemukan' },
      );
    }
    if (req.method === 'POST' && url.pathname === '/api/loop/cancel') {
      const b = await body(req);
      const job = loopJobs.get(b.id);
      if (!job) return json(res, 404, { error: 'loop job tidak ditemukan' });
      job.status = 'cancelled';
      job.error = 'Dibatalkan user';
      job.finishedAt = new Date().toISOString();
      job.child?.kill('SIGTERM');
      return json(res, 200, publicLoopJob(job));
    }
    if (req.method === 'POST' && url.pathname === '/api/loop/render') {
      const b = await body(req);
      const result = await renderLoopVideo(b);
      addLog(state, `looping selesai: ${path.basename(result.output)} (${result.duration}s)`);
      await saveState(state);
      return json(res, 200, result);
    }
    if (req.method === 'POST' && url.pathname === '/api/loop/analyze') {
      const b = await body(req);
      return json(res, 200, await analyzeLoopPoint(b));
    }
    if (req.method === 'POST' && url.pathname === '/api/loop/seam-preview') {
      const b = await body(req);
      const result = await renderLoopSeamPreview(b);
      return json(res, 200, result);
    }
    if (req.method === 'POST' && url.pathname === '/api/loop/batch') {
      const b = await body(req);
      const result = await renderLoopBatch(b);
      addLog(state, `batch looping selesai: ${result.created.length} dibuat, ${result.skipped.length} dilewati`);
      await saveState(state);
      return json(res, 200, result);
    }
    if (req.method === 'POST' && url.pathname === '/api/target/create-structure') {
      const b = await body(req);
      const base = b.baseDir || activeConfig(state).input?.bahanFolder;
      if (!base) return json(res, 400, { error: 'baseDir kosong' });
      const dirs = ['Visual', 'Audio', 'Lirik', 'Logo', 'Overlay', 'Bumper', 'Hasil'];
      for (const d of dirs) await mkdir(path.join(base, d), { recursive: true });
      return json(res, 201, { baseDir: base, dirs: dirs.map(d => path.join(base, d)) });
    }
    if (req.method === 'GET' && url.pathname === '/api/branding/presets')
      return json(res, 200, {
        presets: [
          {
            id: 'none',
            name: 'No Branding',
            patch: {
              branding: { bumperEnabled: false, logoEnabled: false, ctaEnabled: false, watermarkEnabled: false },
            },
          },
          {
            id: 'logo-only',
            name: 'Logo Only',
            patch: {
              branding: {
                logoEnabled: true,
                ctaEnabled: false,
                bumperEnabled: false,
                watermarkEnabled: false,
                logoPosition: 'Kanan Atas',
                logoScale: 18,
              },
            },
          },
          {
            id: 'logo-cta',
            name: 'Logo + CTA',
            patch: {
              branding: {
                logoEnabled: true,
                ctaEnabled: true,
                bumperEnabled: false,
                watermarkEnabled: false,
                ctaPreset: 'subscribe-lower-right',
                ctaPosition: 'Kanan Bawah',
              },
            },
          },
          {
            id: 'youtube-full',
            name: 'Full YouTube Branding',
            patch: {
              branding: {
                logoEnabled: true,
                ctaEnabled: true,
                bumperEnabled: true,
                watermarkEnabled: true,
                safeAreaPreset: 'youtube',
                ctaPreset: 'subscribe-lower-right',
                logoPosition: 'Kanan Atas',
                watermarkPosition: 'Kiri Bawah',
              },
            },
          },
          {
            id: 'shorts',
            name: 'Shorts Branding',
            patch: {
              branding: {
                logoEnabled: true,
                ctaEnabled: true,
                bumperEnabled: false,
                watermarkEnabled: true,
                safeAreaPreset: 'shorts',
                logoPosition: 'Kanan Atas',
                ctaPosition: 'Kanan Bawah',
                watermarkPosition: 'Kiri Bawah',
              },
            },
          },
        ],
      });
    if (req.method === 'POST' && url.pathname === '/api/branding/validate') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const br = config.branding || {};
      const warnings = [];
      const assets = {};
      for (const [key, file] of Object.entries({ logo: br.logo, bumper: br.bumperVideo, cta: br.ctaGreenscreen })) {
        if (!file) {
          assets[key] = { ok: false, missing: true };
          continue;
        }
        const info = await ffprobeInfo(file);
        assets[key] = info;
        if (!info.ok) warnings.push(`${key}: file tidak terbaca`);
        if ((key === 'bumper' || key === 'cta') && info.ok && !info.hasVideo)
          warnings.push(`${key}: video stream tidak ada`);
        if (key === 'bumper' && info.ok && info.duration && Number(br.bumperDuration || 3) > info.duration + 0.5)
          warnings.push('bumper: durasi setting lebih panjang dari file bumper');
      }
      return json(res, 200, { ok: warnings.length === 0, warnings, assets });
    }
    if (req.method === 'GET' && url.pathname === '/api/overlay/presets')
      return json(res, 200, {
        presets: [
          {
            id: 'clean',
            name: 'Clean',
            patch: {
              overlay: {
                stylePreset: 'clean',
                vignette: false,
                filmGrain: false,
                scanlines: false,
                frameBorder: false,
                darken: false,
              },
            },
          },
          {
            id: 'cinematic',
            name: 'Cinematic',
            patch: {
              overlay: {
                stylePreset: 'cinematic',
                vignette: true,
                vignetteStrength: 0.45,
                filmGrain: true,
                grainStrength: 8,
                letterbox: true,
                letterboxSize: 72,
                darken: true,
                darkenOpacity: 10,
              },
            },
          },
          {
            id: 'live-stream',
            name: 'Live Stream',
            patch: {
              overlay: {
                stylePreset: 'live-stream',
                timestamp: true,
                frameBorder: true,
                borderColor: '#22c55e',
                borderThickness: 4,
                lowerThirdEnabled: true,
                lowerThirdPosition: 'Bawah',
              },
            },
          },
          {
            id: 'retro',
            name: 'Retro Scanline',
            patch: {
              overlay: {
                stylePreset: 'retro',
                scanlines: true,
                scanlineOpacity: 8,
                filmGrain: true,
                grainStrength: 14,
                vignette: true,
                vignetteStrength: 0.3,
              },
            },
          },
          {
            id: 'dark-focus',
            name: 'Dark Focus',
            patch: {
              overlay: {
                stylePreset: 'dark-focus',
                darken: true,
                darkenOpacity: 22,
                vignette: true,
                vignetteStrength: 0.5,
              },
            },
          },
          {
            id: 'format-landscape',
            name: 'Format 16:9',
            patch: {
              overlay: {
                stylePreset: 'format-landscape',
                timestamp: true,
                timestampPosition: 'Kiri Atas',
                lowerThirdEnabled: true,
                lowerThirdPosition: 'Bawah',
                lowerThirdAt: 2,
                lowerThirdDuration: 5,
                darken: false,
                letterbox: false,
              },
            },
          },
          {
            id: 'format-vertical',
            name: 'Format 9:16',
            patch: {
              overlay: {
                stylePreset: 'format-vertical',
                timestamp: true,
                timestampPosition: 'Kanan Atas',
                lowerThirdEnabled: true,
                lowerThirdPosition: 'Tengah',
                lowerThirdAt: 2,
                lowerThirdDuration: 4,
                darken: true,
                darkenOpacity: 16,
                letterbox: false,
              },
            },
          },
          {
            id: 'format-square',
            name: 'Format 1:1',
            patch: {
              overlay: {
                stylePreset: 'format-square',
                timestamp: true,
                timestampPosition: 'Kiri Atas',
                lowerThirdEnabled: true,
                lowerThirdPosition: 'Bawah',
                lowerThirdAt: 2,
                lowerThirdDuration: 4,
                darken: true,
                darkenOpacity: 12,
                letterbox: false,
              },
            },
          },
        ],
      });
    if (req.method === 'POST' && url.pathname === '/api/overlay/validate') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const ov = config.overlay || {};
      const warnings = [];
      const assets = {};
      for (const [key, file] of Object.entries({ particle: ov.particleFile, overlay: ov.overlayFile })) {
        if (!file) {
          assets[key] = { ok: false, missing: true };
          continue;
        }
        const info = await ffprobeInfo(file);
        assets[key] = info;
        if (!info.ok) warnings.push(`${key}: file tidak terbaca`);
        if (key === 'particle' && info.ok && !info.hasVideo) warnings.push('particle: video stream tidak ada');
      }
      if (ov.lowerThirdEnabled && !ov.lowerThirdText) warnings.push('lower third aktif tapi teks kosong');
      if (ov.overlayEnabled && !ov.overlayFile) warnings.push('overlay asset aktif tapi file kosong');
      return json(res, 200, { ok: warnings.length === 0, warnings, assets });
    }
    if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, state);
    if (req.method === 'GET' && url.pathname === '/api/config') return json(res, 200, activeConfig(state));
    if (req.method === 'POST' && url.pathname === '/api/config/validate') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      return json(res, 200, validateRenderConfig(config, b));
    }
    if (req.method === 'POST' && url.pathname === '/api/config') {
      const patch = await body(req);
      const project = activeProject(state);
      project.config = deepMerge(project.config, patch);
      project.updatedAt = new Date().toISOString();
      addLog(state, 'config project disimpan.');
      await saveState(state);
      return json(res, 200, project.config);
    }
    if (req.method === 'GET' && url.pathname === '/api/projects')
      return json(res, 200, { activeProjectId: state.activeProjectId, projects: state.projects });
    if (req.method === 'POST' && url.pathname === '/api/projects') {
      const b = await body(req);
      const p = {
        id: safeId('project'),
        name: b.name || 'Project Baru',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: deepMerge(defaultConfig, b.config || {}),
      };
      state.projects.push(p);
      state.activeProjectId = p.id;
      addLog(state, `project dibuat: ${p.name}`);
      await saveState(state);
      return json(res, 201, p);
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/projects\/[^/]+\/activate$/)) {
      const id = url.pathname.split('/')[3];
      if (!state.projects.some(p => p.id === id)) return json(res, 404, { error: 'project tidak ditemukan' });
      state.activeProjectId = id;
      addLog(state, `project aktif: ${activeProject(state).name}`);
      await saveState(state);
      return json(res, 200, { activeProjectId: id });
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/projects\/[^\/]+\/rename$/)) {
      const id = url.pathname.split('/')[3];
      const b = await body(req);
      const project = state.projects.find(p => p.id === id);
      if (!project) return json(res, 404, { error: 'project tidak ditemukan' });
      project.name = b.name || project.name;
      project.updatedAt = new Date().toISOString();
      addLog(state, `project renamed: ${project.name}`);
      await saveState(state);
      return json(res, 200, project);
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/projects\/[^\/]+\/duplicate$/)) {
      const id = url.pathname.split('/')[3];
      const src = state.projects.find(p => p.id === id);
      if (!src) return json(res, 404, { error: 'project tidak ditemukan' });
      const dup = {
        id: safeId('project'),
        name: `${src.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: JSON.parse(JSON.stringify(src.config)),
      };
      state.projects.push(dup);
      addLog(state, `project diduplikasi: ${dup.name}`);
      await saveState(state);
      return json(res, 201, dup);
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/projects\/[^\/]+\/delete$/)) {
      const id = url.pathname.split('/')[3];
      if (state.projects.length <= 1) return json(res, 400, { error: 'tidak bisa hapus project terakhir' });
      const idx = state.projects.findIndex(p => p.id === id);
      if (idx < 0) return json(res, 404, { error: 'project tidak ditemukan' });
      const removed = state.projects.splice(idx, 1)[0];
      if (state.activeProjectId === id) state.activeProjectId = state.projects[0].id;
      addLog(state, `project dihapus: ${removed.name}`);
      await saveState(state);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && url.pathname.match(/^\/api\/projects\/[^\/]+\/export$/)) {
      const id = url.pathname.split('/')[3];
      const project = state.projects.find(p => p.id === id);
      if (!project) return json(res, 404, { error: 'project tidak ditemukan' });
      return json(res, 200, {
        version: 1,
        exportedAt: new Date().toISOString(),
        project: { name: project.name, config: project.config, createdAt: project.createdAt },
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/projects/import') {
      const b = await body(req);
      if (!b.project || !b.project.config) return json(res, 400, { error: 'Format file tidak valid' });
      const p = {
        id: safeId('project'),
        name: b.project.name || 'Project Import',
        createdAt: b.project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: deepMerge(defaultConfig, b.project.config),
      };
      state.projects.push(p);
      state.activeProjectId = p.id;
      addLog(state, `project diimport: ${p.name}`);
      await saveState(state);
      return json(res, 201, p);
    }
    if (req.method === 'GET' && url.pathname === '/api/presets') return json(res, 200, { presets: state.presets });
    if (req.method === 'POST' && url.pathname === '/api/presets') {
      const b = await body(req);
      const preset = { id: safeId('preset'), name: b.name || 'Preset Baru', config: b.config || activeConfig(state) };
      state.presets.push(preset);
      addLog(state, `preset disimpan: ${preset.name}`);
      await saveState(state);
      return json(res, 201, preset);
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/presets\/[^/]+\/apply$/)) {
      const id = url.pathname.split('/')[3];
      const preset = state.presets.find(p => p.id === id);
      if (!preset) return json(res, 404, { error: 'preset tidak ditemukan' });
      activeProject(state).config = deepMerge(activeProject(state).config, preset.config);
      addLog(state, `preset diterapkan: ${preset.name}`);
      await saveState(state);
      return json(res, 200, activeConfig(state));
    }
    if (req.method === 'GET' && url.pathname === '/api/templates') {
      return json(res, 200, { templates: state.templates || [] });
    }
    if (req.method === 'POST' && url.pathname === '/api/templates') {
      const b = await body(req);
      if (!state.templates) state.templates = [];
      const tpl = {
        id: safeId('tpl'),
        name: b.name || 'Template Baru',
        description: b.description || '',
        modules: b.modules || [],
        config: b.config || {},
        createdAt: new Date().toISOString(),
      };
      state.templates.push(tpl);
      addLog(state, `template disimpan: ${tpl.name}`);
      await saveState(state);
      return json(res, 201, tpl);
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/templates\/[^\/]+\/apply$/)) {
      const id = url.pathname.split('/')[3];
      const tpl = (state.templates || []).find(t => t.id === id);
      if (!tpl) return json(res, 404, { error: 'template tidak ditemukan' });
      activeProject(state).config = deepMerge(activeProject(state).config, tpl.config);
      addLog(state, `template diterapkan: ${tpl.name}`);
      await saveState(state);
      return json(res, 200, activeConfig(state));
    }
    if (req.method === 'DELETE' && url.pathname.match(/^\/api\/templates\/[^\/]+$/)) {
      const id = url.pathname.split('/')[3];
      if (!state.templates) return json(res, 404, { error: 'template tidak ditemukan' });
      const idx = state.templates.findIndex(t => t.id === id);
      if (idx < 0) return json(res, 404, { error: 'template tidak ditemukan' });
      const removed = state.templates.splice(idx, 1)[0];
      addLog(state, `template dihapus: ${removed.name}`);
      await saveState(state);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/media/scan') {
      const b = await body(req);
      const files = await scanDir(b.dir, b);
      const pairs = pairMedia(files, activeConfig(state));
      return json(res, 200, { files, summary: targetSummary(activeConfig(state), files, pairs), pairs });
    }
    if (req.method === 'POST' && url.pathname === '/api/target/inspect') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const dirs = [
        config.input?.bahanFolder,
        config.input?.visualFolder,
        config.input?.audioFolder,
        config.input?.lyricFolder,
      ].filter(Boolean);
      const all = [];
      for (const dir of dirs.length ? dirs : [b.dir].filter(Boolean))
        all.push(
          ...(await scanDir(dir, {
            recursive: b.recursive ?? true,
            maxDepth: b.maxDepth ?? 3,
            excludeDirs: config.input?.excludeOutputOnScan ? [config.input?.output] : [],
          })),
        );
      const uniqueRaw = [...new Map(all.map(f => [f.path, f])).values()];
      const unique = await enrichValidation(uniqueRaw, b.validateMedia === false ? 0 : 40);
      const pairs = pairMedia(unique, config);
      const diagnostics = await ffmpegDiagnostics();
      return json(res, 200, {
        files: unique,
        summary: targetSummary(config, unique, pairs),
        pairs,
        diagnostics,
        config,
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/target/auto-tune') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const files = b.files || [];
      const pairs = b.pairs && b.pairs.length ? b.pairs : pairMedia(files, config);
      const tune = autoTargetTune(config, files, pairs);
      const project = activeProject(state);
      project.config = deepMerge(project.config, tune.patch);
      addLog(state, 'auto target tune diterapkan.');
      await saveState(state);
      return json(res, 200, { ...tune, config: project.config });
    }
    if (req.method === 'POST' && url.pathname === '/api/target/create-batch') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const files =
        b.files ||
        (await scanDir(config.input?.bahanFolder || config.input?.audioFolder, {
          recursive: true,
          maxDepth: 3,
          excludeDirs: config.input?.excludeOutputOnScan ? [config.input?.output] : [],
        }));
      const pairs = (b.pairs && b.pairs.length ? b.pairs : pairMedia(files, config)).filter(x => x.audio && x.visual);
      const created = [];
      for (const item of pairs) {
        const out = ensureUniqueOutput(
          path.join(
            config.input.output || 'Hasil',
            item.outputName ||
              outputName(item.title || path.basename(item.audio).replace(/\.[^.]+$/, ''), config, created.length + 1),
          ),
          config.target?.overwrite,
        );
        const job = {
          id: safeId('job'),
          projectId: state.activeProjectId,
          title: item.title || path.basename(item.audio).replace(/\.[^.]+$/, ''),
          status: 'standby',
          progress: 0,
          speed: '0.0x',
          output: out,
          outputDir: config.input.output,
          input: { visual: item.visual, audio: item.audio, lyrics: item.lyrics || '' },
          config,
          createdAt: new Date().toISOString(),
        };
        state.jobs.push(job);
        created.push(job);
      }
      addLog(state, `${created.length} job dibuat dari Folder Bahan & Engine Target.`);
      await saveState(state);
      return json(res, 201, { created });
    }
    if (req.method === 'GET' && url.pathname === '/api/spectrum/presets')
      return json(res, 200, {
        presets: [
          {
            id: 'clean-wave',
            name: 'Clean Wave',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Wave',
                position: 'Bawah',
                height: 128,
                transparency: 78,
                colors: ['white'],
                progressBar: true,
                nowPlaying: true,
              },
            },
          },
          {
            id: 'neon-bars',
            name: 'Neon Bars',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Bar',
                position: 'Bawah',
                height: 160,
                transparency: 85,
                colors: ['#22c55e', '#38bdf8'],
                glow: true,
                glowStrength: 45,
                progressColor: '#22c55e',
              },
            },
          },
          {
            id: 'minimal-line',
            name: 'Minimal Line',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Line',
                height: 84,
                transparency: 65,
                colors: ['white'],
                progressStyle: 'thin',
                nowPlayingPosition: 'Atas',
              },
            },
          },
          {
            id: 'shorts-center',
            name: 'Shorts Center',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Wave',
                position: 'Tengah',
                height: 180,
                transparency: 72,
                colors: ['white', '#facc15'],
                nowPlayingPosition: 'Atas',
              },
            },
          },
          {
            id: 'format-landscape',
            name: 'Format 16:9',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Bar',
                position: 'Bawah',
                previewY: 75,
                y: 25,
                height: 128,
                transparency: 82,
                marginY: 32,
                nowPlaying: true,
                nowPlayingPosition: 'Atas',
                nowPlayingX: 50,
                nowPlayingY: 13,
                nowPlayingFontSize: 26,
                progressBar: true,
                widthMode: 'full',
              },
            },
          },
          {
            id: 'format-vertical',
            name: 'Format 9:16',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Wave',
                position: 'Tengah',
                previewY: 57,
                y: 7,
                height: 176,
                transparency: 74,
                marginY: 46,
                nowPlaying: true,
                nowPlayingPosition: 'Atas',
                nowPlayingX: 50,
                nowPlayingY: 12,
                nowPlayingFontSize: 28,
                progressBar: true,
                widthMode: 'full',
              },
            },
          },
          {
            id: 'format-square',
            name: 'Format 1:1',
            patch: {
              spectrum: {
                enabled: true,
                model: 'Wave',
                position: 'Bawah',
                previewY: 70,
                y: 20,
                height: 142,
                transparency: 78,
                marginY: 34,
                nowPlaying: true,
                nowPlayingPosition: 'Atas',
                nowPlayingX: 50,
                nowPlayingY: 14,
                nowPlayingFontSize: 24,
                progressBar: true,
                widthMode: 'full',
              },
            },
          },
        ],
      });
    if (req.method === 'POST' && url.pathname === '/api/spectrum/preview') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const audio = b.audio || config.input?.audio;
      const waveform = await waveformData(audio, b.seconds || 45, b.buckets || 96);
      const beats = detectBeatsFromPeaks(waveform.peaks, waveform.seconds || 45);
      const nowPlaying = parseNowPlaying(config, audio);
      return json(res, 200, { ok: waveform.ok, waveform, beats, nowPlaying, config: config.spectrum });
    }
    if (req.method === 'POST' && url.pathname === '/api/spectrum/analyze') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const audio = b.audio || config.input?.audio;
      const waveform = await waveformData(audio, b.seconds || 60, b.buckets || 160);
      const beats = detectBeatsFromPeaks(waveform.peaks, waveform.seconds || 60);
      const metadata = await ffprobeMetadata(audio);
      const nowPlaying = parseNowPlaying(config, audio);
      const tuned = tuneSpectrumFromWaveform(waveform, beats, config);
      return json(res, 200, {
        ok: waveform.ok,
        waveform,
        beats,
        metadata,
        nowPlaying,
        tuned,
        recommendedPatch: {
          spectrum: { beatSensitivity: tuned.sensitivity, height: tuned.height, transparency: tuned.transparency },
        },
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/audio/presets')
      return json(res, 200, {
        presets: [
          {
            id: 'youtube-music',
            name: 'YouTube Music',
            patch: {
              audio: {
                normalize: true,
                limiter: true,
                compressor: true,
                audioBitrate: '256k',
                bassGain: 1,
                trebleGain: 1,
                masterGain: 100,
              },
            },
          },
          {
            id: 'youtube-shorts',
            name: 'YouTube Shorts',
            patch: {
              audio: {
                normalize: true,
                limiter: true,
                compressor: true,
                audioBitrate: '192k',
                masterGain: 108,
                bassGain: 2,
                trebleGain: 2,
                reactiveFx: 'Beat Flash',
              },
            },
          },
          {
            id: 'tiktok-loud',
            name: 'TikTok Loud',
            patch: {
              audio: {
                normalize: true,
                limiter: true,
                compressor: true,
                masterGain: 115,
                bassGain: 3,
                trebleGain: 2,
                audioBitrate: '192k',
              },
            },
          },
          {
            id: 'podcast-clean',
            name: 'Podcast Clean',
            patch: {
              audio: {
                normalize: true,
                limiter: true,
                compressor: true,
                highPass: 80,
                lowPass: 12000,
                noiseGate: true,
                reactiveFx: 'Off',
              },
            },
          },
          {
            id: 'background-soft',
            name: 'Background Soft',
            patch: {
              audio: {
                normalize: true,
                limiter: true,
                masterGain: 85,
                bassGain: -1,
                trebleGain: -1,
                reactiveFx: 'Off',
              },
            },
          },
          {
            id: 'cinematic-bass',
            name: 'Cinematic Bass',
            patch: {
              audio: {
                normalize: true,
                limiter: true,
                compressor: true,
                bassGain: 5,
                midGain: -1,
                trebleGain: 1,
                masterGain: 105,
              },
            },
          },
        ],
      });
    if (req.method === 'POST' && url.pathname === '/api/audio/analyze') {
      const b = await body(req);
      const file = b.file || deepMerge(activeConfig(state), b.config || {}).input?.audio;
      const info = await ffprobeInfo(file);
      const loudness = await analyzeLoudness(file);
      const waveform = await waveformData(file, b.seconds || 45, b.buckets || 160);
      const beats = detectBeatsFromPeaks(waveform.peaks, waveform.seconds || 45);
      return json(res, 200, { file, info, loudness, waveform, beats });
    }
    if (req.method === 'POST' && url.pathname === '/api/audio/validate') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const au = config.audio || {};
      const files = [
        config.input?.audio,
        ...(au.introSongs || []),
        ...(au.songs || []),
        au.endingSong,
        au.ambientLoop,
        au.voiceTrack,
        au.effectTrack,
        ...(au.stems || []).map(x => x.file),
      ].filter(Boolean);
      const assets = [];
      for (const file of files) {
        const info = await ffprobeInfo(file);
        assets.push({ file, ...info });
      }
      const totalDuration = assets.filter(a => a.ok).reduce((n, a) => n + Number(a.duration || 0), 0);
      const loudness = await analyzeLoudness(config.input?.audio || files[0]);
      const waveform =
        b.withWaveform === false
          ? { ok: false, peaks: [] }
          : await waveformData(config.input?.audio || files[0], 45, 160);
      const beats = au.beatDetection === false ? [] : detectBeatsFromPeaks(waveform.peaks, waveform.seconds || 45);
      const safety = audioSafetyReport(config, assets, loudness);
      return json(res, 200, {
        ok: safety.ok,
        warnings: safety.warnings,
        assets,
        totalDuration,
        loudness,
        waveform,
        beats,
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/lyrics/presets')
      return json(res, 200, {
        presets: [
          {
            id: 'modern',
            name: 'Modern Clean',
            patch: {
              lyrics: {
                stylePreset: 'modern',
                font: 'Arial',
                scale: 30,
                outline: 2,
                shadow: 1,
                color: '#ffffff',
                highlightColor: '#22c55e',
                position: 'Bawah',
              },
            },
          },
          {
            id: 'karaoke',
            name: 'Karaoke Highlight',
            patch: {
              lyrics: {
                stylePreset: 'karaoke',
                karaoke: true,
                wordByWord: true,
                scale: 32,
                color: '#ffffff',
                highlightColor: '#facc15',
                outline: 2,
              },
            },
          },
          {
            id: 'shorts-bold',
            name: 'Shorts Bold',
            patch: {
              lyrics: {
                stylePreset: 'shorts-bold',
                uppercase: true,
                scale: 38,
                maxChars: 26,
                outline: 3,
                position: 'Tengah',
                safeArea: true,
              },
            },
          },
          {
            id: 'minimal',
            name: 'Minimal Subtitle',
            patch: {
              lyrics: { stylePreset: 'minimal', scale: 24, outline: 1, shadow: 0, color: '#eeeeee', position: 'Bawah' },
            },
          },
        ],
      });
    if (req.method === 'POST' && url.pathname === '/api/lyrics/parse') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const source = await readLyricSource(b);
      const parsed = b.file ? await readLyricsFile(b.file) : [];
      const rows = parsed.length
        ? parsed
        : String(source || '')
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line, i) => ({
              time: i * Number(config.lyrics?.lineDuration || 3),
              text: line.replace(/^\[[^\]]+\]/, '').trim(),
            }));
      return json(res, 200, { lines: rows, lrc: rowsToLrc(rows), srt: lrcRowsToSrt(rows), vtt: rowsToVtt(rows) });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/auto-align') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const source = await readLyricSource(b);
      const audio = b.audio || config.input?.audio;
      const info = await ffprobeInfo(audio);
      const duration = b.duration || info.duration || config.target?.duration || 180;
      const waveform =
        config.lyrics?.beatSnap === false ? { peaks: [] } : await waveformData(audio, Math.min(duration, 90), 180);
      const beats =
        config.lyrics?.beatSnap === false
          ? []
          : detectBeatsFromPeaks(waveform.peaks, waveform.seconds || Math.min(duration, 90));
      const rows = autoAlignLyrics(source, duration, config, beats);
      const format = b.format || config.lyrics?.exportFormat || 'srt';
      const outputFile =
        b.outputFile ||
        config.lyrics?.outputFile ||
        (config.input?.output ? path.join(config.input.output, `auto-lyrics.${format}`) : '');
      const exported = await saveLyricsExport(rows, format, config.lyrics?.autoSave === false ? '' : outputFile);
      const quality = scoreLyricTimeline(rows, duration, config, beats);
      return json(res, 200, {
        lines: rows,
        duration,
        beats,
        quality,
        lrc: rowsToLrc(rows),
        srt: lrcRowsToSrt(rows),
        vtt: rowsToVtt(rows),
        ...exported,
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/export') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const rows =
        b.lines || autoAlignLyrics(await readLyricSource(b), b.duration || config.target?.duration || 180, config);
      return json(
        res,
        200,
        await saveLyricsExport(
          rows,
          b.format || config.lyrics?.exportFormat || 'srt',
          b.outputFile || config.lyrics?.outputFile || '',
        ),
      );
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/validate') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const rows = b.lines || (config.lyrics?.file ? await readLyricsFile(config.lyrics.file) : []);
      const warnings = [];
      if (!rows.length) warnings.push('belum ada baris lirik');
      rows.forEach((r, i) => {
        if (!r.text) warnings.push(`baris ${i + 1}: teks kosong`);
        if (i > 0 && Number(r.time) <= Number(rows[i - 1].time)) warnings.push(`baris ${i + 1}: timestamp tidak naik`);
        if (String(r.text || '').length > Number(config.lyrics?.maxChars || 42))
          warnings.push(`baris ${i + 1}: terlalu panjang`);
      });
      const audioDur = await ffprobeInfo(config.input?.audio).then(x => x.duration || 0);
      if (audioDur && rows.at(-1)?.time > audioDur + 3) warnings.push('timestamp lirik melebihi durasi audio');
      const waveform =
        config.lyrics?.beatSnap === false
          ? { peaks: [] }
          : await waveformData(config.input?.audio, Math.min(audioDur || 45, 90), 180);
      const beats =
        config.lyrics?.beatSnap === false
          ? []
          : detectBeatsFromPeaks(waveform.peaks, waveform.seconds || Math.min(audioDur || 45, 90));
      const quality = scoreLyricTimeline(rows, audioDur || config.target?.duration || 180, config, beats);
      const allWarnings = [...new Set([...warnings, ...(quality.warnings || [])])];
      return json(res, 200, {
        ok: allWarnings.length === 0 || quality.score >= Number(config.lyrics?.qualityGate || 82),
        warnings: allWarnings,
        lineCount: rows.length,
        audioDuration: audioDur,
        beats,
        quality,
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/preview/file') {
      const file = url.searchParams.get('path') || '';
      const full = path.resolve(file);
      const allowed = path.resolve(workspaceDir, 'previews');
      if (!full.startsWith(allowed) || !existsSync(full)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('preview not found');
      }
      const buf = await readFile(full);
      res.writeHead(200, { 'content-type': mimeFor(full), 'cache-control': 'no-store', ...corsHeaders() });
      return res.end(buf);
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/diagnostics') {
      const b = await body(req);
      const config = previewConfig(activeConfig(state), b.config || {});
      return json(res, 200, await previewDiagnostics(config));
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/render') {
      const b = await body(req);
      const config = previewConfig(activeConfig(state), b.config || {});
      const diag = await previewDiagnostics(config);
      const validation = validateRenderConfig(config);
      if (!validation.ok)
        return json(res, 400, {
          ok: false,
          error: validation.errors.join(' '),
          errors: validation.errors,
          warnings: [...diag.warnings, ...validation.warnings],
          assets: diag.assets,
        });
      if (!diag.ok) return json(res, 400, { ok: false, warnings: diag.warnings, assets: diag.assets });
      const previewDir = path.join(workspaceDir, 'previews');
      await mkdir(previewDir, { recursive: true });
      const id = safeId('preview');
      const output = path.join(previewDir, `${id}.mp4`);
      const job = {
        id,
        title: b.title || config.input?.title || 'Preview Render',
        input: {
          visual: config.input?.visual,
          audio: config.input?.audio,
          lyrics: config.lyrics?.file || config.lyrics?.srtPath || '',
        },
        output,
        duration: config.target.duration,
        startAt: Number(config.preview?.startAt || b.startAt || 0),
      };
      const logs = [];
      const started = Date.now();
      const result = await renderJob(job, config, workspaceDir, {
        onLog: line => logs.push(String(line).slice(0, 500)),
        onCommand: line => logs.push(String(line).slice(0, 900)),
      });
      const statInfo = await stat(result.output).catch(() => null);
      const previewUrl = `/api/preview/file?path=${encodeURIComponent(result.output)}`;
      const project = activeProject(state);
      project.config.preview = deepMerge(project.config.preview || defaultConfig.preview, {
        lastUrl: previewUrl,
        lastOutput: result.output,
        lastGeneratedAt: new Date().toISOString(),
      });
      await saveState(state);
      return json(res, 200, {
        ok: true,
        id,
        url: previewUrl,
        output: result.output,
        size: statInfo?.size || 0,
        elapsedMs: Date.now() - started,
        duration: config.target.duration,
        startAt: Number(config.preview?.startAt || b.startAt || 0),
        resolution: config.target.resolution,
        safeArea: diag.safeArea,
        warnings: diag.warnings,
        logs: logs.slice(-20),
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/snapshot') {
      const b = await body(req);
      const config = previewConfig(
        activeConfig(state),
        deepMerge(b.config || {}, {
          preview: {
            duration: 1,
            startAt: Number(b.startAt ?? b.config?.preview?.startAt ?? 0),
            quality: b.config?.preview?.quality || 'draft',
          },
        }),
      );
      const diag = await previewDiagnostics(config);
      const validation = validateRenderConfig(config);
      if (!validation.ok)
        return json(res, 400, {
          ok: false,
          error: validation.errors.join(' '),
          errors: validation.errors,
          warnings: [...diag.warnings, ...validation.warnings],
          assets: diag.assets,
        });
      if (!diag.ok) return json(res, 400, { ok: false, warnings: diag.warnings, assets: diag.assets });
      const previewDir = path.join(workspaceDir, 'previews');
      await mkdir(previewDir, { recursive: true });
      const id = safeId('snapshot');
      const tempMp4 = path.join(previewDir, `${id}.mp4`);
      const output = path.join(previewDir, `${id}.png`);
      const job = {
        id,
        title: b.title || config.input?.title || 'Preview Snapshot',
        input: {
          visual: config.input?.visual,
          audio: config.input?.audio,
          lyrics: config.lyrics?.file || config.lyrics?.srtPath || '',
        },
        output: tempMp4,
        duration: 1,
        startAt: Number(config.preview?.startAt || 0),
      };
      const logs = [];
      await renderJob(job, config, workspaceDir, {
        onLog: line => logs.push(String(line).slice(0, 500)),
        onCommand: line => logs.push(String(line).slice(0, 900)),
      });
      const shot = await runCmd(FFMPEG, ['-y', '-i', tempMp4, '-frames:v', '1', output]);
      if (!shot.ok) return json(res, 500, { ok: false, error: shot.stderr || 'snapshot gagal', logs });
      const statInfo = await stat(output).catch(() => null);
      const snapshotUrl = `/api/preview/file?path=${encodeURIComponent(output)}`;
      const project = activeProject(state);
      project.config.preview = deepMerge(project.config.preview || defaultConfig.preview, {
        lastSnapshotUrl: snapshotUrl,
        lastSnapshotOutput: output,
      });
      await saveState(state);
      return json(res, 200, {
        ok: true,
        id,
        url: snapshotUrl,
        output,
        size: statInfo?.size || 0,
        startAt: Number(config.preview?.startAt || 0),
        safeArea: diag.safeArea,
        warnings: diag.warnings,
        logs: logs.slice(-20),
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/send-to-queue') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const diag = await previewDiagnostics(previewConfig(config, {}));
      const validation = validateRenderConfig(config);
      if (!validation.ok)
        return json(res, 400, {
          ok: false,
          error: validation.errors.join(' '),
          errors: validation.errors,
          warnings: [...diag.warnings, ...validation.warnings],
        });
      const job = {
        id: safeId('job'),
        projectId: state.activeProjectId,
        title: b.title || config.input?.title || `Render ${state.jobs.length + 1}`,
        status: 'standby',
        progress: 0,
        speed: '0.0x',
        output: b.output || '',
        outputDir: b.outputDir || config.input?.output,
        input: {
          visual: config.input?.visual,
          audio: config.input?.audio,
          lyrics: config.lyrics?.file || config.lyrics?.srtPath || '',
        },
        config,
        createdAt: new Date().toISOString(),
        approvedFromPreview: true,
        previewWarnings: diag.warnings,
      };
      state.jobs.push(job);
      addLog(state, `${job.title} dikirim dari preview ke antrian.`);
      await saveState(state);
      return json(res, 201, { job, warnings: diag.warnings });
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/live') {
      const b = await body(req);
      const config = previewConfig(activeConfig(state), b.config || {});
      const logs = [];
      let lastProgress = null;
      try {
        const result = await generateLivePreview(config, {
          startAt: Number(b.startAt || 0),
          duration: Number(b.duration || 10),
          quality: b.quality || 'draft',
          fps: Number(b.fps || 15),
          width: Number(b.width || 640),
          height: Number(b.height || 360),
          workspaceDir,
          onProgress: p => {
            lastProgress = p;
          },
          onLog: line => logs.push(String(line).slice(0, 500)),
        });
        return json(res, 200, { ...result, logs: logs.slice(-20), progress: lastProgress });
      } catch (e) {
        return json(res, 500, { ok: false, error: 'Preview live gagal. Periksa log server.', logs });
      }
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/full') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const logs = [];
      let lastProgress = null;
      try {
        const result = await generateFullPreview(config, {
          startAt: Number(b.startAt || 0),
          duration: Number(b.duration || 10),
          workspaceDir,
          onProgress: p => {
            lastProgress = p;
          },
          onLog: line => logs.push(String(line).slice(0, 500)),
        });
        return json(res, 200, { ...result, logs: logs.slice(-20), progress: lastProgress });
      } catch (e) {
        return json(res, 500, { ok: false, error: 'Preview full gagal. Periksa log server.', logs });
      }
    }
    if (req.method === 'POST' && url.pathname === '/api/preview/cleanup') {
      try {
        const result = await cleanupPreviews(workspaceDir, Number(req.body?.maxAge || 3600000));
        return json(res, 200, result);
      } catch (e) {
        return json(res, 500, { ok: false, error: 'Cleanup preview gagal.' });
      }
    }
    if (req.method === 'GET' && url.pathname === '/api/performance/status')
      return json(res, 200, await performanceStatus(state));
    if (req.method === 'GET' && url.pathname === '/api/performance/presets')
      return json(res, 200, {
        presets: [
          { id: 'balanced', name: 'Balanced', description: 'Aman untuk render harian' },
          { id: 'turbo', name: 'Turbo Render', description: 'Prioritaskan kecepatan, kualitas preview turun' },
          { id: 'quality', name: 'Quality Max', description: 'Prioritaskan kualitas output' },
          { id: 'eco', name: 'Eco / Laptop Safe', description: 'Lebih ringan untuk laptop/panas' },
        ],
      });
    if (req.method === 'POST' && url.pathname === '/api/performance/apply') {
      const b = await body(req);
      const patch = performancePatch(b.mode || 'balanced');
      const project = activeProject(state);
      project.config = deepMerge(project.config, patch);
      state.queue.concurrency = project.config.performance.queueConcurrency;
      addLog(state, `preset performa diterapkan: ${project.config.performance.mode}`);
      await saveState(state);
      return json(res, 200, { config: project.config, patch, status: await performanceStatus(state) });
    }
    if (req.method === 'POST' && url.pathname === '/api/performance/settings') {
      const b = await body(req);
      const project = activeProject(state);
      project.config.performance = deepMerge(
        project.config.performance || defaultConfig.performance,
        b.performance || b,
      );
      if (project.config.performance.queueConcurrency)
        state.queue.concurrency = Number(project.config.performance.queueConcurrency);
      addLog(state, 'setting performa disimpan.');
      await saveState(state);
      return json(res, 200, { config: project.config, status: await performanceStatus(state) });
    }
    if (req.method === 'POST' && url.pathname === '/api/performance/optimize') {
      const status = await performanceStatus(state);
      let mode = 'balanced';
      if (status.metrics.cpu > 80 || status.metrics.memory > 82) mode = 'eco';
      else if (status.metrics.activeRenders === 0 && status.metrics.queueStandby > 3 && status.encoder !== 'cpu')
        mode = 'turbo';
      const patch = performancePatch(mode);
      return json(res, 200, {
        recommendedMode: mode,
        patch,
        status,
        reasons: status.warnings.length ? status.warnings : ['Sistem aman, balanced direkomendasikan.'],
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/thumbnail/generate') {
      const b = await body(req);
      const result = await generateThumbnails(b);
      return json(res, 200, result);
    }
    if (req.method === 'GET' && url.pathname === '/api/history') {
      const page = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 20);
      const status = url.searchParams.get('status') || '';
      return json(res, 200, getHistory({ page, limit, status }));
    }
    if (req.method === 'GET' && url.pathname === '/api/history/stats') {
      return json(res, 200, getHistoryStats());
    }
    if (req.method === 'POST' && url.pathname === '/api/history/clear') {
      clearHistory();
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/queue/summary') return json(res, 200, queueSummary(state));
    if (req.method === 'POST' && url.pathname === '/api/queue/settings') {
      const b = await body(req);
      state.queue = deepMerge(state.queue || defaultState.queue, b);
      addLog(state, 'setting antrian disimpan.');
      await saveState(state);
      return json(res, 200, state.queue);
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/start') {
      const b = await body(req);
      if (b.concurrency) state.queue.concurrency = Number(b.concurrency);
      state.queue.paused = false;
      state.queue.running = true;
      await saveState(state);
      runQueueLoop();
      return json(res, 202, queueSummary(await loadState()));
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/pause') {
      state.queue.paused = true;
      addLog(state, 'antrian dipause.');
      await saveState(state);
      return json(res, 200, queueSummary(state));
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/resume') {
      state.queue.paused = false;
      addLog(state, 'antrian dilanjutkan.');
      await saveState(state);
      runQueueLoop();
      return json(res, 202, queueSummary(state));
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/stop') {
      requestQueueStop();
      state.queue.running = false;
      state.queue.paused = false;
      addLog(state, 'permintaan stop antrian.');
      await saveState(state);
      return json(res, 200, queueSummary(state));
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/retry-failed') {
      let c = 0;
      for (const j of state.jobs)
        if (j.status === 'failed' || j.status === 'cancelled') {
          j.status = 'standby';
          j.progress = 0;
          j.error = '';
          c++;
        }
      addLog(state, `${c} job gagal dikembalikan ke standby.`);
      await saveState(state);
      return json(res, 200, { retried: c, ...queueSummary(state) });
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/clear-done') {
      const before = state.jobs.length;
      state.jobs = state.jobs.filter(j => j.status !== 'done');
      addLog(state, `${before - state.jobs.length} job selesai dibersihkan.`);
      await saveState(state);
      return json(res, 200, { removed: before - state.jobs.length, ...queueSummary(state) });
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/clear-failed') {
      const before = state.jobs.length;
      state.jobs = state.jobs.filter(j => j.status !== 'failed' && j.status !== 'cancelled');
      addLog(state, `${before - state.jobs.length} job gagal dibersihkan.`);
      await saveState(state);
      return json(res, 200, { removed: before - state.jobs.length, ...queueSummary(state) });
    }
    if (req.method === 'POST' && url.pathname === '/api/queue/reorder') {
      const b = await body(req);
      const order = Array.isArray(b.order) ? b.order : [];
      const map = new Map(state.jobs.map(j => [j.id, j]));
      state.jobs = [...order.map(id => map.get(id)).filter(Boolean), ...state.jobs.filter(j => !order.includes(j.id))];
      addLog(state, 'urutan antrian diperbarui.');
      await saveState(state);
      return json(res, 200, queueSummary(state));
    }
    if (req.method === 'POST' && url.pathname === '/api/logs/clear') {
      state.logs = ['Log dibersihkan.'];
      await saveState(state);
      return json(res, 200, { ok: true, logs: state.logs });
    }
    if (req.method === 'POST' && url.pathname === '/api/render/validate') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const validation = validateRenderConfig(config, {
        visual: b.input?.visual,
        audio: b.input?.audio,
        outputDir: b.outputDir || config.input?.output,
      });
      const estimate = estimateRender(config, [], []);
      return json(res, validation.ok ? 200 : 400, {
        ok: validation.ok,
        errors: validation.errors,
        warnings: validation.warnings,
        estimate,
        error: validation.errors.join(' '),
      });
    }
    const move = matchRoute(req, url, 'POST', /^\/api\/jobs\/([^/]+)\/move$/);
    if (move) {
      const b = await body(req);
      const idx = state.jobs.findIndex(j => j.id === move[1]);
      if (idx < 0) return json(res, 404, { error: 'job tidak ditemukan' });
      const [job] = state.jobs.splice(idx, 1);
      let to =
        b.to === 'top'
          ? 0
          : b.to === 'bottom'
            ? state.jobs.length
            : Math.max(0, Math.min(state.jobs.length, Number(b.to ?? idx)));
      state.jobs.splice(to, 0, job);
      await saveState(state);
      return json(res, 200, queueSummary(state));
    }
    const dup = url.pathname.match(/^\/api\/jobs\/([^/]+)\/duplicate$/);
    if (req.method === 'POST' && dup) {
      const job = state.jobs.find(j => j.id === dup[1]);
      if (!job) return json(res, 404, { error: 'job tidak ditemukan' });
      const cloned = cloneJob(job);
      state.jobs.push(cloned);
      addLog(state, `job diduplikasi: ${job.title}`);
      await saveState(state);
      return json(res, 201, cloned);
    }
    const removeJob = url.pathname.match(/^\/api\/jobs\/([^/]+)\/remove$/);
    if (req.method === 'POST' && removeJob) {
      const idx = state.jobs.findIndex(j => j.id === removeJob[1]);
      if (idx < 0) return json(res, 404, { error: 'job tidak ditemukan' });
      const [job] = state.jobs.splice(idx, 1);
      addLog(state, `job dihapus: ${job.title}`);
      await saveState(state);
      return json(res, 200, { removed: job.id });
    }
    if (req.method === 'GET' && url.pathname === '/api/jobs')
      return json(res, 200, { jobs: state.jobs, logs: state.logs });
    if (req.method === 'POST' && url.pathname === '/api/jobs') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const validation = validateRenderConfig(config, {
        visual: b.input?.visual,
        audio: b.input?.audio,
        outputDir: b.outputDir || config.input.output,
      });
      if (!validation.ok)
        return json(res, 400, {
          ok: false,
          error: validation.errors.join(' '),
          errors: validation.errors,
          warnings: validation.warnings,
        });
      const job = {
        id: safeId('job'),
        projectId: state.activeProjectId,
        title: b.title || config.input.title || `Render ${state.jobs.length + 1}`,
        status: 'standby',
        progress: 0,
        speed: '0.0x',
        output: b.output || '',
        outputDir: b.outputDir || config.input.output,
        input: b.input || {},
        config,
        createdAt: new Date().toISOString(),
        validationWarnings: validation.warnings,
      };
      state.jobs.push(job);
      addLog(state, `${job.title} masuk antrian.`);
      await saveState(state);
      return json(res, 201, job);
    }
    if (req.method === 'POST' && url.pathname === '/api/jobs/batch') {
      const b = await body(req);
      const files = Array.isArray(b.items) ? b.items : [];
      const created = [];
      const skipped = [];
      for (const item of files) {
        const config = deepMerge(activeConfig(state), item.config || {});
        const input = item.input || { visual: item.visual, audio: item.audio, lyrics: item.lyrics };
        const validation = validateRenderConfig(config, {
          visual: input.visual,
          audio: input.audio,
          outputDir: item.outputDir || config.input.output,
        });
        if (!validation.ok) {
          skipped.push({ title: item.title || item.audio || item.visual || 'Batch', errors: validation.errors });
          continue;
        }
        const job = {
          id: safeId('job'),
          projectId: state.activeProjectId,
          title: item.title || path.basename(item.audio || item.visual || `Batch ${created.length + 1}`),
          status: 'standby',
          progress: 0,
          speed: '0.0x',
          outputDir: item.outputDir || config.input.output,
          input,
          config,
          createdAt: new Date().toISOString(),
          validationWarnings: validation.warnings,
        };
        state.jobs.push(job);
        created.push(job);
      }
      addLog(
        state,
        `${created.length} job batch dibuat${skipped.length ? `, ${skipped.length} dilewati validasi` : ''}.`,
      );
      await saveState(state);
      return json(res, 201, { created, skipped });
    }
    const start = url.pathname.match(/^\/api\/jobs\/([^/]+)\/start$/);
    if (req.method === 'POST' && start) return json(res, 202, await startJob(start[1], processes));
    if (req.method === 'POST' && url.pathname === '/api/jobs/start-next') {
      const next = state.jobs.find(j => j.status === 'standby' || j.status === 'failed');
      if (!next) return json(res, 404, { error: 'tidak ada job standby' });
      return json(res, 202, await startJob(next.id, processes));
    }
    const cancel = url.pathname.match(/^\/api\/jobs\/([^/]+)\/cancel$/);
    if (req.method === 'POST' && cancel) {
      const id = cancel[1];
      const child = processes.get(id);
      if (child) child.kill('SIGTERM');
      const j = state.jobs.find(x => x.id === id);
      if (j) {
        j.status = 'cancelled';
        j.error = 'Dibatalkan user';
      }
      addLog(state, `job dibatalkan: ${id}`);
      await saveState(state);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/jobs/reset') {
      for (const child of processes.values()) child.kill('SIGTERM');
      processes.clear();
      state.jobs = [];
      addLog(state, 'antrian direset.');
      await saveState(state);
      return json(res, 200, { ok: true });
    }
    // --- STUB ENDPOINTS (belum implementasi penuh, mencegah 404) ---
    if (req.method === 'POST' && url.pathname === '/api/audio/preview') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const audio = config.input?.audio;
      if (!audio) return json(res, 400, { error: 'File audio belum dipilih' });
      const info = await ffprobeInfo(audio);
      if (!info.ok || !info.hasAudio) return json(res, 400, { error: 'File audio tidak valid' });
      const previewDir = path.join(workspaceDir, 'previews');
      await mkdir(previewDir, { recursive: true });
      const duration = Math.max(2, Math.min(30, Number(b.duration || 10)));
      const output = path.join(previewDir, `${safeId('audio-preview')}.mp3`);
      const preview = await runCmd(FFMPEG, [
        '-y',
        '-ss',
        '0',
        '-t',
        String(duration),
        '-i',
        audio,
        '-vn',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        output,
      ]);
      if (!preview.ok) return json(res, 500, { error: preview.stderr || 'Gagal membuat preview audio' });
      return json(res, 200, {
        ok: true,
        url: `/api/media/file?path=${encodeURIComponent(output)}`,
        output,
        duration,
        stub: false,
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/fetch') {
      const b = await body(req);
      return json(res, 200, {
        ok: false,
        lyrics: '',
        source: b.source || 'none',
        stub: true,
        message: 'Fitur fetch lyrics online belum tersedia. Tempel lirik manual atau gunakan file LRC/SRT.',
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/transcribe') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const audio = b.audio || config.input?.audio;
      const lyricFile = config.lyrics?.file;
      if (lyricFile && existsSync(lyricFile)) {
        const parsed = await readLyricsFile(lyricFile);
        const text = parsed.map(r => r.text).join('\n');
        return json(res, 200, {
          ok: true,
          text,
          segments: parsed,
          confidence: 0.85,
          source: 'file-fallback',
          message: `Parsed ${parsed.length} baris dari file lirik yang sudah ada.`,
        });
      }
      if (!audio) return json(res, 400, { error: 'File audio belum dipilih dan file lirik tidak tersedia.' });
      return json(res, 200, {
        ok: false,
        text: '',
        segments: [],
        confidence: 0,
        message: 'AI transcription engine (Whisper) belum terinstall. Gunakan file LRC/SRT atau tempel lirik manual.',
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/smart-sync') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const audio = config.input?.audio;
      const lines = b.lines || [];
      if (!lines.length) return json(res, 400, { error: 'Belum ada baris lirik untuk disinkronisasi.' });
      const info = audio ? await ffprobeInfo(audio) : { duration: 0 };
      const duration = info.duration || config.target?.duration || 180;
      const waveform = audio ? await waveformData(audio, Math.min(duration, 90), 180) : { peaks: [] };
      const beats = detectBeatsFromPeaks(waveform.peaks, waveform.seconds || Math.min(duration, 90));
      const text = lines.map(r => r.text || '').join('\n');
      const syncedLines = autoAlignLyrics(text, duration, config, beats);
      const quality = scoreLyricTimeline(syncedLines, duration, config, beats);
      return json(res, 200, {
        ok: true,
        syncedLines,
        accuracy: Math.min(0.95, (quality.score || 0) / 100),
        beats,
        quality,
        duration,
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/detect-language') {
      const b = await body(req);
      const text = b.text || (b.lines || []).map(r => r.text || '').join(' ');
      if (!text.trim()) return json(res, 400, { error: 'Tidak ada teks untuk dideteksi.' });
      const arabic = /[؀-ۿ]/.test(text);
      const cjk = /[　-鿿가-힯]/.test(text);
      const latin = /[a-zA-Z]/.test(text);
      const indo =
        /\b(dan|yang|di|ke|dari|untuk|dengan|adalah|ini|itu|atau|tidak|akan|sudah|juga|bisa|saya|kamu|kami)\b/i.test(
          text,
        );
      let lang = 'en';
      let name = 'English';
      let conf = 0.5;
      if (arabic) {
        lang = 'ar';
        name = 'Arabic';
        conf = 0.8;
      } else if (cjk) {
        lang = 'ja';
        name = 'Japanese/CJK';
        conf = 0.7;
      } else if (indo) {
        lang = 'id';
        name = 'Indonesian';
        conf = 0.75;
      } else if (latin) {
        lang = 'en';
        name = 'English';
        conf = 0.6;
      }
      return json(res, 200, { ok: true, detectedLanguage: lang, languageName: name, confidence: conf });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/transliterate') {
      const b = await body(req);
      const text = b.text || '';
      if (!text.trim()) return json(res, 400, { error: 'Tidak ada teks untuk ditransliterasi.' });
      const transliterated = text
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .replace(/[؀-ۿ]+/g, m => `[${m}]`)
        .replace(/[　-鿿]+/g, m => `[${m}]`);
      return json(res, 200, {
        ok: true,
        transliterated,
        from: b.from || 'auto',
        style: b.style || 'romanized',
        message: 'Transliterasi dasar (strip diacritics). Untuk hasil lebih akurat, gunakan engine khusus.',
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/load-preview') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const audio = config.input?.audio;
      const info = audio ? await ffprobeInfo(audio) : { duration: 0 };
      const waveform = audio ? await waveformData(audio, Math.min(info.duration || 30, 60), 120) : { peaks: [] };
      const beats = detectBeatsFromPeaks(waveform.peaks, waveform.seconds || 30);
      return json(res, 200, { ok: true, duration: info.duration || 0, waveform, beats });
    }
    if (req.method === 'POST' && url.pathname === '/api/branding/bumper/preview') {
      const b = await body(req);
      const config = deepMerge(activeConfig(state), b.config || {});
      const bumper = config.branding?.bumperVideo;
      if (!bumper) return json(res, 400, { error: 'File bumper belum dipilih' });
      const info = await ffprobeInfo(bumper);
      if (!info.ok) return json(res, 400, { error: `File bumper tidak valid: ${info.error || bumper}` });
      return json(res, 200, {
        ok: true,
        url: `/api/media/file?path=${encodeURIComponent(bumper)}`,
        duration: info.duration || 0,
        hasVideo: info.hasVideo,
        hasAudio: info.hasAudio,
        resolution: info.streams?.find(s => s.type === 'video')
          ? `${info.streams.find(s => s.type === 'video').width}x${info.streams.find(s => s.type === 'video').height}`
          : null,
      });
    }
    // --- END STUB ENDPOINTS ---

    return json(res, 404, { error: 'not found' });
  } catch (error) {
    const status = Number(error?.status || 500);
    if (status >= 500) console.error('API error:', error);
    return ctx.http.sendCaughtError(res, error);
  }
}
