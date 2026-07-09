import { describe, it, expect } from 'vitest';
import { cleanUiText, formatDuration, formatBytes } from '../lib/format';

describe('cleanUiText', () => {
  it('returns empty string for null/undefined', () => {
    expect(cleanUiText(null)).toBe('');
    expect(cleanUiText(undefined)).toBe('');
  });

  it('replaces garbled characters', () => {
    expect(cleanUiText('Ã¢â‚¬Â¢')).toBe(' - ');
    expect(cleanUiText('â€¢')).toBe(' - ');
  });

  it('translates common terms to Indonesian', () => {
    expect(cleanUiText('Warning: test')).toBe('Perhatian: test');
    expect(cleanUiText('GUI siap.')).toBe('Aplikasi siap.');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45d');
    expect(formatDuration(0)).toBe('0d');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5d');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('1j 1m 1d');
  });

  it('handles invalid input', () => {
    expect(formatDuration(null)).toBe('0d');
    expect(formatDuration('abc')).toBe('0d');
    expect(formatDuration(-10)).toBe('0d');
  });
});

describe('formatBytes', () => {
  it('returns dash for zero/falsy', () => {
    expect(formatBytes(0)).toBe('-');
    expect(formatBytes(null)).toBe('-');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });
});
