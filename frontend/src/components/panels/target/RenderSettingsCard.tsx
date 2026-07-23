import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, PresetButtonGroup } from '../../ui/design-system-components';
import type { TargetCardProps, TargetEngineState } from './types';

interface RenderSettingsCardProps extends TargetCardProps {
  engine: TargetEngineState;
}

export function RenderSettingsCard({ config, updateConfig, engine }: RenderSettingsCardProps) {
  const { advanced, setAdvanced, targetFormat } = engine;

  return (
    <Card title="Pengaturan Render">
      <Field label="Resolusi">
        <SelectInput
          value={getDeep(config, 'target.resolution', '1280x720')}
          onChange={v => {
            const [w, h] = v.split('x').map(Number);
            updateConfig('target.resolution', v);
            updateConfig('target.width', w);
            updateConfig('target.height', h);
          }}
        >
          <option>1280x720</option>
          <option>1920x1080</option>
          <option>1080x1920</option>
          <option>1080x1080</option>
        </SelectInput>
      </Field>
      <Field label="FPS">
        <TextInput
          type="number"
          value={getDeep(config, 'target.fps', 30)}
          onChange={v => updateConfig('target.fps', v)}
        />
      </Field>
      <Field label="Bitrate">
        <TextInput value={getDeep(config, 'target.bitrate')} onChange={v => updateConfig('target.bitrate', v)} />
      </Field>
      <Field label="Codec">
        <SelectInput
          value={getDeep(config, 'target.videoCodec', 'h264')}
          onChange={v => updateConfig('target.videoCodec', v)}
        >
          <option value="h264">H.264 (Universal)</option>
          <option value="h265">H.265/HEVC (Smaller)</option>
          <option value="vp9">VP9 (Web)</option>
          <option value="av1">AV1 (Future)</option>
        </SelectInput>
      </Field>
      <div className="flex items-center gap-3 px-3 py-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[11px]">
        <span className="font-semibold text-[var(--text-primary)]">Format:</span>
        <span className="text-[var(--accent-primary)]">
          {targetFormat === 'vertical' ? '9:16 Vertical' : targetFormat === 'square' ? '1:1 Square' : '16:9 Landscape'}
        </span>
        <span className="text-[var(--text-muted)]">Preset Spectrum/Overlay mengikuti format ini.</span>
      </div>
      <button
        onClick={() => setAdvanced(!advanced)}
        className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-colors duration-200"
      >
        <span>Advanced Settings</span>
        <span className="text-[var(--text-muted)]">{advanced ? '▲' : '▼'}</span>
      </button>
      {advanced && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3">
          <Field label="Mode Video">
            <SelectInput
              value={getDeep(config, 'target.modeVideo')}
              onChange={v => updateConfig('target.modeVideo', v)}
            >
              <option>Video/Gambar tetap</option>
              <option>Visual berulang</option>
              <option>Visual acak</option>
            </SelectInput>
          </Field>
          <Field label="Render">
            <SelectInput
              value={getDeep(config, 'target.modeRender')}
              onChange={v => updateConfig('target.modeRender', v)}
            >
              <option>FFmpeg</option>
              <option>GPU otomatis</option>
              <option>CPU aman</option>
            </SelectInput>
          </Field>
          <Field label="Hardware">
            <SelectInput
              value={getDeep(config, 'target.hardwareAccel', 'auto')}
              onChange={v => updateConfig('target.hardwareAccel', v)}
            >
              <option>auto</option>
              <option>cpu</option>
              <option>nvidia</option>
              <option>intel</option>
              <option>amd</option>
            </SelectInput>
          </Field>
          <Field label="Durasi Target">
            <TextInput
              type="number"
              value={getDeep(config, 'target.duration', 0)}
              onChange={v => updateConfig('target.duration', v)}
            />
          </Field>
          <Field label="Max Zoom">
            <TextInput
              type="number"
              value={getDeep(config, 'target.maxZoom', 110)}
              onChange={v => updateConfig('target.maxZoom', v)}
            />
          </Field>
          <Field label="Speed">
            <TextInput
              type="number"
              value={getDeep(config, 'target.speed', 100)}
              onChange={v => updateConfig('target.speed', v)}
            />
          </Field>
          <Field label="Mutu">
            <SelectInput
              value={getDeep(config, 'target.quality', 'balanced')}
              onChange={v => updateConfig('target.quality', v)}
            >
              <option value="fast">Pratinjau Cepat</option>
              <option value="balanced">Seimbang</option>
              <option value="high">Kualitas Tinggi</option>
            </SelectInput>
          </Field>
          <Check
            label="Timpa output lama jika nama sama"
            checked={Boolean(getDeep(config, 'target.overwrite', false))}
            onChange={v => updateConfig('target.overwrite', v)}
          />
          <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Encoding Profiles</h4>
            <Field label="Audio Codec">
              <SelectInput
                value={getDeep(config, 'target.audioCodec', 'aac')}
                onChange={v => updateConfig('target.audioCodec', v)}
              >
                <option value="aac">AAC (Universal)</option>
                <option value="mp3">MP3 (Compatible)</option>
                <option value="opus">Opus (Efficient)</option>
                <option value="vorbis">Vorbis (Open)</option>
              </SelectInput>
            </Field>
            <Field label="Container">
              <SelectInput
                value={getDeep(config, 'target.container', 'mp4')}
                onChange={v => updateConfig('target.container', v)}
              >
                <option value="mp4">MP4</option>
                <option value="mkv">MKV</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
              </SelectInput>
            </Field>
            <Field label="Encoding Preset">
              <SelectInput
                value={getDeep(config, 'target.encodingPreset', 'medium')}
                onChange={v => updateConfig('target.encodingPreset', v)}
              >
                <option value="ultrafast">Ultrafast (Low Quality)</option>
                <option value="superfast">Superfast</option>
                <option value="veryfast">Very Fast</option>
                <option value="faster">Faster</option>
                <option value="fast">Fast</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="slow">Slow (Better)</option>
                <option value="slower">Slower</option>
                <option value="veryslow">Very Slow (Best)</option>
              </SelectInput>
            </Field>
            <Field label="Tune">
              <SelectInput
                value={getDeep(config, 'target.tune', 'none')}
                onChange={v => updateConfig('target.tune', v)}
              >
                <option value="none">None</option>
                <option value="film">Film</option>
                <option value="animation">Animation</option>
                <option value="grain">Grain</option>
                <option value="stillimage">Still Image</option>
                <option value="fastdecode">Fast Decode</option>
              </SelectInput>
            </Field>
          </div>
          <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Quality Presets</h4>
            <PresetButtonGroup
              activeId={String(getDeep(config, 'target.quality', 'balanced'))}
              onChange={id => {
                if (id === 'fast') {
                  updateConfig('target.quality', 'fast');
                  updateConfig('target.crf', 28);
                  updateConfig('target.encodingPreset', 'veryfast');
                  updateConfig('target.bitrate', '2M');
                }
                if (id === 'balanced') {
                  updateConfig('target.quality', 'balanced');
                  updateConfig('target.crf', 23);
                  updateConfig('target.encodingPreset', 'medium');
                  updateConfig('target.bitrate', '5M');
                }
                if (id === 'high') {
                  updateConfig('target.quality', 'high');
                  updateConfig('target.crf', 18);
                  updateConfig('target.encodingPreset', 'slow');
                  updateConfig('target.bitrate', '8M');
                }
                if (id === 'archive') {
                  updateConfig('target.quality', 'archive');
                  updateConfig('target.crf', 15);
                  updateConfig('target.encodingPreset', 'veryslow');
                  updateConfig('target.bitrate', '12M');
                }
              }}
              presets={[
                { id: 'fast', icon: '🚀', label: 'Draft' },
                { id: 'balanced', icon: '⚖️', label: 'Balanced' },
                { id: 'high', icon: '💎', label: 'High' },
                { id: 'archive', icon: '📦', label: 'Archive' },
              ]}
            />
          </div>
          <Field label="CRF">
            <TextInput
              type="number"
              value={getDeep(config, 'target.crf', 22)}
              onChange={v => updateConfig('target.crf', v)}
            />
          </Field>
          <Field label="Pixel Format">
            <SelectInput
              value={getDeep(config, 'target.pixelFormat', 'yuv420p')}
              onChange={v => updateConfig('target.pixelFormat', v)}
            >
              <option>yuv420p</option>
              <option>yuv444p</option>
            </SelectInput>
          </Field>
          <Field label="Audio Bitrate">
            <TextInput
              value={getDeep(config, 'audio.audioBitrate', '192k')}
              onChange={v => updateConfig('audio.audioBitrate', v)}
            />
          </Field>
          <Check
            label="Faststart MP4 untuk upload web"
            checked={Boolean(getDeep(config, 'target.faststart', true))}
            onChange={v => updateConfig('target.faststart', v)}
          />
        </div>
      )}
    </Card>
  );
}
