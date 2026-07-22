import { withBase } from './assetPath';

export const links = {
  paper: withBase('sceneactbench.pdf'),
  code: 'https://github.com/harnessRL/3D_Bench',
  dataset: 'https://huggingface.co/datasets/harnessRL/3D_Bench_Datasets',
};

export const authors = [
  { name: 'Yifei Zhao', affiliations: [1, 2], equal: true },
  { name: 'Xiangxin Zhou', affiliations: [1], equal: true, corresponding: true },
  { name: 'Wenhao Yang', affiliations: [1, 3], equal: true },
  { name: 'Jiaqi Tang', affiliations: [1, 4], equal: true },
  { name: 'Pu Jian', affiliations: [1], equal: true },
  { name: 'Huanjin Yao', affiliations: [1, 4], equal: true },
  { name: 'Jiarui Yao', affiliations: [1, 5], equal: true },
  { name: 'Haowei Lin', affiliations: [1, 6] },
  { name: 'Zhuo Chen', affiliations: [1] },
  { name: 'Wenkai Lyu', affiliations: [1] },
  { name: 'Jianzhu Ma', affiliations: [2] },
  { name: 'Xueqian Wang', affiliations: [2] },
  { name: 'Wenxi Zhu', affiliations: [1] },
  { name: 'Tianyu Pang', affiliations: [1], corresponding: true },
] as const;

export const affiliations = [
  { id: 1, name: 'Tencent Hunyuan' },
  { id: 2, name: 'Tsinghua University (THU)' },
  { id: 3, name: 'Nanjing University (NJU)' },
  { id: 4, name: 'Hong Kong University of Science and Technology (HKUST)' },
  { id: 5, name: 'University of Illinois Urbana-Champaign (UIUC)' },
  { id: 6, name: 'Peking University (PKU)' },
] as const;

export const contributions = [
  {
    number: '01',
    title: 'From seeing to doing',
    text: 'Five executable tasks turn visual evidence into layouts, cameras, geometry, and motion.',
  },
  {
    number: '02',
    title: 'Native metrics',
    text: 'Task-native metrics expose geometric and temporal errors directly.',
  },
  {
    number: '03',
    title: 'Diagnosable traces',
    text: 'Action traces reveal where agents recover, repeat, or stop early.',
  },
] as const;

export const analysisItems = [
  {
    id: 'ranking',
    kicker: '01 · Result structure',
    tab: 'Ranking',
    accent: '#245fa8',
    title: 'Ranking decomposition',
    headline: 'Overall rankings hide sharply different task profiles.',
    description:
      'The same aggregate score can come from very different strengths. Decomposing Overall shows which tasks create each model’s advantage—and where that advantage disappears.',
    kind: 'stacked' as const,
    image: withBase('assets/paper/top3_analysis.webp'),
    width: 841,
    height: 341,
    alt: 'Task contributions to the Overall score gaps among the top configurations.',
  },
  {
    id: 'sensitivity',
    kicker: '02 · Observation',
    tab: 'Inputs',
    accent: '#4a72b8',
    title: 'Input sensitivity',
    headline: 'More visual evidence does not help every agent equally.',
    description:
      'Multi-view evidence and photo-realistic inputs change models in different directions. The benchmark therefore reports paired conditions rather than assuming richer input is always easier.',
    kind: 'sensitivity' as const,
    image: withBase('assets/paper/input_conditions.webp'),
    width: 748,
    height: 418,
    alt: 'Input-condition sensitivity across model configurations.',
  },
  {
    id: 'failures',
    kicker: '03 · Diagnosis',
    tab: 'Failures',
    accent: '#2f82b7',
    title: 'Failure stages',
    headline: 'Failures emerge at different stages of the action pipeline.',
    description:
      'Stage-aware diagnostics separate target selection, geometry, coverage, and motion errors, making similar endpoint scores technically distinguishable.',
    kind: 'stages' as const,
    image: withBase('assets/paper/failure_stages.webp'),
    width: 866,
    height: 502,
    alt: 'Denominator-aware failure stages for leading configurations.',
  },
  {
    id: 'budget',
    kicker: '04 · Efficiency',
    tab: 'Budget',
    accent: '#5b79c9',
    title: 'Effective budget',
    headline: 'Allocated steps and useful steps are not the same.',
    description:
      'Agents often stop early, repeat actions, or spend calls without improving the artifact. Effective budget exposes how much of the available interaction window becomes useful work.',
    kind: 'budget' as const,
    image: withBase('assets/paper/effective_budget.webp'),
    width: 830,
    height: 405,
    alt: 'Effective interaction budget and realized tool calls.',
  },
  {
    id: 'steps',
    kicker: '05 · Scaling',
    tab: 'Step curves',
    accent: '#6d67c5',
    title: 'Step curves',
    headline: 'More steps help—until the agent saturates or regresses.',
    description:
      'The animated Overall curves replay the exact frozen checkpoints from 10 to 150 agent steps. They reveal fast gains, plateaus, and late-stage instability that endpoint tables conceal.',
    kind: 'curves' as const,
    image: withBase('assets/paper/step_curve.webp'),
    width: 839,
    height: 714,
    alt: 'Step-budget sensitivity curves across Overall and five tasks.',
  },
  {
    id: 'traces',
    kicker: '06 · Behavior',
    tab: 'Traces',
    accent: '#3e65a5',
    title: 'Representative traces',
    headline: 'The same score can come from very different behavior.',
    description:
      'Representative traces expose recovery, repetition, verification, and premature stopping, linking final artifacts back to the actions that produced them.',
    kind: 'trace' as const,
    image: withBase('assets/paper/agent_traces.webp'),
    width: 880,
    height: 911,
    alt: 'Representative agent-completion traces for three episodes.',
  },
] as const;

export const bibtex = `@misc{sceneactbench2026,
  title  = {SceneActBench: Can Agents Act on the 3D Scenes They See?},
  author = {Zhao, Yifei and Zhou, Xiangxin and Yang, Wenhao and Tang, Jiaqi and Jian, Pu and Yao, Huanjin and Yao, Jiarui and Lin, Haowei and Chen, Zhuo and Lyu, Wenkai and Ma, Jianzhu and Wang, Xueqian and Zhu, Wenxi and Pang, Tianyu},
  year   = {2026},
  note   = {Preprint},
  url    = {https://feinaldo2.github.io/sceneactbench-project-page/}
}`;
