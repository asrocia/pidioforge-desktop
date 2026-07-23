import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import { Callout, Card } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface AutoFetchCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
}

export function AutoFetchCard({ config, updateConfig, engine }: AutoFetchCardProps) {
  const { busy, setBusy, setMessage, setText } = engine;

  async function fetchLyrics() {
    setBusy(true);
    setMessage('Fetching lyrics...');
    try {
      const data = await api('/api/lyrics/fetch', {
        method: 'POST',
        body: JSON.stringify({
          title: getDeep(config, 'lyrics.autoFetch.songTitle'),
          artist: getDeep(config, 'lyrics.autoFetch.artist'),
          source: getDeep(config, 'lyrics.autoFetch.source'),
          apiKey: getDeep(config, 'lyrics.autoFetch.apiKey'),
          config,
        }),
      });
      setText(data.lyrics || '');
      setMessage(`Lyrics fetched from ${data.source}: ${data.lyrics?.split('\n').length || 0} lines`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function autoDetect() {
    const audioFile = getDeep(config, 'input.audio', '');
    if (audioFile) {
      const filename =
        audioFile
          .split(/[/\\]/)
          .pop()
          ?.replace(/\.[^.]+$/, '') || '';
      const parts = filename.split(/[-_]/);
      if (parts.length >= 2) {
        updateConfig('lyrics.autoFetch.artist', parts[0].trim());
        updateConfig('lyrics.autoFetch.songTitle', parts.slice(1).join(' ').trim());
        setMessage('Auto-detected from filename');
      }
    }
  }

  return (
    <Card title="Auto-Fetch Lyrics">
      <Check
        label="Enable Auto-Fetch"
        checked={Boolean(getDeep(config, 'lyrics.autoFetch.enabled', false))}
        onChange={v => updateConfig('lyrics.autoFetch.enabled', v)}
      />
      <Field label="Source">
        <SelectInput
          value={getDeep(config, 'lyrics.autoFetch.source', 'genius')}
          onChange={v => updateConfig('lyrics.autoFetch.source', v)}
        >
          <option value="genius">Genius</option>
          <option value="musixmatch">Musixmatch</option>
          <option value="azlyrics">AZLyrics</option>
          <option value="auto">Auto (Try All)</option>
        </SelectInput>
      </Field>
      <Field label="Fallback">
        <SelectInput
          value={getDeep(config, 'lyrics.autoFetch.fallback', 'manual')}
          onChange={v => updateConfig('lyrics.autoFetch.fallback', v)}
        >
          <option value="manual">Manual Input</option>
          <option value="transcribe">AI Transcribe</option>
          <option value="skip">Skip</option>
        </SelectInput>
      </Field>
      <Field label="Song Title">
        <TextInput
          value={getDeep(config, 'lyrics.autoFetch.songTitle', '')}
          onChange={v => updateConfig('lyrics.autoFetch.songTitle', v)}
          placeholder="Enter song title"
        />
      </Field>
      <Field label="Artist Name">
        <TextInput
          value={getDeep(config, 'lyrics.autoFetch.artist', '')}
          onChange={v => updateConfig('lyrics.autoFetch.artist', v)}
          placeholder="Enter artist name"
        />
      </Field>
      <Field label="API Key (Optional)">
        <TextInput
          type="password"
          value={getDeep(config, 'lyrics.autoFetch.apiKey', '')}
          onChange={v => updateConfig('lyrics.autoFetch.apiKey', v)}
          placeholder="For premium access"
        />
      </Field>
      <Field label="Timeout (s)">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.autoFetch.timeout', 10)}
          onChange={v => updateConfig('lyrics.autoFetch.timeout', v)}
        />
      </Field>
      <Field label="Retry Count">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.autoFetch.retries', 3)}
          onChange={v => updateConfig('lyrics.autoFetch.retries', v)}
        />
      </Field>
      <div className="flex gap-2">
        <button
          onClick={fetchLyrics}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🔍 Fetch Lyrics
        </button>
        <button
          onClick={autoDetect}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          🎵 Auto-Detect
        </button>
      </div>
      <Check
        label="Auto-clean fetched lyrics"
        checked={Boolean(getDeep(config, 'lyrics.autoFetch.autoClean', true))}
        onChange={v => updateConfig('lyrics.autoFetch.autoClean', v)}
      />
      <Callout type="tip">
        Auto-Fetch akan mencari lirik online berdasarkan judul & artis. Gunakan Auto-Detect untuk ekstrak info dari nama
        file audio.
      </Callout>
    </Card>
  );
}
