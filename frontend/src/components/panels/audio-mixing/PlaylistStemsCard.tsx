import { Field, TextInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { cleanUiText } from '../../../lib/format';
import { cn } from '../../../utils/cn';
import { Card } from '../../ui/design-system-components';
import { PathInput } from '../../ui/PathInput';
import type { Stem } from '../../../lib/stem-utils';
import type { AudioMixingCardProps, StemDragState, StemManagementState } from './types';

interface PlaylistStemsCardProps extends AudioMixingCardProps {
  stemManagement: StemManagementState;
  stemDrag: StemDragState;
}

export function PlaylistStemsCard({ config, updateConfig, stemManagement, stemDrag }: PlaylistStemsCardProps) {
  const {
    stems,
    introText,
    slotText,
    stemsText,
    stemMessage,
    setIntroText,
    setSlotText,
    setStemsText,
    commitIntro,
    commitSlots,
    commitStems,
    toggleStemSolo,
    toggleStemMute,
    updateStemVolume,
    addEmptyStem,
    addMultiStems,
    removeStem,
  } = stemManagement;
  const {
    stemDraggedIdx,
    stemDragOverIdx,
    handleStemDragStart,
    handleStemDragOver,
    handleStemDragLeave,
    handleStemDrop,
    handleStemDragEnd,
  } = stemDrag;

  return (
    <Card title="Playlist & Stems">
      <Field label="Lagu Intro">
        <textarea
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[42px] px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
          value={introText}
          onChange={e => setIntroText(e.target.value)}
          onBlur={commitIntro}
          placeholder="Satu path per baris"
        />
      </Field>
      <Field label="Slot Lagu">
        <textarea
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[42px] px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
          value={slotText}
          onChange={e => setSlotText(e.target.value)}
          onBlur={commitSlots}
          placeholder="Satu path per baris"
        />
      </Field>
      <Field label="Lagu Terakhir">
        <PathInput
          value={getDeep(config, 'audio.endingSong', '')}
          onChange={v => updateConfig('audio.endingSong', v)}
          filter="audio"
        />
      </Field>
      <div className="space-y-3">
        <Field label="Crossfade">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.crossfade', 0.8)}
            onChange={v => updateConfig('audio.crossfade', v)}
          />
        </Field>
        <Field label="Jeda Sunyi">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.silenceBetween', 0)}
            onChange={v => updateConfig('audio.silenceBetween', v)}
          />
        </Field>
        <Field label="Volume Akhir">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.endingVolume', 100)}
            onChange={v => updateConfig('audio.endingVolume', v)}
          />
        </Field>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-[var(--text-primary)]">Stem Mixer</label>
          <div className="flex gap-1">
            <button
              onClick={addEmptyStem}
              className="px-2 py-1 text-[10px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 rounded transition-all duration-200"
            >
              + Add Stem
            </button>
            <button
              onClick={addMultiStems}
              className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded transition-all duration-200"
            >
              + Multi Files
            </button>
          </div>
        </div>
        {stemMessage && (
          <div className="px-3 py-2 rounded-[var(--radius-md)] text-[10px] font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
            {cleanUiText(stemMessage)}
          </div>
        )}
        {stems.length > 0 ? (
          <div className="space-y-2">
            {stems.map((stem: Stem, i: number) => {
              const isDragged = i === stemDraggedIdx;
              const isDragOver = i === stemDragOverIdx;
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={e => handleStemDragStart(e, i)}
                  onDragOver={e => handleStemDragOver(e, i)}
                  onDragLeave={handleStemDragLeave}
                  onDrop={e => handleStemDrop(e, i)}
                  onDragEnd={handleStemDragEnd}
                  className={cn(
                    'flex items-center gap-2 p-2 border rounded-[var(--radius-md)] cursor-grab transition-all',
                    isDragOver
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 scale-[1.01]'
                      : isDragged
                        ? 'border-[var(--accent-warning)] bg-[var(--tertiary-bg)] opacity-50'
                        : 'bg-[var(--tertiary-bg)] border-[var(--border-subtle)] hover:bg-[var(--tertiary-bg)]/80',
                  )}
                >
                  <span
                    className="text-[var(--text-muted)] select-none cursor-grab text-[10px]"
                    aria-label="Drag to reorder"
                  >
                    ⠿
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--text-primary)] truncate">
                      {stem.name || `Track ${i + 1}`}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate">{stem.file || 'No file'}</div>
                  </div>
                  <button
                    onClick={() => toggleStemSolo(i)}
                    className={cn(
                      'px-2 py-1 text-[10px] font-bold rounded transition-all duration-200',
                      stem.solo
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--secondary-bg)] text-[var(--text-muted)] hover:bg-[var(--tertiary-bg)]',
                    )}
                    title="Solo"
                  >
                    S
                  </button>
                  <button
                    onClick={() => toggleStemMute(i)}
                    className={cn(
                      'px-2 py-1 text-[10px] font-bold rounded transition-all duration-200',
                      stem.mute
                        ? 'bg-[var(--accent-danger)] text-white'
                        : 'bg-[var(--secondary-bg)] text-[var(--text-muted)] hover:bg-[var(--tertiary-bg)]',
                    )}
                    title="Mute"
                  >
                    M
                  </button>
                  <div className="flex items-center gap-1 w-32">
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={stem.volume || 100}
                      onChange={e => updateStemVolume(i, Number(e.target.value))}
                      aria-label={`Volume ${stem.name || `Track ${i + 1}`}`}
                      className="flex-1 h-1 bg-[var(--secondary-bg)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-[9px] text-[var(--text-muted)] w-8 text-right">{stem.volume || 100}</span>
                  </div>
                  <button
                    onClick={() => removeStem(i)}
                    className="px-2 py-1 text-[10px] font-bold text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded transition-all duration-200"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)] text-center">
            No stems added. Click "+ Add Stem" to start.
          </div>
        )}
        <details className="mt-2">
          <summary className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
            Advanced: Text Editor
          </summary>
          <Field label="">
            <textarea
              className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[42px] px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 mt-2"
              value={stemsText}
              onChange={e => setStemsText(e.target.value)}
              onBlur={commitStems}
              placeholder="Format: nama|path|volume|pan\nvocal|C:/vocal.wav|100|0"
            />
          </Field>
        </details>
      </div>
    </Card>
  );
}
