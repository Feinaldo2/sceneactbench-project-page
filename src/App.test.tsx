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
    const hero = document.querySelector<HTMLElement>('.hero');
    expect(hero).toBeInTheDocument();
    expect(within(hero!).getByRole('link', { name: 'Leaderboard ↓' })).toHaveAttribute(
      'href',
      '#leaderboard',
    );
    expect(within(hero!).getByRole('link', { name: 'Explore examples ↓' })).toHaveAttribute(
      'href',
      '#explorer',
    );
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
    expect(within(navigation).getByRole('link', { name: 'Leaderboard' })).toHaveAttribute(
      'href',
      '#leaderboard',
    );
    expect(within(navigation).getByRole('link', { name: 'Benchmark' })).toHaveAttribute(
      'href',
      '#benchmark',
    );
    expect(within(navigation).queryByRole('link', { name: 'Results' })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Protocol' })).not.toBeInTheDocument();
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
    expect(screen.getByText('3D-FRONT')).toBeInTheDocument();
    expect(screen.getByText('S2O ACD')).toBeInTheDocument();
    expect(screen.getByText('Kenney')).toBeInTheDocument();

    expect(await screen.findByText(/Schema v1/)).toBeInTheDocument();
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

  it('selects a different published example at random', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: 1,
          generatedAt: null,
          assetBase: '/assets/examples/',
          examples: [
            {
              id: 'random-layout',
              task: 'layout',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Random layout example',
              sourceInstance: 'layout-source',
              metrics: [],
              referenceImages: [],
              outputImages: [],
            },
            {
              id: 'random-camera',
              task: 'camera',
              modelId: 'claude-opus-4-6-high',
              title: 'Random camera example',
              sourceInstance: 'camera-source',
              metrics: [],
              referenceImages: [],
              outputImages: [],
            },
          ],
        }),
      }),
    );
    render(<App />);

    expect(await screen.findByText('Random layout example')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Random example' }));
    expect(await screen.findByText('Random camera example')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Camera' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox', { name: /Choose configuration/i })).toHaveValue(
      'claude-opus-4-6-high',
    );
  });

  it('opens media focus mode and advances to the same scene from another model', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: 1,
          generatedAt: null,
          assetBase: '/assets/examples/',
          examples: [
            {
              id: 'same-scene-a',
              task: 'layout',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Same scene · Doubao',
              sourceInstance: 'shared-room',
              metrics: [],
              referenceImages: [
                { src: 'assets/examples/ref-a.png', alt: 'First shared view' },
                { src: 'assets/examples/ref-b.png', alt: 'Second shared view' },
              ],
              outputImages: [],
            },
            {
              id: 'same-scene-b',
              task: 'layout',
              modelId: 'claude-opus-4-6-high',
              title: 'Same scene · Claude',
              sourceInstance: 'shared-room',
              metrics: [],
              referenceImages: [
                { src: 'assets/examples/ref-a.png', alt: 'First shared view' },
                { src: 'assets/examples/ref-b.png', alt: 'Second shared view' },
              ],
              outputImages: [],
            },
          ],
        }),
      }),
    );
    render(<App />);

    expect(await screen.findByText('Same scene · Doubao')).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open input reference in focus mode' })[0],
    );
    const focusDialog = screen.getByRole('dialog', { name: 'Input reference' });
    expect(focusDialog).toBeInTheDocument();
    expect(within(focusDialog).getByText('1 / 2')).toBeInTheDocument();
    fireEvent.keyDown(focusDialog, { key: 'ArrowRight' });
    expect(within(focusDialog).getByText('2 / 2')).toBeInTheDocument();
    fireEvent.keyDown(focusDialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Input reference' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next model · same scene' }));
    expect(await screen.findByText('Same scene · Claude')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Choose configuration/i })).toHaveValue(
      'claude-opus-4-6-high',
    );
  });

  it('manages focus and scrolling in the mobile navigation', () => {
    render(<App />);

    const menuButton = screen.getByRole('button', { name: 'Open navigation' });
    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Abstract' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.querySelector('main')).toHaveAttribute('inert');

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
  });

  it('exposes leaderboard sort state to assistive technology', () => {
    render(<App />);

    const table = screen.getByRole('table', {
      name: 'SceneActBench model configurations and task scores',
    });
    const overallHeader = within(table).getByRole('columnheader', { name: /Overall/i });
    const layoutHeader = within(table).getByRole('columnheader', { name: /Layout/i });
    expect(overallHeader).toHaveAttribute('aria-sort', 'descending');
    expect(layoutHeader).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(within(table).getByRole('button', { name: 'Sort by Layout' }));
    expect(layoutHeader).toHaveAttribute('aria-sort', 'descending');
    expect(overallHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('opens floating leaderboard evaluation notes', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Evaluation notes' }));
    const dialog = screen.getByRole('dialog', { name: 'How to read the leaderboard' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/one completed run/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/targeted stress test/i)).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: 'How to read the leaderboard' }),
    ).not.toBeInTheDocument();
  });

  it('inspects exact scores from the interactive leaderboard chart', () => {
    render(<App />);

    const chart = screen
      .getByAltText(/Stacked task contributions to Overall/i)
      .closest('figure');
    expect(chart).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'MiniMax M3' })).not.toBeInTheDocument();

    fireEvent.click(
      within(chart!).getByRole('button', {
        name: 'Show MiniMax M3 High task scores',
      }),
    );
    const scoreDialog = screen.getByRole('dialog', { name: 'MiniMax M3' });
    expect(scoreDialog).toBeInTheDocument();
    const overallOrbit = scoreDialog.querySelector<HTMLElement>('.score-overall-orbit');
    expect(overallOrbit).toBeInTheDocument();
    expect(within(overallOrbit!).getByText('Overall')).toBeInTheDocument();
    expect(within(overallOrbit!).getByText('38.6')).toBeInTheDocument();
    expect(within(scoreDialog).getByText('58.1')).toBeInTheDocument();
    expect(within(scoreDialog).getByText('25.6')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(scoreDialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'MiniMax M3' })).not.toBeInTheDocument();
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
    expect(
      within(layoutDialog).getByRole('heading', { level: 4, name: 'Calculation' }),
    ).toBeInTheDocument();
    expect(within(layoutDialog).getByText(/ADD-S =/i)).toBeInTheDocument();
    expect(document.querySelector('.task-panel')).not.toContainElement(layoutDialog);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(layoutDialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');

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
