
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export function safeId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function hasFile(file) { return Boolean(file && existsSync(file)); }
export function ext(file) { return path.extname(file || '').toLowerCase(); }
export const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']);
export const videoExts = new Set(['.mp4', '.mov', '.mkv', '.webm', '.avi']);
export const audioExts = new Set(['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg']);
export function isImage(file) { return imageExts.has(ext(file)); }
export function isVideo(file) { return videoExts.has(ext(file)); }
export function isAudio(file) { return audioExts.has(ext(file)); }
export function escapeFilter(file) { return String(file).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'"); }
export function escapeDrawText(text) { return String(text || '').replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/%/g, '\\%'); }

export function parseLrcText(text) {
  const rows = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const matches = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    const lyric = raw.replace(/(?:\[\d{1,2}:\d{2}(?:\.\d{1,3})?\])+/g, '').trim();
    for (const m of matches) {
      const min = Number(m[1]); const sec = Number(m[2]); const ms = Number((m[3] || '0').padEnd(3, '0'));
      rows.push({ time: min * 60 + sec + ms / 1000, text: lyric });
    }
  }
  return rows.sort((a,b)=>a.time-b.time);
}

export function formatSrtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

export function lrcRowsToSrt(rows, defaultDuration = 3) {
  return rows.map((row, i) => {
    const end = rows[i+1]?.time ?? row.time + defaultDuration;
    return `${i+1}\n${formatSrtTime(row.time)} --> ${formatSrtTime(Math.max(row.time + 0.8, end - 0.08))}\n${row.text || ' '}\n`;
  }).join('\n');
}

export async function readLyricsFile(file) {
  if (!hasFile(file)) return [];
  const text = await readFile(file, 'utf8');
  if (ext(file) === '.lrc') return parseLrcText(text);
  if (ext(file) === '.srt') return text.split(/\n\n+/).map((block, i) => {
    const lines = block.split(/\r?\n/);
    const timeLine = lines.find(l => l.includes('-->')) || '';
    const m = timeLine.match(/(\d\d):(\d\d):(\d\d)[,.](\d\d\d)/);
    const time = m ? Number(m[1])*3600+Number(m[2])*60+Number(m[3])+Number(m[4])/1000 : i*3;
    return { time, text: lines.slice(lines.indexOf(timeLine)+1).join(' ') };
  });
  return parseLrcText(text) || text.split(/\r?\n/).filter(Boolean).map((line, i) => ({ time: i*3, text: line.trim() }));
}


export function assTime(seconds) {
  const totalCs = Math.max(0, Math.round(seconds * 100));
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${h}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

function assEscape(text) {
  return String(text || '').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\r?\n/g, '\\N');
}

function assColor(hex = '#ffffff', alpha = '00') {
  const h = String(hex || '#ffffff').replace('#','').padEnd(6,'f').slice(0,6);
  const r = h.slice(0,2), g = h.slice(2,4), b = h.slice(4,6);
  return `&H${alpha}${b}${g}${r}`.toUpperCase();
}
function lyricAlignment(position = 'Bawah', align = 'Rata Tengah') {
  const horizontal = String(align).includes('Kiri') ? 1 : String(align).includes('Kanan') ? 3 : 2;
  if (String(position).includes('Atas')) return horizontal + 6;
  if (String(position).includes('Tengah')) return horizontal + 3;
  return horizontal;
}

export function buildAssDocument({
  rows = [], title = '', duration = 60, font = 'Arial', fontSize = 28,
  lyricColor = '#ffffff', lyricHighlightColor = '#22c55e', lyricPosition = 'Bawah', lyricAlign = 'Rata Tengah', lyricOutline = 2, lyricShadow = 1, lyricKaraoke = false,
  titleEnabled = true, titlePosition = 'Atas', titleFontSize = 26, titleColor = '#ffffff', titleX = 0, titleY = 0, timestampEnabled = false, timestampText = 'Rendered by PidioForge', timestampPosition = 'Kiri Atas',
  lowerThirdEnabled = false, lowerThirdText = '', lowerThirdPosition = 'Bawah', lowerThirdAt = 2, lowerThirdDuration = 5,
  watermark = '', watermarkEnabled = false, watermarkPosition = 'Kiri Bawah', watermarkOpacity = 70,
  watermarkMode = 'always', watermarkInterval = 12, watermarkVisibleDuration = 5,
}) {
  const safeDuration = Math.max(1, Number(duration) || 60);
  const events = [];
  const alpha = Math.max(0, Math.min(255, Math.round(255 - (Number(watermarkOpacity ?? 70) / 100) * 255))).toString(16).padStart(2, '0').toUpperCase();
  if (titleEnabled && title) {
    const tx = Math.round(Number(titleX || 0));
    const ty = Math.round(Number(titleY || 0));
    const override = tx > 0 && ty > 0 ? `{\\an5\\pos(${tx},${ty})}` : '';
    events.push(`Dialogue: 0,${assTime(0)},${assTime(safeDuration)},Title,,0,0,0,,${override}${assEscape(title)}`);
  }
  if (timestampEnabled) events.push(`Dialogue: 0,${assTime(0)},${assTime(safeDuration)},Info,,0,0,0,,${assEscape(timestampText || 'Rendered by PidioForge')}`);
  if (lowerThirdEnabled && lowerThirdText) {
    const ltStart = Math.max(0, Number(lowerThirdAt || 2));
    const ltEnd = Math.min(safeDuration, ltStart + Math.max(0.8, Number(lowerThirdDuration || 5)));
    events.push(`Dialogue: 0,${assTime(ltStart)},${assTime(ltEnd)},LowerThird,,0,0,0,,${assEscape(lowerThirdText)}`);
  }
  if (watermarkEnabled && watermark) {
    if (watermarkMode === 'interval') {
      const interval = Math.max(1, Number(watermarkInterval) || 12);
      const visible = Math.max(0.5, Number(watermarkVisibleDuration) || 5);
      for (let t = 0; t < safeDuration; t += interval) {
        events.push(`Dialogue: 0,${assTime(t)},${assTime(Math.min(safeDuration, t + visible))},Watermark,,0,0,0,,${assEscape(watermark)}`);
      }
    } else {
      events.push(`Dialogue: 0,${assTime(0)},${assTime(safeDuration)},Watermark,,0,0,0,,${assEscape(watermark)}`);
    }
  }
  rows.forEach((row, i) => {
    const start = Number(row.time) || i * 3;
    const next = rows[i + 1]?.time;
    const end = Math.min(safeDuration, Math.max(start + 0.8, (Number(next) || start + 3) - 0.06));
    const durCs = Math.max(20, Math.round((end - start) * 100));
    const text = lyricKaraoke ? `{\k${durCs}}${assEscape(row.text)}` : assEscape(row.text);
    if (start < safeDuration) events.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Lyrics,,0,0,0,,${text}`);
  });
  const wmAlign = watermarkPosition.includes('Kanan') ? (watermarkPosition.includes('Atas') ? 9 : 3) : (watermarkPosition.includes('Atas') ? 7 : watermarkPosition.includes('Tengah') ? 5 : 1);
  const infoAlign = timestampPosition.includes('Kanan') ? (timestampPosition.includes('Bawah') ? 3 : 9) : (timestampPosition.includes('Bawah') ? 1 : 7);
  const lowerAlign = lowerThirdPosition.includes('Atas') ? 8 : lowerThirdPosition.includes('Tengah') ? 5 : 2;
  const lowerMarginV = lowerThirdPosition.includes('Atas') ? 82 : lowerThirdPosition.includes('Tengah') ? 40 : 104;
  const lyAlign = lyricAlignment(lyricPosition, lyricAlign);
  const lyMarginV = String(lyricPosition).includes('Atas') ? 80 : String(lyricPosition).includes('Tengah') ? 40 : 72;
  const lyPrimary = assColor(lyricColor, '00');
  const lySecondary = assColor(lyricHighlightColor, '00');
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Title,${font},${Number(titleFontSize || 26)},${assColor(titleColor, '00')},&H000000FF,&HAA000000,&H66000000,1,0,0,0,100,100,0,0,1,2,1,${String(titlePosition).includes('Bawah') ? 2 : String(titlePosition).includes('Tengah') ? 5 : 8},30,30,34,1\nStyle: Lyrics,${font},${fontSize},${lyPrimary},${lySecondary},&HAA000000,&H66000000,1,0,0,0,100,100,0,0,1,${Number(lyricOutline ?? 2)},${Number(lyricShadow ?? 1)},${lyAlign},80,80,${lyMarginV},1\nStyle: Info,${font},18,&H00FFFFFF,&H000000FF,&HAA000000,&H66000000,0,0,0,0,100,100,0,0,1,1,1,${infoAlign},20,20,20,1\nStyle: LowerThird,${font},30,&H00FFFFFF,&H000000FF,&HAA000000,&H99000000,1,0,0,0,100,100,0,0,1,2,1,${lowerAlign},90,90,${lowerMarginV},1\nStyle: Watermark,${font},18,&H${alpha}FFFFFF,&H000000FF,&HAA000000,&H66000000,0,0,0,0,100,100,0,0,1,1,1,${wmAlign},28,28,24,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events.join('\n')}\n`;
}
