import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayerOrderInput } from './LayerOrderInput';

describe('LayerOrderInput UI', () => {
  const DEFAULT_VALUE = 'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird';

  it('renders all layer labels', () => {
    render(<LayerOrderInput value={DEFAULT_VALUE} onChange={() => {}} />);

    expect(screen.getByText('Bumper')).toBeInTheDocument();
    expect(screen.getByText('Particle')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('CTA')).toBeInTheDocument();
    expect(screen.getByText('Spectrum')).toBeInTheDocument();
    expect(screen.getByText('Lirik')).toBeInTheDocument();
    expect(screen.getByText('Watermark')).toBeInTheDocument();
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Lower Third')).toBeInTheDocument();
  });

  it('renders position numbers', () => {
    render(<LayerOrderInput value={DEFAULT_VALUE} onChange={() => {}} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('move up button reorders and calls onChange', () => {
    const onChange = vi.fn();
    render(<LayerOrderInput value="bumper,particle,logo" onChange={onChange} />);

    // Click move up on "particle" (index 1)
    const moveUpButtons = screen.getAllByLabelText(/ke atas/);
    fireEvent.click(moveUpButtons[1]); // particle's move up

    expect(onChange).toHaveBeenCalledWith('particle,bumper,logo');
  });

  it('move down button reorders and calls onChange', () => {
    const onChange = vi.fn();
    render(<LayerOrderInput value="bumper,particle,logo" onChange={onChange} />);

    // Click move down on "bumper" (index 0)
    const moveDownButtons = screen.getAllByLabelText(/ke bawah/);
    fireEvent.click(moveDownButtons[0]); // bumper's move down

    expect(onChange).toHaveBeenCalledWith('particle,bumper,logo');
  });

  it('first layer move up is disabled', () => {
    render(<LayerOrderInput value="bumper,particle,logo" onChange={() => {}} />);

    const moveUpButtons = screen.getAllByLabelText(/ke atas/);
    expect(moveUpButtons[0]).toBeDisabled();
  });

  it('last layer move down is disabled', () => {
    render(<LayerOrderInput value="bumper,particle,logo" onChange={() => {}} />);

    const moveDownButtons = screen.getAllByLabelText(/ke bawah/);
    expect(moveDownButtons[2]).toBeDisabled();
  });

  it('remove button removes layer from value', () => {
    const onChange = vi.fn();
    render(<LayerOrderInput value="bumper,particle,logo" onChange={onChange} />);

    const removeButtons = screen.getAllByLabelText(/Hapus layer/);
    fireEvent.click(removeButtons[1]); // remove "particle"

    expect(onChange).toHaveBeenCalledWith('bumper,logo');
  });

  it('shows inactive layers as add buttons when removed', () => {
    const onChange = vi.fn();
    render(<LayerOrderInput value="bumper,logo" onChange={onChange} />);

    // Should show add buttons for missing layers
    const addParticle = screen.getByText('+ Particle');
    expect(addParticle).toBeInTheDocument();

    fireEvent.click(addParticle);
    expect(onChange).toHaveBeenCalled();
    // The value should contain particle
    expect(onChange.mock.calls[0][0]).toContain('particle');
  });

  it('does not show add buttons when all layers active', () => {
    render(<LayerOrderInput value={DEFAULT_VALUE} onChange={() => {}} />);

    expect(screen.queryByText(/\+ /)).not.toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(<LayerOrderInput value={DEFAULT_VALUE} onChange={() => {}} />);

    expect(screen.getByText(/Drag untuk mengatur urutan/)).toBeInTheDocument();
  });
});
