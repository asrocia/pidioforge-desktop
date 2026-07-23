import { useCallback } from 'react';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import { showToast } from '../../ui/Toast';
import { showConfirm } from '../../ui/Dialogs';
import type { Job } from '../../../types/app.types';

export function useQueueActions(jobs: Job[], refresh: () => void) {
  const startNext = useCallback(async () => {
    try {
      await api('/api/jobs/start-next', { method: 'POST' });
      showToast('success', 'Job berikutnya dimulai!');
      refresh();
    } catch (e: unknown) {
      showToast('error', `Gagal memulai job: ${errorMessage(e)}`);
    }
  }, [refresh]);

  const startQueue = useCallback(async () => {
    if (jobs.length === 0) {
      showToast('warning', 'Tidak ada job dalam antrian!');
      return;
    }
    try {
      await api('/api/queue/start', { method: 'POST' });
      showToast('success', 'Antrian dimulai!');
      refresh();
    } catch (e: unknown) {
      showToast('error', `Gagal memulai antrian: ${errorMessage(e)}`);
    }
  }, [refresh, jobs.length]);

  const reset = useCallback(async () => {
    if (await showConfirm('Reset semua antrian?')) {
      try {
        await api('/api/jobs/reset', { method: 'POST' });
        showToast('success', 'Antrian direset!');
        refresh();
      } catch (e: unknown) {
        showToast('error', `Gagal reset antrian: ${errorMessage(e)}`);
      }
    }
  }, [refresh]);

  const start = useCallback(
    async (id: string) => {
      try {
        await api(`/api/jobs/${id}/start`, { method: 'POST' });
        showToast('success', 'Job dimulai!');
        refresh();
      } catch (e: unknown) {
        showToast('error', `Gagal memulai job: ${errorMessage(e)}`);
      }
    },
    [refresh],
  );

  const cancel = useCallback(
    async (id: string) => {
      try {
        await api(`/api/jobs/${id}/cancel`, { method: 'POST' });
        showToast('success', 'Job dibatalkan!');
        refresh();
      } catch (e: unknown) {
        showToast('error', `Gagal membatalkan job: ${errorMessage(e)}`);
      }
    },
    [refresh],
  );

  return { startNext, startQueue, reset, start, cancel };
}
