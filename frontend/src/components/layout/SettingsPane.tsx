import React from 'react';
import { cn } from '../../lib/utils';

type SettingsPaneProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function SettingsPane({ title, collapsed, onToggle, children }: SettingsPaneProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-gradient-to-b from-ds-bg-elevated via-ds-bg-panel to-ds-bg-elevated border-r-2 border-ds-line-strong overflow-hidden transition-all duration-300 shadow-[4px_0_16px_rgba(0,0,0,0.4)]',
        collapsed ? 'w-0 opacity-0' : 'w-[360px] min-w-[360px]',
      )}
    >
      {/* Header with premium gradient and 3D border */}
      <div className="flex items-center justify-between h-11 px-4 border-b-2 border-ds-line-strong shrink-0 bg-gradient-to-r from-ds-bg-panel to-ds-bg-panel-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.3)]">
        <span className="text-[12px] font-bold text-ds-title tracking-wider uppercase truncate">{title}</span>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-ds-muted hover:text-ds-text hover:bg-ds-bg-hover transition-all duration-200 hover:shadow-sm"
          title="Tutup panel"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
      {/* Flex body without internal scrollbar (scroll handled by children) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="min-w-0 w-full h-full flex flex-col">{children}</div>
      </div>
    </aside>
  );
}
