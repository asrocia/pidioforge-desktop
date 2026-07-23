import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import { Callout, Card } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface TranscriptionCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
}

export function TranscriptionCard({ config, updateConfig, engine }: TranscriptionCardProps) {
  const { busy, setBusy, setMessage, setText, setParsed } = engine;

  async function transcribeAudio() {
    setBusy(true);
    setMessage('Transcribing audio...');
    try {
      const data = await api('/api/lyrics/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          audio: getDeep(config, 'input.audio'),
          engine: getDeep(config, 'lyrics.transcription.engine'),
          modelSize: getDeep(config, 'lyrics.transcription.modelSize'),
          language: getDeep(config, 'lyrics.transcription.language'),
          config,
        }),
      });
      setText(data.text || '');
      setParsed(data.segments || []);
      setMessage(
        `Transcribed: ${data.segments?.length || 0} segments, confidence: ${(data.confidence * 100).toFixed(1)}%`,
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="AI Transcription">
      <Check
        label="Enable AI Transcription"
        checked={Boolean(getDeep(config, 'lyrics.transcription.enabled', false))}
        onChange={v => updateConfig('lyrics.transcription.enabled', v)}
      />
      <Field label="Engine">
        <SelectInput
          value={getDeep(config, 'lyrics.transcription.engine', 'whisper')}
          onChange={v => updateConfig('lyrics.transcription.engine', v)}
        >
          <option value="whisper">Whisper (Local)</option>
          <option value="whisper-api">Whisper API</option>
          <option value="google">Google Speech</option>
          <option value="azure">Azure Speech</option>
        </SelectInput>
      </Field>
      <Field label="Model Size">
        <SelectInput
          value={getDeep(config, 'lyrics.transcription.modelSize', 'base')}
          onChange={v => updateConfig('lyrics.transcription.modelSize', v)}
        >
          <option value="tiny">Tiny (Fast)</option>
          <option value="base">Base</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large (Accurate)</option>
        </SelectInput>
      </Field>
      <Field label="Language">
        <SelectInput
          value={getDeep(config, 'lyrics.transcription.language', 'auto')}
          onChange={v => updateConfig('lyrics.transcription.language', v)}
        >
          <option value="auto">Auto-Detect</option>
          <option value="en">English</option>
          <option value="id">Indonesian</option>
          <option value="ar">Arabic</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </SelectInput>
      </Field>
      <Field label="Word Timestamps">
        <SelectInput
          value={getDeep(config, 'lyrics.transcription.wordTimestamps', 'auto')}
          onChange={v => updateConfig('lyrics.transcription.wordTimestamps', v)}
        >
          <option value="auto">Auto</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </SelectInput>
      </Field>
      <Field label="Confidence Threshold">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.transcription.confidence', 0.7)}
          onChange={v => updateConfig('lyrics.transcription.confidence', v)}
          placeholder="0.0-1.0"
        />
      </Field>
      <Check
        label="Remove filler words (um, uh, etc)"
        checked={Boolean(getDeep(config, 'lyrics.transcription.removeFiller', true))}
        onChange={v => updateConfig('lyrics.transcription.removeFiller', v)}
      />
      <Check
        label="Auto-punctuation"
        checked={Boolean(getDeep(config, 'lyrics.transcription.autoPunctuation', true))}
        onChange={v => updateConfig('lyrics.transcription.autoPunctuation', v)}
      />
      <div className="flex gap-2">
        <button
          onClick={transcribeAudio}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🎤 Transcribe Audio
        </button>
      </div>
      <Callout type="tip">
        AI Transcription menggunakan speech-to-text untuk generate lirik otomatis dari audio. Whisper Local tidak perlu
        API key.
      </Callout>
    </Card>
  );
}
