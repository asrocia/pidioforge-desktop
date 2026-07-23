import type { PidioConfig } from '../../../types/app.types';

export type BrandingValidation = { ok?: boolean; warnings?: string[] };

export interface BrandingCardProps {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface BrandingEngineState {
  message: string;
  validation: BrandingValidation | null;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setMessage: (v: string) => void;
  applyBrandPreset: (v: string) => void;
  applyCtaPreset: (v: string) => void;
  validateBranding: () => Promise<void>;
  previewBumper: () => Promise<void>;
  positionOptions: React.ReactNode;
}
