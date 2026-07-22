import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { links } from './data/site';

const emptyManifest = {
  schemaVersion: 1,
  generatedAt: null,
  assetBase: '/assets/examples/',
  examples: [],
};

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
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
    expect(
      screen.getByRole('link', { name: 'SceneActBench home' }).querySelector('img'),
    ).toHaveAttribute('src', expect.stringContaining('hunyuan-mark.png'));
    expect(screen.queryByText('Scene intelligence, made executable')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/A unified benchmark that asks multimodal agents/i),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: /Dataset/i }),
    ).toHaveAttribute('href', links.dataset);
    expect(screen.queryByLabelText('Benchmark statistics')).not.toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Page sections' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(8);
    expect(within(navigation).queryByRole('link', { name: 'Resources' })).not.toBeInTheDocument();
    for (const title of [
      'Abstract',
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
    expect(
      screen.getByText(/Vision-language model \(VLM\) agents increasingly use tools/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Acting makes 3D understanding observable.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Close Overall scores conceal different capabilities.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'One fixed loop makes every final artifact auditable.',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Authors & citation')).not.toBeInTheDocument();
    expect(screen.getAllByText('Doubao Seed 2.0 Pro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Claude Sonnet 5').length).toBeGreaterThan(0);
    expect(
      screen.getByAltText(/Stacked task contributions to Overall/i),
    ).toHaveAttribute('src', expect.stringContaining('leaderboard.svg'));
    expect(screen.queryByText('Task profile')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /to comparison/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Comparison set')).not.toBeInTheDocument();
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
    const poseDetails = screen.getByText('camera_pose.json').closest('details');
    expect(poseDetails).toBeInTheDocument();
    expect(poseDetails).not.toHaveAttribute('open');
    fireEvent.click(within(poseDetails!).getByText('View JSON'));
    expect(poseDetails).toHaveAttribute('open');
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

  it('switches analysis panels and exposes the animated step curve', () => {
    render(<App />);
    const analysisTabs = screen.getByRole('tablist', { name: 'Analysis figures' });
    const tabs = within(analysisTabs).getAllByRole('tab');
    expect(tabs).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Pause auto' })).toBeInTheDocument();
    fireEvent.click(within(analysisTabs).getByRole('tab', { name: 'Step curves' }));
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /More steps help—until the agent saturates or regresses/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Animated Overall score curves from 10 to 150 agent steps' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume auto' })).toBeInTheDocument();
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
