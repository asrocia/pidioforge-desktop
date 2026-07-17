import React, { useState, useRef, DragEvent } from 'react';
import { cn } from '../../utils/cn';

type DragDropZoneProps = {
  onFileDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

export function DragDropZone({
  onFileDrop,
  accept = '*',
  multiple = false,
  maxSize = 500,
  className,
  children,
  disabled = false,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    setIsDragging(false);
    dragCounter.current = 0;
    setError('');

    const files = Array.from(e.dataTransfer.files);
    
    if (!multiple && files.length > 1) {
      setError('Only one file allowed');
      return;
    }

    // Validate file types
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const invalidFiles = files.filter(file => {
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const fileMime = file.type;
        return !acceptedTypes.some(type => 
          type === fileExt || 
          type === fileMime ||
          (type.endsWith('/*') && fileMime.startsWith(type.replace('/*', '')))
        );
      });

      if (invalidFiles.length > 0) {
        setError(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
    }

    // Validate file sizes
    const maxBytes = maxSize * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxBytes);
    if (oversizedFiles.length > 0) {
      setError(`File too large (max ${maxSize}MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    onFileDrop(files);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setError('');
      onFileDrop(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }

  function openFileDialog() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div className={cn('relative', className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          'relative border-2 border-dashed rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 scale-[1.02]'
            : 'border-[var(--border-medium)] hover:border-[var(--accent-primary)] hover:bg-[var(--tertiary-bg)]',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        {children || (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <svg
              className={cn(
                'w-12 h-12 mb-3 transition-colors',
                isDragging ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              or click to browse
            </p>
            {accept !== '*' && (
              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                Accepted: {accept}
              </p>
            )}
            {maxSize && (
              <p className="text-[10px] text-[var(--text-muted)]">
                Max size: {maxSize}MB
              </p>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <div className="mt-2 px-3 py-2 bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 rounded-[var(--radius-md)] text-[11px] text-[var(--accent-danger)]">
          {error}
        </div>
      )}
    </div>
  );
}

export function FileDropIndicator({ file, onRemove }: { file: File; onRemove: () => void }) {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[var(--secondary-bg)] border border-[var(--border-medium)] rounded-[var(--radius-md)]">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)]/10 rounded-[var(--radius-sm)]">
        <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{file.name}</p>
        <p className="text-[10px] text-[var(--text-muted)]">{sizeInMB} MB</p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
