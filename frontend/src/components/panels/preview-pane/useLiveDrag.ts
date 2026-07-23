import { useMemo, useState } from 'react';
import { getDeep } from '../../../lib/config-path';
import { cornerPosition } from '../../../utils/media';
import type { PidioConfig } from '../../../types/app.types';
import type { LiveTarget } from './types';

interface LiveDragOptions {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export function useLiveDrag({ config, updateConfig }: LiveDragOptions) {
  const [dragLive, setDragLive] = useState<LiveTarget | ''>('');
  const [resizeLive, setResizeLive] = useState<LiveTarget | ''>('');
  const [selectedLive, setSelectedLive] = useState<LiveTarget | ''>('');
  const [lockedLayers, setLockedLayers] = useState<Set<LiveTarget>>(new Set());

  const resolvedLayerOrder = useMemo(
    () =>
      String(
        getDeep(
          config,
          'branding.layerOrder',
          'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird',
        ),
      )
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    [config],
  );

  function layerStackIndex(id: LiveTarget): number {
    const idx = resolvedLayerOrder.indexOf(id);
    return idx === -1 ? resolvedLayerOrder.length : idx;
  }

  function positionPoint(position: string, marginX = 28, marginY = 28) {
    if (position === 'Tengah') return { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };
    return {
      left: position.includes('Kiri') ? `${marginX}px` : undefined,
      right: position.includes('Kanan') ? `${marginX}px` : undefined,
      top: position.includes('Atas') ? `${marginY}px` : undefined,
      bottom: position.includes('Bawah') ? `${marginY}px` : undefined,
    };
  }

  function positionFromPoint(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      xPct: Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100)),
      yPct: Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100)),
      rect,
    };
  }

  function dragBranding(e: React.MouseEvent<HTMLElement>, target: LiveTarget | '' = dragLive) {
    if (!target) return;
    const { xPct, yPct, rect } = positionFromPoint(e);
    const pos = cornerPosition(xPct, yPct);
    const marginX = Math.round(pos.includes('Kiri') ? (xPct / 100) * rect.width : ((100 - xPct) / 100) * rect.width);
    const marginY = Math.round(pos.includes('Atas') ? (yPct / 100) * rect.height : ((100 - yPct) / 100) * rect.height);
    if (target === 'logo') {
      updateConfig('branding.logoPosition', pos);
      if (pos !== 'Tengah') {
        updateConfig('branding.logoMarginX', Math.max(4, marginX));
        updateConfig('branding.logoMarginY', Math.max(4, marginY));
      }
    }
    if (target === 'cta') updateConfig('branding.ctaPosition', pos);
    if (target === 'watermark') updateConfig('branding.watermarkPosition', pos);
  }

  function dragLiveItem(e: React.MouseEvent<HTMLElement>, target = dragLive) {
    if (!target) return;
    if (target === 'logo' || target === 'cta' || target === 'watermark') {
      dragBranding(e, target);
      return;
    }
    const { xPct, yPct } = positionFromPoint(e);
    if (target === 'nowPlaying') {
      updateConfig('spectrum.nowPlayingX', Math.round(xPct));
      updateConfig('spectrum.nowPlayingY', Math.round(yPct));
      updateConfig('spectrum.nowPlayingPosition', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'spectrum') {
      updateConfig('spectrum.previewY', Math.round(yPct));
      updateConfig('spectrum.y', Math.round(yPct - 50));
      updateConfig('spectrum.position', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'timestamp') updateConfig('overlay.timestampPosition', cornerPosition(xPct, yPct));
    if (target === 'lowerThird')
      updateConfig('overlay.lowerThirdPosition', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
    if (target === 'lyrics') updateConfig('lyrics.position', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
  }

  function selectLive(e: React.MouseEvent<HTMLElement>, target: LiveTarget) {
    if (lockedLayers.has(target)) return;
    setSelectedLive(target);
    setDragLive(target);
    e.currentTarget.focus();
    dragLiveItem(e, target);
  }

  function resizeLiveItem(e: React.MouseEvent<HTMLElement>, target = resizeLive) {
    if (!target) return;
    const { xPct, yPct } = positionFromPoint(e);
    if (target === 'logo') updateConfig('branding.logoScale', Math.max(5, Math.min(100, Math.round(xPct))));
    if (target === 'cta') updateConfig('branding.ctaScale', Math.max(5, Math.min(100, Math.round(xPct))));
    if (target === 'spectrum')
      updateConfig('spectrum.height', Math.max(32, Math.min(300, Math.round(300 - (yPct / 100) * 220))));
    if (target === 'nowPlaying')
      updateConfig('spectrum.nowPlayingFontSize', Math.max(12, Math.min(60, Math.round(60 - (yPct / 100) * 40))));
  }

  function startResizeLive(e: React.MouseEvent<HTMLElement>, target: LiveTarget) {
    e.preventDefault();
    e.stopPropagation();
    if (lockedLayers.has(target)) return;
    setSelectedLive(target);
    setResizeLive(target);
    resizeLiveItem(e, target);
  }

  function nextCornerByNudge(position: string, dx: number, dy: number) {
    const x = position.includes('Kiri') ? 25 : position.includes('Kanan') ? 75 : 50;
    const y = position.includes('Atas') ? 25 : position.includes('Bawah') ? 75 : 50;
    return cornerPosition(Math.max(4, Math.min(96, x + dx)), Math.max(6, Math.min(94, y + dy)));
  }

  function handleLiveKey(e: React.KeyboardEvent<HTMLElement>, target: LiveTarget = selectedLive as LiveTarget) {
    if (!target || lockedLayers.has(target) || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
      return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
    if (target === 'nowPlaying') {
      const x = Math.max(4, Math.min(96, Number(getDeep(config, 'spectrum.nowPlayingX', 50)) + dx));
      const y = Math.max(6, Math.min(94, Number(getDeep(config, 'spectrum.nowPlayingY', 14)) + dy));
      updateConfig('spectrum.nowPlayingX', x);
      updateConfig('spectrum.nowPlayingY', y);
      updateConfig('spectrum.nowPlayingPosition', y < 34 ? 'Atas' : y > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'spectrum') {
      const y = Math.max(6, Math.min(94, Number(getDeep(config, 'spectrum.previewY', 74)) + dy));
      updateConfig('spectrum.previewY', y);
      updateConfig('spectrum.y', y - 50);
      updateConfig('spectrum.position', y < 34 ? 'Atas' : y > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'logo') {
      updateConfig(
        'branding.logoMarginX',
        Math.max(
          4,
          Number(getDeep(config, 'branding.logoMarginX', 20)) +
            (getDeep(config, 'branding.logoPosition', 'Kanan Atas').includes('Kiri') ? dx : -dx),
        ),
      );
      updateConfig(
        'branding.logoMarginY',
        Math.max(
          4,
          Number(getDeep(config, 'branding.logoMarginY', 20)) +
            (getDeep(config, 'branding.logoPosition', 'Kanan Atas').includes('Atas') ? dy : -dy),
        ),
      );
    }
    if (target === 'cta')
      updateConfig(
        'branding.ctaPosition',
        nextCornerByNudge(getDeep(config, 'branding.ctaPosition', 'Kanan Bawah'), dx * 8, dy * 8),
      );
    if (target === 'watermark')
      updateConfig(
        'branding.watermarkPosition',
        nextCornerByNudge(getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah'), dx * 8, dy * 8),
      );
    if (target === 'timestamp')
      updateConfig(
        'overlay.timestampPosition',
        nextCornerByNudge(getDeep(config, 'overlay.timestampPosition', 'Kiri Atas'), dx * 8, dy * 8),
      );
    if (target === 'lowerThird') {
      const cur = getDeep(config, 'overlay.lowerThirdPosition', 'Bawah');
      if (dy < 0) updateConfig('overlay.lowerThirdPosition', cur === 'Bawah' ? 'Tengah' : 'Atas');
      if (dy > 0) updateConfig('overlay.lowerThirdPosition', cur === 'Atas' ? 'Tengah' : 'Bawah');
    }
    if (target === 'lyrics') {
      const cur = getDeep(config, 'lyrics.position', 'Bawah');
      if (dy < 0) updateConfig('lyrics.position', cur === 'Bawah' ? 'Tengah' : 'Atas');
      if (dy > 0) updateConfig('lyrics.position', cur === 'Atas' ? 'Tengah' : 'Bawah');
    }
  }

  function centerLiveLayer(target: LiveTarget) {
    if (lockedLayers.has(target)) return;
    setSelectedLive(target);
    if (target === 'nowPlaying') {
      updateConfig('spectrum.nowPlayingX', 50);
      updateConfig('spectrum.nowPlayingY', 14);
      updateConfig('spectrum.nowPlayingPosition', 'Atas');
    }
    if (target === 'spectrum') {
      updateConfig('spectrum.previewY', 74);
      updateConfig('spectrum.y', 24);
      updateConfig('spectrum.position', 'Bawah');
    }
    if (target === 'logo') {
      updateConfig('branding.logoPosition', 'Kanan Atas');
      updateConfig('branding.logoMarginX', 28);
      updateConfig('branding.logoMarginY', 28);
    }
    if (target === 'cta') updateConfig('branding.ctaPosition', 'Kanan Bawah');
    if (target === 'watermark') updateConfig('branding.watermarkPosition', 'Kiri Bawah');
    if (target === 'timestamp') updateConfig('overlay.timestampPosition', 'Kiri Atas');
    if (target === 'lowerThird') updateConfig('overlay.lowerThirdPosition', 'Bawah');
    if (target === 'lyrics') updateConfig('lyrics.position', 'Bawah');
  }

  function toggleLayerLock(id: LiveTarget) {
    setLockedLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    dragLive,
    setDragLive,
    resizeLive,
    setResizeLive,
    selectedLive,
    setSelectedLive,
    lockedLayers,
    layerStackIndex,
    positionPoint,
    dragLiveItem,
    selectLive,
    startResizeLive,
    handleLiveKey,
    centerLiveLayer,
    toggleLayerLock,
  };
}
