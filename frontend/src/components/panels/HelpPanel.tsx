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
  
  return (
    <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Help & Guide</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Quick start guide dan panduan fitur lengkap</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Alur Cepat */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Alur Cepat</h3>
          <div className="space-y-2">
            {quickFlow.map((step, i) => (
              <div key={step} className="flex items-start gap-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white text-[11px] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-[12px] text-[var(--text-primary)] leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panduan Fitur */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Panduan Fitur</h3>
          <div className="grid grid-cols-2 gap-3">
            {guides.map(([title, text]) => (
              <div key={title} className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:border-[var(--accent-primary)]/30 transition-all duration-200">
                <b className="text-[12px] text-[var(--accent-primary)] block mb-2">{title}</b>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Penting */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Tips Penting</h3>
          <div className="p-3 bg-[var(--accent-warning)]/10 border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-[var(--accent-warning)] text-[14px]">⚠</span>
              <small className="text-[11px] text-[var(--text-primary)] leading-relaxed">Restart aplikasi setelah update backend atau build baru.</small>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--accent-warning)] text-[14px]">⚠</span>
              <small className="text-[11px] text-[var(--text-primary)] leading-relaxed">Untuk loop panjang, gunakan Validasi Output dan tombol Batal bila proses terlalu lama.</small>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--accent-warning)] text-[14px]">⚠</span>
              <small className="text-[11px] text-[var(--text-primary)] leading-relaxed">Untuk hasil tanpa spectrum, matikan Spectrum, Progress Bar, dan Now Playing.</small>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Ctrl + S', 'Save Current Config'],
              ['Ctrl + R', 'Render Preview'],
              ['Ctrl + Q', 'Add to Queue'],
              ['Space', 'Play/Pause Preview'],
              ['Ctrl + Z', 'Undo'],
              ['Ctrl + Y', 'Redo'],
              ['Ctrl + D', 'Duplicate Job'],
              ['Delete', 'Remove Selected'],
              ['F5', 'Refresh Queue'],
              ['Ctrl + ,', 'Open Settings'],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                <span className="text-[11px] text-[var(--text-muted)]">{action}</span>
                <kbd className="px-2 py-1 text-[10px] font-mono font-bold text-[var(--text-primary)] bg-[var(--primary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)]">{key}</kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Troubleshooting</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[11px] text-[var(--accent-danger)] block mb-2">❌ FFmpeg Not Found</b>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-2">Install FFmpeg and add to system PATH. Restart application after installation.</p>
              <a href="https://ffmpeg.org/download.html" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--accent-primary)] hover:underline">Download FFmpeg →</a>
            </div>
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[11px] text-[var(--accent-danger)] block mb-2">❌ Render Failed</b>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Check: 1) File paths are valid, 2) Sufficient disk space, 3) No special characters in filenames, 4) FFmpeg is working.</p>
            </div>
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[11px] text-[var(--accent-danger)] block mb-2">❌ Preview Not Loading</b>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Try: 1) Refresh browser, 2) Clear cache, 3) Check if backend server is running, 4) Verify file formats are supported.</p>
            </div>
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[11px] text-[var(--accent-danger)] block mb-2">❌ Slow Performance</b>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Solutions: 1) Use GPU acceleration, 2) Lower resolution/quality, 3) Reduce concurrent jobs, 4) Close other applications.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {[
              {
                q: 'What video formats are supported?',
                a: 'MP4, MOV, AVI, MKV, WebM for input. Output is MP4 (H.264/H.265) by default.'
              },
              {
                q: 'Can I use custom fonts for lyrics?',
                a: 'Yes, specify font name in Lyrics panel. Font must be installed on your system.'
              },
              {
                q: 'How do I batch process multiple videos?',
                a: 'Use Target panel → Batch Folder, scan files, then Create Batch. Or add jobs manually in Queue panel.'
              },
              {
                q: 'What is the difference between Draft and High Quality?',
                a: 'Draft uses faster encoding (lower CRF, veryfast preset). High Quality uses slower encoding (lower CRF, slow preset) for better visual quality.'
              },
              {
                q: 'Can I use GPU acceleration?',
                a: 'Yes, set Hardware Accel to nvidia/intel/amd in Target panel. Requires compatible GPU and drivers.'
              },
              {
                q: 'How do I create seamless loops?',
                a: 'Use Looping panel → Auto Detect Loop → Preview → Create Looping. Adjust crossfade duration for smooth transitions.'
              },
            ].map(({ q, a }) => (
              <div key={q} className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                <b className="text-[11px] text-[var(--accent-primary)] block mb-2">Q: {q}</b>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">A: {a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Requirements */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">System Requirements</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[11px] text-[var(--accent-success)] block mb-2">✅ Minimum</b>
              <ul className="space-y-1 text-[10px] text-[var(--text-muted)]">
                <li>• CPU: 4 cores, 2.5 GHz</li>
                <li>• RAM: 8 GB</li>
                <li>• Storage: 10 GB free</li>
                <li>• OS: Windows 10/11, macOS 10.15+, Linux</li>
                <li>• FFmpeg 4.4+</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[11px] text-[var(--accent-primary)] block mb-2">🚀 Recommended</b>
              <ul className="space-y-1 text-[10px] text-[var(--text-muted)]">
                <li>• CPU: 8+ cores, 3.5+ GHz</li>
                <li>• RAM: 16+ GB</li>
                <li>• Storage: SSD with 50+ GB free</li>
                <li>• GPU: NVIDIA/AMD with 4+ GB VRAM</li>
                <li>• FFmpeg 5.0+ with GPU support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Video Tutorials */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Video Tutorials</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Getting Started', duration: '5:30', level: 'Beginner' },
              { title: 'Batch Processing', duration: '8:15', level: 'Intermediate' },
              { title: 'Advanced Branding', duration: '12:40', level: 'Advanced' },
              { title: 'Custom Overlays', duration: '10:20', level: 'Intermediate' },
              { title: 'Audio Mixing Tips', duration: '7:45', level: 'Intermediate' },
              { title: 'Performance Tuning', duration: '6:30', level: 'Advanced' },
            ].map(({ title, duration, level }) => (
              <div key={title} className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:border-[var(--accent-primary)]/30 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <b className="text-[11px] text-[var(--text-primary)]">{title}</b>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">{level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">⏱ {duration}</span>
                  <span className="text-[10px] text-[var(--accent-primary)] ml-auto">▶ Watch</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Community */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Support & Community</h3>
          <div className="grid grid-cols-3 gap-3">
            <a href="#" className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:border-[var(--accent-primary)]/30 transition-all duration-200 text-center">
              <div className="text-[20px] mb-2">📖</div>
              <b className="text-[11px] text-[var(--text-primary)] block">Documentation</b>
              <small className="text-[9px] text-[var(--text-muted)]">Full guides</small>
            </a>
            <a href="#" className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:border-[var(--accent-primary)]/30 transition-all duration-200 text-center">
              <div className="text-[20px] mb-2">💬</div>
              <b className="text-[11px] text-[var(--text-primary)] block">Discord</b>
              <small className="text-[9px] text-[var(--text-muted)]">Join community</small>
            </a>
            <a href="#" className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:border-[var(--accent-primary)]/30 transition-all duration-200 text-center">
              <div className="text-[20px] mb-2">🐛</div>
              <b className="text-[11px] text-[var(--text-primary)] block">Report Bug</b>
              <small className="text-[9px] text-[var(--text-muted)]">GitHub Issues</small>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
