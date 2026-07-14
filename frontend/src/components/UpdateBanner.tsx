import { useEffect, useState } from 'react';
import type { UpdateStatusInfo } from '../types/global';

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateStatusInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const updater = window.pidioforge;
    const unsubscribe = updater?.onUpdateStatus(setUpdate);
    updater?.checkUpdate().catch(() => setUpdate({ status: 'error', error: 'Updater tidak tersedia' }));
    return unsubscribe;
  }, []);

  if (!update || update.status === 'checking' || update.status === 'up-to-date') return null;

  async function downloadUpdate() {
    if (!window.pidioforge || busy) return;
    setBusy(true);
    try {
      await window.pidioforge.downloadUpdate();
    } finally {
      setBusy(false);
    }
  }

  async function installUpdate() {
    await window.pidioforge?.installUpdate();
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
    return <div className="updateBanner" role="status">Mengunduh update {Math.round(update.percent || 0)}%</div>;
  }

  if (update.status === 'ready') {
    return (
      <div className="updateBanner" role="status">
        <span>Update siap dipasang</span>
        <button type="button" onClick={installUpdate}>Restart dan pasang</button>
      </div>
    );
  }

  return <div className="updateBanner updateError" role="alert">Update gagal: {update.error || 'periksa koneksi internet'}</div>;
}

export default UpdateBanner;
