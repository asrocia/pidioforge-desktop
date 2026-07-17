import { lazy } from 'react';

// Lazy load all panel components for better performance
export const TargetPanel = lazy(() => import('./TargetPanel').then(m => ({ default: m.TargetPanel })));
export const SpectrumPanel = lazy(() => import('./SpectrumPanel').then(m => ({ default: m.SpectrumPanel })));
export const LyricsPanel = lazy(() => import('./LyricsPanel').then(m => ({ default: m.LyricsPanel })));
export const BrandingPanel = lazy(() => import('./BrandingPanel').then(m => ({ default: m.BrandingPanel })));
export const OverlayPanel = lazy(() => import('./OverlayPanel').then(m => ({ default: m.OverlayPanel })));
export const AudioMixingPanel = lazy(() => import('./AudioMixingPanel').then(m => ({ default: m.AudioMixingPanel })));
export const LoopingPanel = lazy(() => import('./LoopingPanel').then(m => ({ default: m.LoopingPanel })));
export const QueuePanel = lazy(() => import('./QueuePanel').then(m => ({ default: m.QueuePanel })));
export const HelpPanel = lazy(() => import('./HelpPanel').then(m => ({ default: m.HelpPanel })));
export const TemplatesPanel = lazy(() => import('./TemplatesPanel').then(m => ({ default: m.TemplatesPanel })));
