import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    ).toHaveAttribute('src', expect.stringContaining('hunyuan-logo.png'));
    const hero = document.querySelector<HTMLElement>('.hero');
    expect(hero).toBeInTheDocument();
    expect(within(hero!).queryByAltText('Tencent Hunyuan')).not.toBeInTheDocument();
    const authorLine = within(hero!).getByLabelText('Authors');
    expect(authorLine.querySelectorAll('sup')).toHaveLength(14);
    const authorBreak = authorLine.querySelector('.author-row-break');
    expect(authorBreak?.nextElementSibling).toHaveTextContent('Haowei Lin');
    const affiliationLine = hero!.querySelector('.affiliation-line');
    expect(affiliationLine).toHaveTextContent('Tencent Hunyuan');
    expect(affiliationLine).toHaveTextContent('THU');
    expect(affiliationLine).toHaveTextContent('NJU');
    expect(affiliationLine).toHaveTextContent('HKUST');
    expect(affiliationLine).toHaveTextContent('UIUC');
    expect(affiliationLine).toHaveTextContent('PKU');
    const contributionLine = hero!.querySelector('.contribution-line');
    expect(contributionLine).toHaveTextContent('* Equal contribution');
    expect(contributionLine).toHaveTextContent('† Corresponding author');
    expect(within(hero!).queryByRole('link', { name: 'Leaderboard ↓' })).not.toBeInTheDocument();
    expect(within(hero!).queryByRole('link', { name: 'Explore examples ↓' })).not.toBeInTheDocument();
    expect(screen.queryByText('Scene intelligence, made executable')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/A unified benchmark that asks multimodal agents/i),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: /Dataset/i }),
    ).toHaveAttribute('href', links.dataset);
    expect(screen.queryByLabelText('Benchmark statistics')).not.toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Page sections' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(4);
    expect(within(navigation).queryByRole('link', { name: 'Resources' })).not.toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: 'Results' })).toHaveAttribute(
      'href',
      '#leaderboard',
    );
    expect(within(navigation).queryByRole('link', { name: 'Protocol' })).not.toBeInTheDocument();
    for (const title of [
      'Results',
      'Demos',
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
    expect(screen.queryByRole('heading', { level: 2, name: 'Abstract' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'Can an agent that sees a scene act on a 3D environment to match it?',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: 'Close Overall scores conceal different capabilities.',
      }),
    ).not.toBeInTheDocument();
    for (const stage of ['Observe', 'Act', 'Evaluate']) {
      expect(screen.queryByRole('heading', { level: 3, name: stage })).not.toBeInTheDocument();
    }
    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: 'One fixed loop makes every final artifact auditable.',
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Authors & citation')).not.toBeInTheDocument();
    const configuration = screen.getByRole('combobox', { name: /^Configuration$/i });
    expect(
      within(configuration).getByRole('option', { name: /Doubao Seed 2\.0 Pro · High/i }),
    ).toBeInTheDocument();
    expect(
      within(configuration).getByRole('option', { name: /Claude Sonnet 5 · High/i }),
    ).toBeInTheDocument();
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
    expect(
      within(screen.getByRole('group', { name: 'Choose explorer task' })).getAllByRole('button'),
    ).toHaveLength(5);

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

  it('uses a distinct interaction for each of the five demos', async () => {
    const media = (src: string) => ({ src, alt: src });
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
              id: 'layout-demo',
              task: 'layout',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Layout demo',
              sourceInstance: 'layout-room',
              metrics: [],
              referenceImages: [media('/layout-input.png')],
              outputImages: [],
              referenceGlb: media('/layout-reference.glb'),
              outputGlb: media('/layout-output.glb'),
            },
            {
              id: 'camera-demo',
              task: 'camera',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Camera demo',
              sourceInstance: 'camera-room',
              metrics: [
                {
                  id: 'AE',
                  label: 'Angular Error',
                  value: 155.4,
                  unit: '°',
                  direction: 'lower',
                },
              ],
              referenceImages: [media('/camera-reference.png')],
              outputImages: [media('/camera-prediction.png')],
              poseJson: '{"position":[0,0,0]}',
              notes: 'The predicted camera faces away from the furnished scene.',
            },
            {
              id: 'articulated-demo',
              task: 'articulated',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Articulated demo',
              sourceInstance: 'cabinet',
              metrics: [],
              referenceImages: [media('/articulated-frame.png')],
              outputImages: [],
              referenceVideos: [media('/articulated-input.mp4')],
              referenceGlb: media('/articulated-reference.glb'),
              referenceGlbAnimated: true,
              animatedGlb: media('/articulated-output.glb'),
              hasAnimation: true,
              keyframes: [],
            },
            {
              id: 'reconstruction-demo',
              task: 'reconstruction',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Reconstruction demo',
              sourceInstance: 'reconstruction-room',
              metrics: [],
              referenceImages: [
                media('/reconstruction-view-1.png'),
                media('/reconstruction-view-2.png'),
              ],
              outputImages: [],
              referenceGlb: media('/reconstruction-reference.glb'),
              outputGlb: media('/reconstruction-output.glb'),
            },
            {
              id: 'dynamic-demo',
              task: 'dynamic',
              modelId: 'doubao-seed-2-pro-high',
              title: 'Dynamic demo',
              sourceInstance: 'dynamic-scene',
              metrics: [],
              referenceImages: [
                media('/dynamic-low.png'),
                media('/dynamic-photo.png'),
              ],
              outputImages: [],
              referenceVideos: [
                media('/dynamic-low.mp4'),
                media('/dynamic-photo.mp4'),
              ],
              referenceGlb: media('/dynamic-reference.glb'),
              referenceGlbAnimated: true,
              animatedGlb: media('/dynamic-low.glb'),
              hasAnimation: true,
              pairedAnimatedGlb: media('/dynamic-photo.glb'),
              pairedHasAnimation: true,
              lowPolyPreviews: [],
              photorealisticPreviews: [],
            },
          ],
        }),
      }),
    );
    render(<App />);

    const demos = screen.getByRole('group', { name: 'Choose explorer task' });
    expect(await within(demos).findByText('layout-room')).toBeInTheDocument();
    expect(screen.getByText('Spatial comparison')).toBeInTheDocument();
    expect(screen.queryByText('Reference evidence')).not.toBeInTheDocument();
    expect(screen.queryByText('Native evaluation')).not.toBeInTheDocument();

    fireEvent.click(within(demos).getByRole('button', { name: 'Camera' }));
    const cameraSwitch = screen.getByRole('group', { name: 'Choose camera view' });
    fireEvent.click(within(cameraSwitch).getByRole('button', { name: 'Prediction' }));
    expect(screen.getByText('Predicted view')).toBeInTheDocument();
    expect(screen.getByText('Rendered output — not a loading state')).toBeInTheDocument();
    expect(screen.getByText('AE 155.4°')).toBeInTheDocument();

    fireEvent.click(within(demos).getByRole('button', { name: 'Articulated' }));
    expect(screen.getByText('Motion playback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play both' })).toBeInTheDocument();

    fireEvent.click(within(demos).getByRole('button', { name: 'Reconstruction' }));
    fireEvent.click(screen.getByRole('button', { name: 'Input view 2' }));
    expect(screen.getByText('Calibrated input 2')).toBeInTheDocument();

    fireEvent.click(within(demos).getByRole('button', { name: 'Dynamic' }));
    const conditionSwitch = screen.getByRole('group', { name: 'Choose dynamic input condition' });
    fireEvent.click(within(conditionSwitch).getByRole('button', { name: 'Photo-real' }));
    expect(screen.getByRole('heading', { level: 4, name: 'Photo-real result' })).toBeInTheDocument();
  });

  it('opens media focus mode and changes the selected configuration', async () => {
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

    expect(await screen.findByText('shared-room')).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open agent-visible room in focus mode' })[0],
    );
    const focusDialog = screen.getByRole('dialog', { name: 'Agent-visible room' });
    expect(focusDialog).toBeInTheDocument();
    expect(within(focusDialog).getByText('1 / 1')).toBeInTheDocument();
    fireEvent.keyDown(focusDialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Agent-visible room' })).not.toBeInTheDocument();

    const configuration = screen.getByRole('combobox', { name: /^Configuration$/i });
    fireEvent.change(configuration, { target: { value: 'claude-opus-4-6-high' } });
    expect(configuration).toHaveValue(
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
    expect(screen.getByRole('link', { name: 'Demos' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.querySelector('main')).toHaveAttribute('inert');

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.getByRole('link', { name: 'Results' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
  });

  it('exposes leaderboard sort state to assistive technology', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: 'Exact scores' }));
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

    fireEvent.click(screen.getByRole('tab', { name: 'Exact scores' }));
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

  it('opens paper insights without showing the Sonnet step curve', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Paper insights/i }));
    const dialog = screen.getByRole('dialog', { name: 'Interactive research insights' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('150 steps')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Doubao/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /MiniMax/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Qwen/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /MiMo/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Kimi/i })).toBeInTheDocument();
    expect(within(dialog).queryByText(/Claude Sonnet 5/i)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('tab', { name: 'Input conditions' }));
    expect(
      within(dialog).getByAltText(/Input-condition score changes/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('9 / 11 improve')).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: 'Interactive research insights' }),
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

  it('opens task metrics in a floating dialog', async () => {
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
    const renderedFormula = layoutDialog.querySelector<HTMLElement>('.metric-formula-render');
    expect(renderedFormula).toBeInTheDocument();
    await waitFor(() => {
      expect(renderedFormula?.querySelector('.katex')).toBeInTheDocument();
    });
    expect(renderedFormula).toHaveTextContent('ADD-S');
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
