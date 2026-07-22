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
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    expect(within(navigation).queryByRole('link', { name: 'Resources' })).not.toBeInTheDocument();
    for (const title of [
      'Abstract',
      'Leaderboard',
      'Examples',
      'Benchmark',
      'Tasks',
      'Citation',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(screen.queryByRole('heading', { level: 2, name: 'Analysis' })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Analysis' })).not.toBeInTheDocument();
    for (const redundantLabel of [
      'Paper overview',
      'Metrics glossary',
      '01 · Result structure',
      'Why action',
    ]) {
      expect(screen.queryByText(redundantLabel)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/^↓ lower$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^higher is better$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^lower is better$/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Vision-language model \(VLM\) agents increasingly use tools/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Can an agent that sees a scene act on a 3D environment to match it?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: 'Close Overall scores conceal different capabilities.',
      }),
    ).not.toBeInTheDocument();
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
    expect(screen.getByText('Symmetry-aware average distance')).toBeInTheDocument();
    expect(screen.queryByText('Maximum Part Error')).not.toBeInTheDocument();

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

  it('opens task metrics in a floating dialog', () => {
    render(<App />);

    expect(screen.queryByRole('heading', { level: 2, name: 'Metrics' })).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open Symmetry-aware average distance metric details',
      }),
    );
    const layoutDialog = screen.getByRole('dialog', {
      name: 'Symmetry-aware average distance',
    });
    expect(layoutDialog).toBeInTheDocument();
    expect(
      within(layoutDialog).getByText(/nearest compatible point under the reference placement/i),
    ).toBeInTheDocument();
    expect(document.querySelector('.task-panel')).not.toContainElement(layoutDialog);
    fireEvent.click(within(layoutDialog).getByRole('button', { name: 'Close metric details' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const taskTabs = screen.getByRole('tablist', { name: 'SceneActBench tasks' });
    fireEvent.click(within(taskTabs).getByRole('tab', { name: /Dynamic Move/i }));
    expect(
      screen.getByRole('button', { name: 'Open Maximum Mover Error metric details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Average Mover Error metric details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Layout Error metric details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Fixed normalized summary metric details' }),
    ).toBeInTheDocument();
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
