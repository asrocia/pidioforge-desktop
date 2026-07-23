import { useState } from 'react';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import type { BrandingCardProps, BrandingEngineState, BrandingValidation } from './types';

export function useBrandingEngine({ config, updateConfig }: BrandingCardProps): BrandingEngineState {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<BrandingValidation | null>(null);
  const [busy, setBusy] = useState(false);

  const positionOptions = (
    <>
      <option>Kanan Atas</option>
      <option>Kiri Atas</option>
      <option>Kanan Bawah</option>
      <option>Kiri Bawah</option>
      <option>Tengah</option>
    </>
  );

  function applyBrandPreset(v: string) {
    updateConfig('branding.brandPreset', v);
    if (v === 'none') {
      updateConfig('branding.bumperEnabled', false);
      updateConfig('branding.logoEnabled', false);
      updateConfig('branding.ctaEnabled', false);
      updateConfig('branding.watermarkEnabled', false);
    }
    if (v === 'logo-only') {
      updateConfig('branding.logoEnabled', true);
      updateConfig('branding.bumperEnabled', false);
      updateConfig('branding.ctaEnabled', false);
      updateConfig('branding.watermarkEnabled', false);
      updateConfig('branding.logoPosition', 'Kanan Atas');
      updateConfig('branding.logoScale', 18);
    }
    if (v === 'logo-cta') {
      updateConfig('branding.logoEnabled', true);
      updateConfig('branding.ctaEnabled', true);
      updateConfig('branding.bumperEnabled', false);
      updateConfig('branding.ctaPreset', 'subscribe-lower-right');
      updateConfig('branding.ctaPosition', 'Kanan Bawah');
    }
    if (v === 'youtube-full') {
      updateConfig('branding.logoEnabled', true);
      updateConfig('branding.ctaEnabled', true);
      updateConfig('branding.bumperEnabled', true);
      updateConfig('branding.watermarkEnabled', true);
      updateConfig('branding.safeAreaPreset', 'youtube');
      updateConfig('branding.logoPosition', 'Kanan Atas');
      updateConfig('branding.ctaPosition', 'Kanan Bawah');
    }
    if (v === 'shorts') {
      updateConfig('branding.logoEnabled', true);
      updateConfig('branding.ctaEnabled', true);
      updateConfig('branding.bumperEnabled', false);
      updateConfig('branding.watermarkEnabled', true);
      updateConfig('branding.safeAreaPreset', 'shorts');
      updateConfig('branding.logoPosition', 'Kanan Atas');
      updateConfig('branding.ctaPosition', 'Kanan Bawah');
    }
  }

  function applyCtaPreset(v: string) {
    updateConfig('branding.ctaPreset', v);
    if (v === 'subscribe-lower-right') {
      updateConfig('branding.ctaPosition', 'Kanan Bawah');
      updateConfig('branding.ctaScale', 26);
      updateConfig('branding.ctaAt', 2);
      updateConfig('branding.ctaDuration', 8);
    }
    if (v === 'like-subscribe-bottom') {
      updateConfig('branding.ctaPosition', 'Kanan Bawah');
      updateConfig('branding.ctaScale', 34);
      updateConfig('branding.ctaAt', 4);
      updateConfig('branding.ctaDuration', 6);
    }
    if (v === 'bell-popup') {
      updateConfig('branding.ctaPosition', 'Kiri Bawah');
      updateConfig('branding.ctaScale', 24);
      updateConfig('branding.ctaAt', 8);
      updateConfig('branding.ctaDuration', 5);
    }
    if (v === 'center-cta') {
      updateConfig('branding.ctaPosition', 'Tengah');
      updateConfig('branding.ctaScale', 42);
      updateConfig('branding.ctaAt', 2);
      updateConfig('branding.ctaDuration', 4);
    }
  }

  async function validateBranding() {
    setBusy(true);
    setMessage('Memeriksa aset branding...');
    try {
      const data = await api('/api/branding/validate', { method: 'POST', body: JSON.stringify({ config }) });
      setValidation(data);
      setMessage(data.ok ? 'Aset branding siap.' : `Perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function previewBumper() {
    setBusy(true);
    try {
      await api('/api/branding/bumper/preview', { method: 'POST', body: JSON.stringify({ config }) });
      setMessage('Preview bumper siap!');
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return {
    message,
    validation,
    busy,
    setBusy,
    setMessage,
    applyBrandPreset,
    applyCtaPreset,
    validateBranding,
    previewBumper,
    positionOptions,
  };
}
