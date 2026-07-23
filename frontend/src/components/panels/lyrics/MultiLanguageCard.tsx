import { Field, Check, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import { Callout, Card } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface MultiLanguageCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
}

export function MultiLanguageCard({ config, updateConfig, engine }: MultiLanguageCardProps) {
  const { busy, text, parsed, setBusy, setMessage, setText } = engine;

  async function detectLanguage() {
    setBusy(true);
    setMessage('Detecting language...');
    try {
      const data = await api('/api/lyrics/detect-language', {
        method: 'POST',
        body: JSON.stringify({ text, lines: parsed, config }),
      });
      updateConfig('lyrics.multiLang.primary', data.detectedLanguage);
      setMessage(`Detected: ${data.languageName} (${(data.confidence * 100).toFixed(1)}% confidence)`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function transliterate() {
    setBusy(true);
    setMessage('Transliterating...');
    try {
      const data = await api('/api/lyrics/transliterate', {
        method: 'POST',
        body: JSON.stringify({
          text,
          from: getDeep(config, 'lyrics.multiLang.primary'),
          style: getDeep(config, 'lyrics.multiLang.translitStyle'),
          config,
        }),
      });
      setText(data.transliterated || '');
      setMessage('Transliteration complete');
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Multi-Language Detection">
      <Check
        label="Enable Language Detection"
        checked={Boolean(getDeep(config, 'lyrics.multiLang.enabled', false))}
        onChange={v => updateConfig('lyrics.multiLang.enabled', v)}
      />
      <Field label="Detection Mode">
        <SelectInput
          value={getDeep(config, 'lyrics.multiLang.mode', 'auto')}
          onChange={v => updateConfig('lyrics.multiLang.mode', v)}
        >
          <option value="auto">Auto-Detect</option>
          <option value="manual">Manual Select</option>
          <option value="mixed">Mixed Languages</option>
        </SelectInput>
      </Field>
      <Field label="Primary Language">
        <SelectInput
          value={getDeep(config, 'lyrics.multiLang.primary', 'en')}
          onChange={v => updateConfig('lyrics.multiLang.primary', v)}
        >
          <option value="en">English</option>
          <option value="id">Indonesian</option>
          <option value="ar">Arabic</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </SelectInput>
      </Field>
      <Field label="Secondary Language">
        <SelectInput
          value={getDeep(config, 'lyrics.multiLang.secondary', 'none')}
          onChange={v => updateConfig('lyrics.multiLang.secondary', v)}
        >
          <option value="none">None</option>
          <option value="en">English</option>
          <option value="id">Indonesian</option>
          <option value="ar">Arabic</option>
          <option value="es">Spanish</option>
        </SelectInput>
      </Field>
      <Check
        label="Enable Transliteration"
        checked={Boolean(getDeep(config, 'lyrics.multiLang.transliteration', false))}
        onChange={v => updateConfig('lyrics.multiLang.transliteration', v)}
      />
      <Field label="Transliteration Style">
        <SelectInput
          value={getDeep(config, 'lyrics.multiLang.translitStyle', 'romanized')}
          onChange={v => updateConfig('lyrics.multiLang.translitStyle', v)}
        >
          <option value="romanized">Romanized</option>
          <option value="phonetic">Phonetic</option>
          <option value="native">Native Script</option>
        </SelectInput>
      </Field>
      <Field label="Display Mode">
        <SelectInput
          value={getDeep(config, 'lyrics.multiLang.displayMode', 'original')}
          onChange={v => updateConfig('lyrics.multiLang.displayMode', v)}
        >
          <option value="original">Original Only</option>
          <option value="transliterated">Transliterated Only</option>
          <option value="both">Both (Dual Line)</option>
        </SelectInput>
      </Field>
      <Check
        label="Auto-translate to English"
        checked={Boolean(getDeep(config, 'lyrics.multiLang.autoTranslate', false))}
        onChange={v => updateConfig('lyrics.multiLang.autoTranslate', v)}
      />
      <div className="flex gap-2">
        <button
          onClick={detectLanguage}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🌐 Detect Language
        </button>
        <button
          onClick={transliterate}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🔤 Transliterate
        </button>
      </div>
      <Callout type="tip">
        Multi-Language Detection otomatis mendeteksi bahasa lirik dan dapat melakukan transliterasi (misal: Arab ke
        Latin, Jepang ke Romaji).
      </Callout>
    </Card>
  );
}
