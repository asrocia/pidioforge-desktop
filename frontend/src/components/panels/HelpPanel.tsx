import React from 'react';

export function HelpPanel() {
  const guides = [
    ['Sumber & Engine', 'Pilih visual, audio, judul, output folder. Jalankan Scan & Cek sebelum membuat batch atau render.'],
    ['Branding', 'Atur logo, CTA, watermark, bumper, posisi, ukuran, opacity, dan durasi tampil.'],
    ['Audio & Mixing', 'Atur volume, normalize, limiter, EQ, fade, ducking, dan preset platform.'],
    ['Lirik Otomatis', 'Pilih file lirik atau tempel teks, lalu Parse, Selaraskan, Cek, dan atur style subtitle.'],
    ['Spektrum & Now Playing', 'Atur bar/wave/line, warna, posisi, progress bar, dan teks now playing. Matikan Spectrum, Progress Bar, dan Now Playing untuk output bersih.'],
    ['Overlay', 'Tambahkan particle, timestamp, lower third, border, vignette, darken, scanlines, dan letterbox.'],
    ['Queue', 'Tambah job manual/batch, Cek Sebelum Render, Mulai Antrian, pantau ETA, speed, output, dan error.'],
    ['Looping', 'Pilih video pendek, Auto Detect Loop, Preview Sambungan, pilih crossfade/ping-pong/trim, lalu Buat Looping.'],
    ['Preview Kanan', 'Visual langsung play. Drag layer logo, spectrum, timestamp, dan lower third. Render preview atau kirim ke antrian.'],
    ['Aktivitas', 'Gunakan tab Log/Pratinjau, Salin, Bersihkan, dan Status Render untuk memantau proses.'],
  ];
  const quickFlow = [
    'Pilih File Visual dan File Audio.',
    'Matikan fitur yang tidak dibutuhkan, misalnya Spectrum.',
    'Render preview atau Snapshot untuk cek tampilan.',
    'Klik Kirim ke Antrian atau Tambah Job Render.',
    'Klik Mulai Antrian dan pantau Status Render.',
  ];
  return <div className="helpPanel">
    <div className="targetGroup"><h3>Alur Cepat</h3><div className="helpSteps">{quickFlow.map((step, i) => <div key={step}><b>{i + 1}</b><span>{step}</span></div>)}</div></div>
    <div className="targetGroup"><h3>Panduan Fitur</h3><div className="helpGrid">{guides.map(([title, text]) => <div className="helpCard" key={title}><b>{title}</b><p>{text}</p></div>)}</div></div>
    <div className="targetGroup"><h3>Tips Penting</h3><div className="warningBox"><small>Restart aplikasi setelah update backend atau build baru.</small><small>Untuk loop panjang, gunakan Validasi Output dan tombol Batal bila proses terlalu lama.</small><small>Untuk hasil tanpa spectrum, matikan Spectrum, Progress Bar, dan Now Playing.</small></div></div>
  </div>;
}
