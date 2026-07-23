import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionButtonGroup,
  Button,
  Card,
  CheckboxRow,
  FieldRow,
  PresetButtonGroup,
  Section,
  SliderControl,
  StatRow,
  WorkflowStepper,
} from './design-system-components';

describe('design system components', () => {
  it('associates FieldRow label with child input', () => {
    render(
      <FieldRow label="Output Pattern">
        <input />
      </FieldRow>,
    );

    expect(screen.getByLabelText('Output Pattern')).toBeInTheDocument();
  });

  it('renders accessible SliderControl and emits numeric changes', () => {
    const handleChange = vi.fn();

    render(<SliderControl label="Opacity" value={70} onChange={handleChange} min={0} max={100} />);

    fireEvent.change(screen.getByRole('slider', { name: 'Opacity' }), {
      target: { value: '85' },
    });

    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledWith(85);
  });

  it('renders CheckboxRow items and emits checked state', () => {
    const handleChange = vi.fn();

    render(<CheckboxRow items={[{ id: 'safe-area', label: 'Area Aman', checked: false }]} onChange={handleChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Area Aman' }));

    expect(handleChange).toHaveBeenCalledWith('safe-area', true);
  });

  it('renders preset buttons and emits selected id', () => {
    const handleChange = vi.fn();

    render(
      <PresetButtonGroup
        activeId="eco"
        presets={[
          { id: 'turbo', icon: 'T', label: 'TURBO' },
          { id: 'eco', icon: 'E', label: 'ECO' },
        ]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /TURBO/i }));

    expect(handleChange).toHaveBeenCalledWith('turbo');
  });

  it('renders StatRow values and labels', () => {
    render(
      <StatRow
        stats={[
          { label: 'Total Job', value: 4 },
          { label: 'Progress', value: '50%' },
        ]}
      />,
    );

    expect(screen.getByText('Total Job')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders Card with title, optional description, and children', () => {
    render(
      <Card title="Panduan Fitur" description="Ringkasan singkat">
        <p>Konten kartu</p>
      </Card>,
    );

    expect(screen.getByText('Panduan Fitur')).toBeInTheDocument();
    expect(screen.getByText('Ringkasan singkat')).toBeInTheDocument();
    expect(screen.getByText('Konten kartu')).toBeInTheDocument();
  });

  it('renders Card without description when omitted', () => {
    render(<Card title="Tanpa Deskripsi" />);

    expect(screen.getByText('Tanpa Deskripsi')).toBeInTheDocument();
  });

  it('renders Section with title and children', () => {
    render(
      <Section title="Pengaturan Lanjutan">
        <span>Isi section</span>
      </Section>,
    );

    expect(screen.getByText('Pengaturan Lanjutan')).toBeInTheDocument();
    expect(screen.getByText('Isi section')).toBeInTheDocument();
  });

  it('renders Button as primary by default and forwards click', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Render</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Render' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button variants without crashing', () => {
    render(
      <>
        <Button variant="secondary">Batal</Button>
        <Button variant="small">Kecil</Button>
        <Button variant="danger">Hapus</Button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kecil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus' })).toBeInTheDocument();
  });

  it('renders WorkflowStepper current step and disables edge navigation', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <WorkflowStepper
        steps={[
          { id: 'visual', label: 'Visual' },
          { id: 'audio', label: 'Audio' },
          { id: 'preview', label: 'Edit Preview' },
        ]}
        activeIndex={0}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );

    expect(screen.getByText('Langkah 1 dari 3')).toBeInTheDocument();
    expect(screen.getByText('Visual')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it('renders WorkflowStepper with Next disabled on last step', () => {
    render(
      <WorkflowStepper
        steps={[
          { id: 'visual', label: 'Visual' },
          { id: 'audio', label: 'Audio' },
        ]}
        activeIndex={1}
      />,
    );

    expect(screen.getByText('Langkah 2 dari 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled();
  });

  it('renders ActionButtonGroup actions and forwards click per item', () => {
    const onClickA = vi.fn();
    const onClickB = vi.fn();

    render(
      <ActionButtonGroup
        actions={[
          { id: 'start', label: 'Mulai', onClick: onClickA },
          { id: 'stop', label: 'Berhenti', onClick: onClickB, disabled: true },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));
    expect(onClickA).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Berhenti' })).toBeDisabled();
  });
});
