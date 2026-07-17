import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';

export interface PreviewStreamOptions {
  startAt?: number;
  duration?: number;
  quality?: 'draft' | 'medium' | 'high';
  fps?: number;
  width?: number;
  height?: number;
  mode?: 'live' | 'full';
}

export interface PreviewStreamProgress {
  progress: number;
  currentTime: number;
  duration: number;
  elapsed: number;
}

export interface PreviewStreamResult {
  id: string;
  url: string;
  output: string;
  duration: number;
  startAt: number;
  resolution: string;
  fps?: number;
  quality: string;
  elapsed: number;
  speed: string;
  size: number;
  logs?: string[];
  progress?: PreviewStreamProgress;
}

export function usePreviewStream() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<PreviewStreamProgress | null>(null);
  const [result, setResult] = useState<PreviewStreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generatePreview = useCallback(async (
    config: any,
    options: PreviewStreamOptions = {}
  ) => {
    setIsGenerating(true);
    setProgress(null);
    setResult(null);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const endpoint = options.mode === 'full' 
        ? '/api/preview/full' 
        : '/api/preview/live';

      const response = await api<PreviewStreamResult>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify({
            config,
            startAt: options.startAt ?? 0,
            duration: options.duration ?? 10,
            quality: options.quality ?? 'draft',
            fps: options.fps ?? 15,
            width: options.width ?? 640,
            height: options.height ?? 360,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.progress) {
        setProgress(response.progress);
      }

      setResult(response);
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Preview generation cancelled');
      } else {
        setError(err.message || 'Failed to generate preview');
      }
      throw err;
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelPreview = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const cleanupPreviews = useCallback(async (maxAge?: number) => {
    try {
      await api('/api/preview/cleanup', { 
        method: 'POST',
        body: JSON.stringify({ maxAge })
      });
    } catch (err: any) {
      console.error('Failed to cleanup previews:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isGenerating,
    progress,
    result,
    error,
    generatePreview,
    cancelPreview,
    cleanupPreviews,
  };
}

export function usePreviewPolling(
  previewUrl: string | null,
  interval: number = 2000
) {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setVideoUrl(null);
      return;
    }

    const checkPreview = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(previewUrl);
        if (response.ok) {
          setVideoUrl(previewUrl);
          setError(null);
          // Stop polling once we have the video
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkPreview();

    // Start polling
    intervalRef.current = setInterval(checkPreview, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [previewUrl, interval]);

  return { isLoading, videoUrl, error };
}
