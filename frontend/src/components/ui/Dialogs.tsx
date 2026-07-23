/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

type DialogValue = string | boolean | null;

type DialogState = {
  id: string;
  type: 'confirm' | 'prompt';
  message: string;
  defaultValue?: string;
  resolve: (value: DialogValue) => void;
};

let setDialogState: React.Dispatch<React.SetStateAction<DialogState | null>> | null = null;

export async function showConfirm(message: string): Promise<boolean> {
  return new Promise(resolve => {
    if (setDialogState) {
      setDialogState({
        id: Math.random().toString(),
        type: 'confirm',
        message,
        resolve: value => resolve(Boolean(value)),
      });
      return;
    }
    resolve(window.confirm(message));
  });
}

export async function showPrompt(message: string, defaultValue = ''): Promise<string | null> {
  return new Promise(resolve => {
    if (setDialogState) {
      setDialogState({
        id: Math.random().toString(),
        type: 'prompt',
        message,
        defaultValue,
        resolve: value => resolve(typeof value === 'string' ? value : null),
      });
      return;
    }
    resolve(window.prompt(message, defaultValue));
  });
}

export function DialogProvider() {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDialogState = setDialog;
    return () => {
      setDialogState = null;
    };
  }, []);

  if (!dialog) return null;

  const currentDialog = dialog;

  function promptValue(): string {
    return inputRef.current?.value ?? currentDialog.defaultValue ?? '';
  }

  function handleClose(value: DialogValue) {
    currentDialog.resolve(value);
    setDialog(null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose(currentDialog.type === 'prompt' ? null : false);
      return;
    }
    if (e.key === 'Enter') {
      handleClose(currentDialog.type === 'prompt' ? promptValue() : true);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[var(--secondary-bg)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-2xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-message"
      >
        <div
          id="dialog-message"
          className="text-[14px] font-medium text-[var(--text-primary)] mb-4 leading-relaxed whitespace-pre-wrap"
        >
          {dialog.message}
        </div>

        {dialog.type === 'prompt' && (
          <input
            key={dialog.id}
            ref={inputRef}
            autoFocus
            type="text"
            defaultValue={dialog.defaultValue || ''}
            onKeyDown={onKeyDown}
            className="w-full bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] mb-4"
          />
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose(dialog.type === 'prompt' ? null : false)}
            autoFocus={dialog.type === 'confirm'}
          >
            Batal
          </Button>
          <Button
            variant={dialog.message.toLowerCase().includes('hapus') ? 'danger' : 'primary'}
            size="sm"
            onClick={() => handleClose(dialog.type === 'prompt' ? promptValue() : true)}
          >
            {dialog.type === 'prompt' ? 'Simpan' : dialog.message.toLowerCase().includes('hapus') ? 'Hapus' : 'Ya'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
