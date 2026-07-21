import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const emptyManifest = {
  schemaVersion: 1,
  generatedAt: null,
  assetBase: '/assets/examples/',
  examples: [],
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => emptyManifest,
    }),
  );
});

describe('SceneActBench project page', () => {
  it('renders the required architecture and benchmark facts', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /SceneActBench: Can Agents Act on the 3D Scenes They See\?/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Benchmark statistics')).not.toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Page sections' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(8);
    expect(within(navigation).queryByRole('link', { name: 'Resources' })).not.toBeInTheDocument();
    for (const title of [
      'TL;DR',
      'Leaderboard',
      'Examples',
      'Benchmark',
      'Tasks',
      'Metrics',
      'Analysis',
      'Citation',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(screen.queryByText('Authors & citation')).not.toBeInTheDocument();
    expect(screen.getAllByText('Doubao Seed 2.0 Pro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Claude Sonnet 5').length).toBeGreaterThan(0);
    expect(screen.getByText('Maximum Part Error')).toBeInTheDocument();
    expect(screen.getByText('Maximum Mover Error')).toBeInTheDocument();
    expect(screen.getByText('Average Mover Error')).toBeInTheDocument();

    expect(await screen.findByText('Schema v1')).toBeInTheDocument();
  });

  it('supports keyboard-friendly task selection and camera-specific output', () => {
    render(<App />);

    const articulatedTab = screen.getByRole('tab', { name: /Articulated Open/i });
    articulatedTab.focus();
    fireEvent.keyDown(articulatedTab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Reconstruction Rebuild/i })).toHaveFocus();
    expect(screen.getByText(/Recover measurable 3D geometry/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(screen.getByText('camera_pose.json')).toBeInTheDocument();
    expect(screen.getByText(/Camera examples use pose JSON and rendered images/i)).toBeInTheDocument();
  });

  it('opens and closes analysis figures as an accessible dialog', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge Ranking decomposition' }));

    const dialog = screen.getByRole('dialog', { name: 'Ranking decomposition' });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close figure' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not expose superseded metric labels', () => {
    render(<App />);
    const text = document.body.textContent ?? '';
    const oldPartLabel = ['W', 'PE'].join('');
    const oldMoverLabel = ['W', 'ME'].join('');
    expect(text).not.toContain(oldPartLabel);
    expect(text).not.toContain(oldMoverLabel);
  });
});
