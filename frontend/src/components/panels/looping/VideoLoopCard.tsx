import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { cn } from '../../../utils/cn';
import { getDeep } from '../../../lib/config-path';
import { cleanUiText, formatDuration } from '../../../lib/format';
import { ActionButtonGroup, Callout, Card, ChipGroup, Chip, ProgressBar } from '../../ui/design-system-components';
import type { LoopingCardProps, LoopingEngineState } from './types';

interface VideoLoopCardProps extends LoopingCardProps {
  engine: LoopingEngineState;
  actions: {
    renderLoop: () => Promise<void>;
    validateLoop: () => Promise<void>;
    cancelLoop: () => Promise<void>;
    previewSeam: () => Promise<void>;
    autoDetect: () => Promise<void>;
  };
}

export function VideoLoopCard({ config, updateConfig, engine, actions }: VideoLoopCardProps) {
  const {
    input,
    setInput,
    duration,
    setDuration,
    output,
    setOutput,
    mode,
    setMode,
    loopStyle,
    setLoopStyle,
    crossfade,
    setCrossfade,
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
    muteAudio,
    setMuteAudio,
    audioFade,
    setAudioFade,
    preset,
    setPreset,
    message,
    busy,
    result,
    loopJob,
    validation,
    analysis,
  } = engine;

  return (
    <Card title="Video Loop">
      <Field label="Video Pendek">
        <PathInput value={input} onChange={setInput} filter="video" />
      </Field>
      <Field label="Durasi Manual Detik">
        <TextInput
          type="number"
          value={duration}
          onChange={v => setDuration(Number(v || 1))}
          placeholder="Isi manual, contoh 3600 untuk 1 jam"
        />
      </Field>
      <Field label="Mode Render">
        <SelectInput value={mode} onChange={setMode}>
          <option value="copy">Cepat / copy stream</option>
          <option value="encode">Encode ulang stabil</option>
        </SelectInput>
      </Field>
      <Field label="Output MP4">
        <PathInput
          value={output}
          onChange={setOutput}
          kind="save"
          filter="video"
          placeholder="Kosongkan untuk output otomatis"
        />
      </Field>
      <Field label="Tipe Loop">
        <SelectInput value={loopStyle} onChange={setLoopStyle}>
          <option value="normal">Normal repeat</option>
          <option value="crossfade">Crossfade halus</option>
          <option value="pingpong">Ping-pong maju mundur</option>
          <option value="morph">Morph blend</option>
          <option value="optical-flow">Optical Flow</option>
        </SelectInput>
      </Field>
      <Field label="Crossfade Detik">
        <TextInput type="number" value={crossfade} onChange={v => setCrossfade(Number(v || 0))} />
      </Field>
      <Field label="Output Preset">
        <SelectInput value={preset} onChange={setPreset}>
          <option value="source">Sesuai sumber</option>
          <option value="youtube1080">YouTube 1080p</option>
          <option value="shorts">Shorts/Reels 1080x1920</option>
          <option value="tiktok">TikTok 1080x1920</option>
          <option value="square">Square 1080</option>
          <option value="wallpaper4k">Wallpaper 4K</option>
        </SelectInput>
      </Field>
      <Field label="Trim In Detik">
        <TextInput type="number" value={trimStart} onChange={v => setTrimStart(Number(v || 0))} />
      </Field>
      <Field label="Trim Out Detik">
        <TextInput type="number" value={trimEnd} onChange={v => setTrimEnd(Number(v || 0))} />
      </Field>
      <div className="flex items-center gap-2">
        <Check label="Mute audio" checked={muteAudio} onChange={setMuteAudio} />
        <Check label="Fade audio" checked={audioFade} onChange={setAudioFade} />
      </div>
      <ChipGroup>
        <Chip active={duration === 60} onClick={() => setDuration(60)}>
          1 menit
        </Chip>
        <Chip active={duration === 300} onClick={() => setDuration(300)}>
          5 menit
        </Chip>
        <Chip active={duration === 600} onClick={() => setDuration(600)}>
          10 menit
        </Chip>
        <Chip active={duration === 1800} onClick={() => setDuration(1800)}>
          30 menit
        </Chip>
        <Chip active={duration === 3600} onClick={() => setDuration(3600)}>
          1 jam
        </Chip>
      </ChipGroup>

      {/* Advanced Loop Detection */}
      <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Advanced Loop Detection</h4>
        <Field label="Detection Method">
          <SelectInput
            value={getDeep(config, 'loop.detectionMethod', 'auto')}
            onChange={v => updateConfig('loop.detectionMethod', v)}
          >
            <option value="auto">Auto (All Methods)</option>
            <option value="motion">Motion Analysis</option>
            <option value="scene">Scene Detection</option>
            <option value="optical-flow">Optical Flow</option>
            <option value="color">Color Histogram</option>
            <option value="audio">Audio Sync</option>
          </SelectInput>
        </Field>
        <Field label="Sensitivity">
          <SelectInput
            value={getDeep(config, 'loop.sensitivity', 'medium')}
            onChange={v => updateConfig('loop.sensitivity', v)}
          >
            <option value="low">Low (Loose)</option>
            <option value="medium">Medium</option>
            <option value="high">High (Strict)</option>
            <option value="extreme">Extreme</option>
          </SelectInput>
        </Field>
        <Field label="Min Loop Duration">
          <TextInput
            type="number"
            value={getDeep(config, 'loop.minDuration', 2)}
            onChange={v => updateConfig('loop.minDuration', v)}
            placeholder="seconds"
          />
        </Field>
        <Check
          label="Enable Motion Tracking"
          checked={Boolean(getDeep(config, 'loop.motionTracking', true))}
          onChange={v => updateConfig('loop.motionTracking', v)}
        />
        <Check
          label="Enable Scene Change Detection"
          checked={Boolean(getDeep(config, 'loop.sceneDetection', true))}
          onChange={v => updateConfig('loop.sceneDetection', v)}
        />
        <Check
          label="Enable Optical Flow Analysis"
          checked={Boolean(getDeep(config, 'loop.opticalFlow', false))}
          onChange={v => updateConfig('loop.opticalFlow', v)}
        />
        <Callout type="tip">
          Advanced detection menganalisis motion, scene cuts, dan optical flow untuk menemukan loop point terbaik secara
          otomatis.
        </Callout>
      </div>

      <ActionButtonGroup
        actions={[
          {
            id: 'validate',
            label: 'Validasi Output',
            icon: '✅',
            variant: 'secondary',
            disabled: busy || !input,
            onClick: actions.validateLoop,
          },
          {
            id: 'detect',
            label: 'Auto Detect Loop',
            icon: '🔍',
            variant: 'secondary',
            disabled: busy || !input,
            onClick: actions.autoDetect,
          },
          {
            id: 'preview',
            label: 'Preview Sambungan',
            icon: '🎞️',
            variant: 'secondary',
            disabled: busy || !input,
            onClick: actions.previewSeam,
          },
          {
            id: 'render',
            label: busy ? 'Memproses...' : 'Buat Looping',
            icon: '🔁',
            variant: 'primary',
            disabled: busy || !input || duration < 1 || loopJob?.status === 'running',
            onClick: actions.renderLoop,
          },
          ...(loopJob?.status === 'running'
            ? [{ id: 'cancel', label: 'Batal', icon: '⛔', variant: 'danger' as const, onClick: actions.cancelLoop }]
            : []),
        ]}
      />
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium',
            result?.ok
              ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
              : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
          )}
          role="status"
          aria-live="polite"
        >
          {cleanUiText(message)}
        </div>
      )}
      {loopJob?.status === 'running' && (
        <div className="px-3 py-2 flex flex-col gap-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
          <b className="text-[10px] text-[var(--accent-primary)]">Progress {loopJob.progress || 0}%</b>
          <ProgressBar value={loopJob.progress || 0} max={100} tone="primary" />
          <span className="text-[9px] text-[var(--text-muted)]">
            Elapsed {formatDuration(loopJob.elapsedSeconds)} / ETA {formatDuration(loopJob.etaSeconds)}
          </span>
          <span className="text-[9px] text-[var(--text-muted)]">Rendered {loopJob.renderedSeconds || 0}s</span>
        </div>
      )}
      {validation && (
        <div
          className={cn(
            'px-3 py-2 rounded-[var(--radius-md)] text-[10px]',
            validation.ok
              ? 'bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30'
              : 'bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30',
          )}
        >
          <b className="block mb-1 text-[11px]">{validation.ok ? 'Validasi siap' : 'Validasi gagal'}</b>
          <span className="text-[var(--text-muted)] block">
            Input {Number(validation.inputDuration || 0).toFixed(2)}s / loop {validation.loopsNeeded || 0}x
          </span>
          {validation.disk?.ok && (
            <span className="text-[var(--text-muted)] block">Disk kosong {validation.disk.freeGB} GB</span>
          )}
          {(validation.errors || []).map((x: string) => (
            <small key={x} className="block text-[var(--accent-danger)]">
              {x}
            </small>
          ))}
          {(validation.warnings || []).map((x: string) => (
            <small key={x} className="block text-[var(--accent-warning)]">
              {x}
            </small>
          ))}
        </div>
      )}
      {analysis?.best && (
        <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30">
          <b className="text-[10px] text-[var(--accent-success)] block mb-1">Loop score {analysis.best.score}/100</b>
          <span className="text-[var(--text-muted)] text-[10px] block">{analysis.best.label}</span>
          <span className="text-[var(--text-muted)] text-[10px] block">
            Trim rekomendasi: {analysis.best.trimStart}s - {analysis.best.trimEnd}s
          </span>
          {analysis.warnings?.map((w: string) => (
            <small key={w} className="block text-[var(--accent-warning)]">
              {w}
            </small>
          ))}
        </div>
      )}
    </Card>
  );
}
