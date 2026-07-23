import { useEffect, useState } from 'react';
import type { UpdateStatusInfo } from '../types/global';
import { useSafeElectronBridge } from '../hooks/useSafeElectronBridge';

const UNAVAILABLE_UPDATE_STATUS: UpdateStatusInfo = {
  status: 'error',
  error: 'Updater tidak tersedia di mode browser',
};

const UPDATE_ERROR_PREFIX = 'Update gagal:';

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateStatusInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const { bridge, available, unavailableMessage } = useSafeElectronBridge();

  useEffect(() => {
    if (!available || !bridge) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUpdate(UNAVAILABLE_UPDATE_STATUS);
      return;
    }
    const unsubscribe = bridge.onUpdateStatus(setUpdate);
    bridge.checkUpdate().catch(() => setUpdate(UNAVAILABLE_UPDATE_STATUS));
    return unsubscribe;
  }, [available, bridge]);

  if (!update || update.status === 'checking' || update.status === 'up-to-date') return null;

  async function downloadUpdate() {
    if (!bridge || busy) return;
    setBusy(true);
    try {
      await bridge.downloadUpdate();
    } finally {
      setBusy(false);
    }
  }

  async function installUpdate() {
    if (!bridge) return;
    await bridge.installUpdate();
  }

  if (update.status === 'available') {
    return (
      <div className="updateBanner" role="status">
        <span>Update {update.version || 'baru'} tersedia</span>
        <button type="button" onClick={downloadUpdate} disabled={busy}>
          {busy ? 'Memulai...' : 'Download'}
        </button>
      </div>
    );
  }

  if (update.status === 'downloading') {
    return (
      <div className="updateBanner" role="status">
        Mengunduh update {Math.round(update.percent || 0)}%
      </div>
    );
  }

  if (update.status === 'ready') {
    return (
      <div className="updateBanner" role="status">
        <span>Update siap dipasang</span>
        <button type="button" onClick={installUpdate}>
          Restart dan pasang
        </button>
      </div>
    );
  }

  return (
    <div className="updateBanner updateError" role="alert">
      {UPDATE_ERROR_PREFIX} {update.error || unavailableMessage || 'periksa koneksi internet'}
    </div>
  );
}

export default UpdateBanner;
