import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { api } from '../lib/api';
import type { Project } from '../types/app.types';
import { showPrompt, showConfirm } from './ui/Dialogs';
import { showToast } from './ui/Toast';

interface ProjectTabsProps {
  projects: Project[];
  activeProjectId: string;
  onSwitch: (id: string) => void;
  onRefresh: () => void;
}

export function ProjectTabs({ projects, activeProjectId, onSwitch, onRefresh }: ProjectTabsProps) {
  const [busy, setBusy] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  async function createProject() {
    const name = await showPrompt('Nama project baru?');
    if (!name) return;
    setBusy(true);
    try {
      const p = await api('/api/projects', { method: 'POST', body: JSON.stringify({ name }) });
      onSwitch(p.id);
      onRefresh();
    } catch (e: unknown) {
      showToast('error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function activateProject(id: string) {
    if (id === activeProjectId) return;
    setBusy(true);
    try {
      await api(`/api/projects/${id}/activate`, { method: 'POST' });
      onSwitch(id);
      onRefresh();
    } catch (e: unknown) {
      showToast('error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function renameProject(id: string) {
    const project = projects.find(p => p.id === id);
    const name = await showPrompt('Nama baru:', project?.name || '');
    if (!name) return;
    try {
      await api(`/api/projects/${id}/rename`, { method: 'POST', body: JSON.stringify({ name }) });
      onRefresh();
    } catch (e: unknown) {
      showToast('error', (e as Error).message);
    }
    setContextMenu(null);
  }

  async function duplicateProject(id: string) {
    try {
      await api(`/api/projects/${id}/duplicate`, { method: 'POST' });
      onRefresh();
    } catch (e: unknown) {
      showToast('error', (e as Error).message);
    }
    setContextMenu(null);
  }

  async function deleteProject(id: string) {
    if (projects.length <= 1) {
      showToast('warning', 'Tidak bisa menghapus project terakhir.');
      return;
    }
    if (!(await showConfirm('Hapus project ini?'))) return;
    try {
      await api(`/api/projects/${id}/delete`, { method: 'POST' });
      onRefresh();
    } catch (e: unknown) {
      showToast('error', (e as Error).message);
    }
    setContextMenu(null);
  }

  function handleContextMenu(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  }

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 bg-[#080d14] border-b border-[rgba(142,162,184,0.12)] overflow-x-auto"
      onClick={() => setContextMenu(null)}
    >
      {projects.map(p => (
        <button
          key={p.id}
          onClick={() => activateProject(p.id)}
          onContextMenu={e => handleContextMenu(e, p.id)}
          disabled={busy}
          className={cn(
            'px-2.5 py-1 text-[10px] rounded-t-md border border-b-0 whitespace-nowrap transition-colors',
            p.id === activeProjectId
              ? 'bg-[#121821] border-[rgba(142,162,184,0.22)] text-[#dce8ef] font-semibold'
              : 'bg-transparent border-transparent text-[#8da0af] hover:text-[#dce8ef] hover:bg-[#0f1620]',
          )}
        >
          {p.name}
        </button>
      ))}
      <button
        onClick={createProject}
        disabled={busy}
        className="px-2 py-1 text-[10px] text-[#8da0af] hover:text-[#4f8ef7] transition-colors"
        title="Buat project baru"
        aria-label="Buat project baru"
      >
        +
      </button>

      {contextMenu && (
        <div
          className="fixed z-50 bg-[#121821] border border-[rgba(142,162,184,0.22)] rounded-md shadow-lg py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => renameProject(contextMenu.id)}
            className="block w-full text-left px-3 py-1.5 text-[10px] text-[#dce8ef] hover:bg-[#1a2030]"
          >
            Rename
          </button>
          <button
            onClick={() => duplicateProject(contextMenu.id)}
            className="block w-full text-left px-3 py-1.5 text-[10px] text-[#dce8ef] hover:bg-[#1a2030]"
          >
            Duplikat
          </button>
          <button
            onClick={() => deleteProject(contextMenu.id)}
            className="block w-full text-left px-3 py-1.5 text-[10px] text-[#e76d78] hover:bg-[#1a2030]"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}
