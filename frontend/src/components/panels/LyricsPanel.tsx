import React, { useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, InfoBar, WarnBox, StatRow } from '../ui/panel-primitives';
import { Field, Check, TextInput, SelectInput, Slider } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';

export function LyricsPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<any[]>([]);
  const [srt, setSrt] = useState('');
  const [lrc, setLrc] = useState('');
  const [vtt, setVtt] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  function applyLyricPreset(v: string) {
    updateConfig('lyrics.stylePreset', v);
    if (v === 'modern') { updateConfig('lyrics.font', 'Arial'); updateConfig('lyrics.scale', 30); updateConfig('lyrics.outline', 2); updateConfig('lyrics.shadow', 1); updateConfig('lyrics.color', '#ffffff'); updateConfig('lyrics.highlightColor', '#22c55e'); updateConfig('lyrics.position', 'Bawah'); updateConfig('lyrics.uppercase', false); }
    if (v === 'karaoke') { updateConfig('lyrics.karaoke', true); updateConfig('lyrics.wordByWord', true); updateConfig('lyrics.scale', 32); updateConfig('lyrics.color', '#ffffff'); updateConfig('lyrics.highlightColor', '#facc15'); updateConfig('lyrics.outline', 2); }
    if (v === 'shorts-bold') { updateConfig('lyrics.uppercase', true); updateConfig('lyrics.scale', 38); updateConfig('lyrics.maxChars', 26); updateConfig('lyrics.outline', 3); updateConfig('lyrics.position', 'Tengah'); updateConfig('lyrics.safeArea', true); }
    if (v === 'minimal') { updateConfig('lyrics.scale', 24); updateConfig('lyrics.outline', 1); updateConfig('lyrics.shadow', 0); updateConfig('lyrics.color', '#eeeeee'); updateConfig('lyrics.position', 'Bawah'); updateConfig('lyrics.karaoke', false); }
  }
  async function parseLyrics() {
    setBusy(true); setMessage('Membaca lirik...');
    try {
      const data = await api('/api/lyrics/parse', { method: 'POST', body: JSON.stringify({ text, file: getDeep(config, 'lyrics.file'), config }) });
      setParsed(data.lines || []); setSrt(data.srt || ''); setLrc(data.lrc || ''); setVtt(data.vtt || ''); setMessage(`${data.lines?.length || 0} baris lirik diparse.`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function autoAlign() {
    setBusy(true); setMessage('Menyelaraskan lirik...');
    try {
      const data = await api('/api/lyrics/auto-align', { method: 'POST', body: JSON.stringify({ text, file: getDeep(config, 'lyrics.file'), audio: getDeep(config, 'input.audio'), config, format: getDeep(config, 'lyrics.exportFormat', 'srt') }) });
      setParsed(data.lines || []); setSrt(data.srt || ''); setLrc(data.lrc || ''); setVtt(data.vtt || ''); setValidation({ ok: (data.quality?.score || 0) >= Number(getDeep(config, 'lyrics.qualityGate', 82)), warnings: data.quality?.warnings || [], quality: data.quality, beats: data.beats || [] }); setMessage(`Align otomatis selesai: ${data.lines?.length || 0} baris / skor ${data.quality?.score ?? '-'} / beat ${data.beats?.length || 0}${data.outputFile ? ` / tersimpan ${data.outputFile}` : ''}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function validateLyrics() {
    setBusy(true); setMessage('Memeriksa timeline lirik...');
    try {
      const data = await api('/api/lyrics/validate', { method: 'POST', body: JSON.stringify({ lines: parsed, config }) });
      setValidation(data); setMessage(data.ok ? `Lirik siap: ${data.lineCount} baris / skor ${data.quality?.score ?? '-'}` : `Perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function exportLyrics(format: string) {
    setBusy(true); setMessage(`Menyiapkan ekspor ${format.toUpperCase()}...`);
    try {
      const data = await api('/api/lyrics/export', { method: 'POST', body: JSON.stringify({ lines: parsed, text, file: getDeep(config, 'lyrics.file'), config, format, outputFile: getDeep(config, 'lyrics.outputFile') }) });
      if (format === 'srt') setSrt(data.content || ''); if (format === 'lrc') setLrc(data.content || ''); if (format === 'vtt') setVtt(data.content || '');
      setMessage(data.outputFile ? `Export berhasil: ${data.outputFile}` : `Export ${format.toUpperCase()} siap.`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  const previewRows = parsed.slice(0, 6);
  const outputPreview = getDeep(config, 'lyrics.exportFormat', 'srt') === 'lrc' ? lrc : getDeep(config, 'lyrics.exportFormat', 'srt') === 'vtt' ? vtt : srt;
  return <PanelWrap>
    <Group title="Mesin Lirik">
      <Check label="Aktifkan Lirik" checked={Boolean(getDeep(config, 'lyrics.enabled', true))} onChange={v => updateConfig('lyrics.enabled', v)} />
      <Grid3><Field label="Mode"><SelectInput value={getDeep(config, 'lyrics.autoMode', 'from-text')} onChange={v => updateConfig('lyrics.autoMode', v)}><option value="from-text">Dari teks manual</option><option value="from-file">Dari file LRC/SRT</option><option value="auto-align">Auto align durasi</option></SelectInput></Field><Field label="AI Mode"><SelectInput value={getDeep(config, 'lyrics.ai', 'Mati')} onChange={v => updateConfig('lyrics.ai', v)}><option value="Mati">Mati / lokal</option><option value="prepare">Siapkan transkrip</option><option value="manual-review">Tinjau manual</option></SelectInput></Field><Field label="Bahasa"><SelectInput value={getDeep(config, 'lyrics.language', 'Auto')} onChange={v => updateConfig('lyrics.language', v)}><option>Auto</option><option>Indonesia</option><option>English</option><option>Arabic</option><option>Mixed</option></SelectInput></Field></Grid3>
      <Field label="File LRC/SRT"><PathInput value={getDeep(config, 'lyrics.file')} onChange={v => updateConfig('lyrics.file', v)} placeholder="C:/lirik/lagu.lrc atau .srt" filter="lyrics" /></Field>
      <Field label="Output Lirik"><PathInput value={getDeep(config, 'lyrics.outputFile', '')} onChange={v => updateConfig('lyrics.outputFile', v)} placeholder="Opsional: C:/hasil/lyrics.srt" kind="save" filter="lyrics" /></Field>
      <textarea className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[72px] px-1.5 py-1 resize-y font-mono" value={text} onChange={e => setText(e.target.value)} placeholder="Tempel lirik polos atau LRC di sini. Auto align akan membagi timing mengikuti durasi audio." />
      <ActionBar><ActionBtn onClick={parseLyrics} disabled={busy}>Parse</ActionBtn><ActionBtn onClick={autoAlign} disabled={busy}>Selaraskan</ActionBtn><ActionBtn onClick={validateLyrics} disabled={busy}>Cek</ActionBtn><ActionBtn onClick={() => exportLyrics(getDeep(config, 'lyrics.exportFormat', 'srt'))} disabled={busy || !parsed.length}>Ekspor</ActionBtn></ActionBar>
      {message && <InfoBar variant={validation?.ok ? 'ok' : 'error'}>{cleanUiText(message)}</InfoBar>}
      {validation?.warnings?.length ? <WarnBox title="Catatan lirik:" items={validation.warnings.map((w: string) => cleanUiText(w))} /> : null}
      {validation?.quality && <StatRow items={[
        { label: 'Skor Kualitas', value: validation.quality.score, accent: true },
        { label: 'Beat Snap', value: validation.quality.metrics?.beats || validation.beats?.length || 0 },
        { label: 'Baris', value: validation.quality.metrics?.lines || parsed.length },
      ]} />}
    </Group>
    <Group title="Timing & Output">
      <Grid3><Field label="Format Output"><SelectInput value={getDeep(config, 'lyrics.exportFormat', 'srt')} onChange={v => updateConfig('lyrics.exportFormat', v)}><option value="srt">SRT</option><option value="lrc">LRC</option><option value="vtt">VTT</option></SelectInput></Field><Field label="Durasi Baris"><TextInput type="number" value={getDeep(config, 'lyrics.lineDuration', 3)} onChange={v => updateConfig('lyrics.lineDuration', v)} /></Field><Field label="Offset Detik"><TextInput type="number" value={getDeep(config, 'lyrics.offset', 0)} onChange={v => updateConfig('lyrics.offset', v)} /></Field></Grid3>
      <Grid3><Field label="Lead In"><TextInput type="number" value={getDeep(config, 'lyrics.leadIn', 0.15)} onChange={v => updateConfig('lyrics.leadIn', v)} /></Field><Field label="Maks Karakter"><TextInput type="number" value={getDeep(config, 'lyrics.maxChars', 42)} onChange={v => updateConfig('lyrics.maxChars', v)} /></Field><Field label="Model"><SelectInput value={getDeep(config, 'lyrics.model', 'Cepat')} onChange={v => updateConfig('lyrics.model', v)}><option>Cepat</option><option>Akurat</option><option>Karaoke</option></SelectInput></Field></Grid3>
      <Grid3><Field label="Durasi Min"><TextInput type="number" value={getDeep(config, 'lyrics.minLineDuration', 1.1)} onChange={v => updateConfig('lyrics.minLineDuration', v)} /></Field><Field label="Durasi Maks"><TextInput type="number" value={getDeep(config, 'lyrics.maxLineDuration', 5)} onChange={v => updateConfig('lyrics.maxLineDuration', v)} /></Field><Field label="Batas Kualitas"><TextInput type="number" value={getDeep(config, 'lyrics.qualityGate', 82)} onChange={v => updateConfig('lyrics.qualityGate', v)} /></Field></Grid3>
      <Grid3><label className="flex items-center gap-2 text-[12px] text-[#dce8ef]"><input type="checkbox" className="accent-[#4f8ef7]" checked={Boolean(getDeep(config, 'lyrics.smartTiming', true))} onChange={e => updateConfig('lyrics.smartTiming', e.target.checked)} /> Smart timing berbobot</label><label className="flex items-center gap-2 text-[12px] text-[#dce8ef]"><input type="checkbox" className="accent-[#4f8ef7]" checked={Boolean(getDeep(config, 'lyrics.beatSnap', true))} onChange={e => updateConfig('lyrics.beatSnap', e.target.checked)} /> Beat snap</label><Field label="Jendela Snap"><TextInput type="number" value={getDeep(config, 'lyrics.beatSnapWindow', 0.22)} onChange={v => updateConfig('lyrics.beatSnapWindow', v)} /></Field></Grid3>
      <Check label="Auto save hasil export" checked={Boolean(getDeep(config, 'lyrics.autoSave', true))} onChange={v => updateConfig('lyrics.autoSave', v)} />
    </Group>
    <Group title="Style Lirik">
      <Grid3><Field label="Preset Gaya"><SelectInput value={getDeep(config, 'lyrics.stylePreset', 'modern')} onChange={applyLyricPreset}><option value="modern">Modern Clean</option><option value="karaoke">Karaoke Highlight</option><option value="shorts-bold">Shorts Bold</option><option value="minimal">Minimal Subtitle</option></SelectInput></Field><Field label="Font"><TextInput value={getDeep(config, 'lyrics.font', 'Arial')} onChange={v => updateConfig('lyrics.font', v)} /></Field><Field label="Posisi"><SelectInput value={getDeep(config, 'lyrics.position', 'Bawah')} onChange={v => updateConfig('lyrics.position', v)}><option>Bawah</option><option>Tengah</option><option>Atas</option></SelectInput></Field></Grid3>
      <Grid3><Field label="Perataan"><SelectInput value={getDeep(config, 'lyrics.align', 'Rata Tengah')} onChange={v => updateConfig('lyrics.align', v)}><option>Rata Tengah</option><option>Rata Kiri</option><option>Rata Kanan</option></SelectInput></Field><Field label="Warna"><TextInput value={getDeep(config, 'lyrics.color', '#ffffff')} onChange={v => updateConfig('lyrics.color', v)} /></Field><Field label="Warna Highlight"><TextInput value={getDeep(config, 'lyrics.highlightColor', '#22c55e')} onChange={v => updateConfig('lyrics.highlightColor', v)} /></Field></Grid3>
      <Slider label="Skala" value={Number(getDeep(config, 'lyrics.scale', 28))} onChange={v => updateConfig('lyrics.scale', v)} min={16} max={60} />
      <Slider label="Outline" value={Number(getDeep(config, 'lyrics.outline', 2))} onChange={v => updateConfig('lyrics.outline', v)} min={0} max={6} />
      <Slider label="Shadow" value={Number(getDeep(config, 'lyrics.shadow', 1))} onChange={v => updateConfig('lyrics.shadow', v)} min={0} max={5} />
      <Grid3><label className="flex items-center gap-2 text-[12px] text-[#dce8ef]"><input type="checkbox" className="accent-[#4f8ef7]" checked={Boolean(getDeep(config, 'lyrics.karaoke', false))} onChange={e => updateConfig('lyrics.karaoke', e.target.checked)} /> Karaoke</label><label className="flex items-center gap-2 text-[12px] text-[#dce8ef]"><input type="checkbox" className="accent-[#4f8ef7]" checked={Boolean(getDeep(config, 'lyrics.wordByWord', false))} onChange={e => updateConfig('lyrics.wordByWord', e.target.checked)} /> Word-by-word</label><label className="flex items-center gap-2 text-[12px] text-[#dce8ef]"><input type="checkbox" className="accent-[#4f8ef7]" checked={Boolean(getDeep(config, 'lyrics.uppercase', false))} onChange={e => updateConfig('lyrics.uppercase', e.target.checked)} /> Uppercase</label></Grid3>
      <Check label="Area Aman subtitle" checked={Boolean(getDeep(config, 'lyrics.safeArea', true))} onChange={v => updateConfig('lyrics.safeArea', v)} />
    </Group>
    {!!previewRows.length && <Group title="Pratinjau Timeline">
      <div className="flex flex-col gap-0.5">{previewRows.map((r, i) => <div key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 text-[10px] px-1 py-0.5"><b className="text-[#4f8ef7]">{Number(r.time || 0).toFixed(2)}s</b><span className="text-[#dce8ef]">{r.text}</span></div>)}</div>
    </Group>}
    {outputPreview && <div className="px-3 py-2"><b className="text-[10px] font-bold text-[#8da0af] block mb-1">Ekspor Pratinjau</b><pre className="bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[10px] text-[#dce8ef] p-2 max-h-[200px] overflow-auto whitespace-pre-wrap">{outputPreview.slice(0, 1600)}</pre></div>}
  </PanelWrap>;
}
