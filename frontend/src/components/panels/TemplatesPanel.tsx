import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { cn } from '../../utils/cn';
import type { ModuleKey } from '../../types/app.types';

type Template = {
  id: string;
  name: string;
  description: string;
  modules: ModuleKey[];
  config: any;
  createdAt: string;
};

export function TemplatesPanel({ config }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', modules: [] as ModuleKey[] });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await api('/api/templates');
      setTemplates(data.templates || []);
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  async function createTemplate() {
    if (!newTemplate.name) {
      setMessage('Nama template harus diisi');
      return;
    }
    setBusy(true);
    try {
      await api('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          modules: newTemplate.modules,
          config: config,
        }),
      });
      setMessage('Template berhasil disimpan');
      setShowCreate(false);
      setNewTemplate({ name: '', description: '', modules: [] });
      await loadTemplates();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function applyTemplate(id: string) {
    setBusy(true);
    try {
      await api(`/api/templates/${id}/apply`, { method: 'POST' });
      setMessage('Template berhasil diterapkan');
      // Refresh config from parent
      window.location.reload();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Hapus template ini?')) return;
    setBusy(true);
    try {
      await api(`/api/templates/${id}`, { method: 'DELETE' });
      setMessage('Template berhasil dihapus');
      await loadTemplates();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  const moduleOptions: { key: ModuleKey; label: string }[] = [
    { key: 'target', label: 'Target & Workflow' },
    { key: 'branding', label: 'Branding' },
    { key: 'audio', label: 'Audio Mixing' },
    { key: 'lyrics', label: 'Lyrics' },
    { key: 'spectrum', label: 'Spectrum' },
    { key: 'overlay', label: 'Overlay' },
    { key: 'loop', label: 'Looping' },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--primary-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Templates</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Quick start templates untuk berbagai use case</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
        >
          {showCreate ? 'Batal' : 'Buat Template'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Message */}
        {message && (
          <div className={cn(
            'px-4 py-3 rounded-[var(--radius-md)] text-[13px]',
            message.includes('berhasil') || message.includes('OK')
              ? 'bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-success)]'
              : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--accent-danger)]'
          )}>
            {message}
          </div>
        )}

        {/* Create Template Form */}
        {showCreate && (
          <div className="bg-[var(--secondary-bg)] border border-[var(--border-medium)] rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Buat Template Baru</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] text-[var(--text-secondary)] mb-2">Nama Template</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., YouTube Music Video"
                  className="w-full bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] px-3 py-2 outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-secondary)] mb-2">Deskripsi</label>
                <textarea
                  value={newTemplate.description}
                  onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang template ini..."
                  rows={3}
                  className="w-full bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] px-3 py-2 outline-none focus:border-[var(--accent-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-secondary)] mb-2">Modul yang Disertakan</label>
                <div className="flex flex-col gap-2">
                  {moduleOptions.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTemplate.modules.includes(key)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewTemplate({ ...newTemplate, modules: [...newTemplate.modules, key] });
                          } else {
                            setNewTemplate({ ...newTemplate, modules: newTemplate.modules.filter(m => m !== key) });
                          }
                        }}
                        className="accent-[var(--accent-primary)]"
                      />
                      <span className="text-[12px] text-[var(--text-primary)]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={createTemplate}
              disabled={busy || !newTemplate.name}
              className="w-full px-4 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>
        )}

        {/* Templates List */}
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p className="text-[14px]">Belum ada template tersimpan</p>
              <p className="text-[12px] mt-2">Buat template pertama Anda untuk quick start</p>
            </div>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                className="bg-[var(--secondary-bg)] border border-[var(--border-medium)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{template.name}</h4>
                    {template.description && (
                      <p className="text-[12px] text-[var(--text-secondary)] mb-2">{template.description}</p>
                    )}
                    {template.modules.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {template.modules.map(mod => (
                          <span
                            key={mod}
                            className="px-2 py-0.5 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded text-[10px] text-[var(--text-muted)]"
                          >
                            {moduleOptions.find(m => m.key === mod)?.label || mod}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => applyTemplate(template.id)}
                      disabled={busy}
                      className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-[var(--radius-sm)] text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      Terapkan
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      disabled={busy}
                      className="px-3 py-1.5 bg-[var(--accent-danger)] hover:bg-[var(--accent-danger-hover)] text-white rounded-[var(--radius-sm)] text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Dibuat: {new Date(template.createdAt).toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
