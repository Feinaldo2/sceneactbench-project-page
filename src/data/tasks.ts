import type { TaskDefinition } from './types';

export const tasks: TaskDefinition[] = [
  {
    id: 'layout',
    name: 'Layout',
    index: '01',
    eyebrow: 'Arrange',
    capability: 'Translate visual spatial intent into an executable 3D arrangement.',
    description:
      'The agent maps calibrated room views into the metric position and yaw of every supplied object, then verifies the arrangement through rendering. Paired single- and multi-view conditions share the same targets.',
    input: '1 or ~11 calibrated PNG views; canonical GLBs at the origin',
    output: 'Object poses in a furnished-scene GLB',
    budget: '30 agent steps',
    caseCount: 100,
    primaryMetric: 'ADD-S',
    secondaryMetrics: [],
    direction: 'lower',
    color: { solid: '#2f6bb2', soft: '#dcecf8' },
  },
  {
    id: 'camera',
    name: 'Camera',
    index: '02',
    eyebrow: 'Frame',
    capability: 'Recover a camera that reproduces the target composition.',
    description:
      'The scene is already arranged. The agent infers hidden camera extrinsics from one reference view and a known field of view, then verifies the pose by rendering.',
    input: '1 PNG view, known FOV, and a fixed furnished scene',
    output: '6-DoF camera pose in JSON',
    budget: '30 agent steps',
    caseCount: 100,
    primaryMetric: 'PE / AE',
    secondaryMetrics: [],
    direction: 'lower',
    color: { solid: '#6c76bf', soft: '#e8e8f7' },
  },
  {
    id: 'articulated',
    name: 'Articulated',
    index: '03',
    eyebrow: 'Open',
    capability: 'Identify movable parts and place each part in the requested state.',
    description:
      'The agent discovers movable meshes and joint parameters from an ordered open–close reference, then reproduces the motion as whole-scene states.',
    input: '32 ordered frames and one closed, unlabelled GLB',
    output: '32 GLB scene states',
    budget: '60 agent steps',
    caseCount: 100,
    primaryMetric: 'MPE',
    secondaryMetrics: [],
    direction: 'lower',
    color: { solid: '#1f9c91', soft: '#d9f2ee' },
  },
  {
    id: 'reconstruction',
    name: 'Reconstruction',
    index: '04',
    eyebrow: 'Rebuild',
    capability: 'Recover measurable 3D geometry from visual evidence.',
    description:
      'Agents must produce usable geometry rather than a convincing single render. Evaluation rewards surface coverage and precision at a normalized distance threshold.',
    input: '~11 calibrated PNG views and an empty Blender scene',
    output: 'Furnished-scene GLB',
    budget: '35 agent steps',
    caseCount: 100,
    primaryMetric: 'F@5%',
    secondaryMetrics: [],
    direction: 'higher',
    color: { solid: '#d7903d', soft: '#faead5' },
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    index: '05',
    eyebrow: 'Move',
    capability: 'Infer and author coherent scene layout and motion through time.',
    description:
      'The agent rebuilds a multi-object scene and keyframes every trajectory. Evaluation jointly measures mover trajectories and static layout; paired low-poly and photo-realistic inputs share the same targets.',
    input: 'Sampled 144-frame video, known camera, and component GLB library',
    output: 'Animated GLB with rendered temporal previews',
    budget: '80 agent steps',
    caseCount: 10,
    primaryMetric: 'MME / LE',
    secondaryMetrics: ['AME'],
    direction: 'lower',
    color: { solid: '#d25f53', soft: '#f8dfdc' },
  },
];

export const taskById = Object.fromEntries(tasks.map((task) => [task.id, task])) as Record<
  TaskDefinition['id'],
  TaskDefinition
>;
