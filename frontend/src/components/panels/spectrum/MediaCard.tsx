import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card } from '../../ui/design-system-components';
import { GalleryInput } from '../../ui/GalleryInput';
import type { SpectrumCardProps, SpectrumEngineState } from './types';

interface MediaCardProps extends SpectrumCardProps {
  engine: SpectrumEngineState;
}

export function MediaCard({ config, updateConfig, engine }: MediaCardProps) {
  const { galleryEnabled, galleryImages, galleryActiveIndex, setGalleryImages, setGalleryActiveIndex } = engine;

  return (
    <Card title="Media Utama">
      <Field label="Audio">
        <PathInput
          value={getDeep(config, 'input.audio', '')}
          onChange={v => updateConfig('input.audio', v)}
          placeholder="Pilih lagu/audio untuk spektrum"
          filter="audio"
        />
      </Field>
      <Field label="Visual">
        <PathInput
          value={getDeep(config, 'input.visual', '')}
          onChange={v => updateConfig('input.visual', v)}
          placeholder="Pilih video/gambar latar"
          filter="visual"
        />
      </Field>
      <Field label="Judul">
        <TextInput
          value={getDeep(config, 'input.title', '')}
          onChange={v => updateConfig('input.title', v)}
          placeholder="Klik teks di pratinjau untuk edit cepat"
        />
      </Field>

      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
        <Check
          label="Gallery Mode (Multi-Gambar)"
          checked={galleryEnabled}
          onChange={v => updateConfig('spectrum.gallery.enabled', v)}
        />
        {galleryEnabled && (
          <div className="mt-3 space-y-3">
            <GalleryInput
              images={galleryImages}
              onChange={setGalleryImages}
              activeIndex={galleryActiveIndex}
              onActiveChange={setGalleryActiveIndex}
              filter="visual"
              placeholder="Tambah gambar untuk gallery spectrum"
              maxCount={50}
            />
            <Field label="Transisi">
              <SelectInput
                value={getDeep(config, 'spectrum.gallery.transition', 'fade')}
                onChange={v => updateConfig('spectrum.gallery.transition', v)}
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
                <option value="crossfade">Crossfade</option>
              </SelectInput>
            </Field>
            <Field label="Durasi per Gambar (dtk)">
              <TextInput
                type="number"
                value={getDeep(config, 'spectrum.gallery.duration', 5)}
                onChange={v => updateConfig('spectrum.gallery.duration', Math.max(1, Number(v)))}
                placeholder="5"
              />
            </Field>
            <Check
              label="Acak urutan gambar"
              checked={Boolean(getDeep(config, 'spectrum.gallery.shuffle', false))}
              onChange={v => updateConfig('spectrum.gallery.shuffle', v)}
            />
            <Check
              label="Ken Burns / Zoompan"
              checked={Boolean(getDeep(config, 'spectrum.gallery.kenBurns', false))}
              onChange={v => updateConfig('spectrum.gallery.kenBurns', v)}
            />
            {Boolean(getDeep(config, 'spectrum.gallery.kenBurns', false)) && (
              <Field label="Mode Gerak">
                <SelectInput
                  value={getDeep(config, 'spectrum.gallery.kenBurnsMode', 'random')}
                  onChange={v => updateConfig('spectrum.gallery.kenBurnsMode', v)}
                >
                  <option value="random">Random</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="zoom-out">Zoom Out</option>
                  <option value="pan-left">Pan Left</option>
                  <option value="pan-right">Pan Right</option>
                </SelectInput>
              </Field>
            )}
            <Callout type="tip">
              Gallery sekarang support image dan video. Ken Burns berlaku untuk gambar. Preview live akan ikut gallery
              mode.
            </Callout>
          </div>
        )}
      </div>

      <Callout type="tip">
        Geser teks atau spektrum langsung di pratinjau. Klik teks Now Playing untuk mengubah judul.
      </Callout>
    </Card>
  );
}
