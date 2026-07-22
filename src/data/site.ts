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

export const analysisItems = [
  {
    id: 'ranking',
    kicker: '01 · Result structure',
    tab: 'Ranking',
    accent: '#245fa8',
    title: 'Ranking decomposition',
    headline: 'Overall rankings hide sharply different task profiles.',
    description:
      'Doubao’s 1.34-point lead over Claude Opus comes almost entirely from Dynamic: that task contributes +1.49 points, while the other four tasks sum to −0.15. Overall therefore reflects the magnitude and concentration of task deficits, not simply the number of task wins.',
    kind: 'stacked' as const,
    image: withBase('assets/analysis/ranking-decomposition.svg'),
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
      'Multi-view Layout improves nine of eleven configurations, but Step and MiMo decline. Photo-realistic Dynamic is more mixed: four configurations improve, six decline, and Claude Opus is unchanged at one-decimal precision. Richer visual input is therefore configuration- and condition-dependent.',
    kind: 'sensitivity' as const,
    image: withBase('assets/analysis/input-sensitivity.svg'),
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
      'Similar primary scores conceal different mechanisms. Doubao moves only 13 of 391 articulated parts, while Claude Opus moves 255; the three leading reconstruction runs match 425–432 of 515 targets but cover only 24–44. Stage-aware diagnostics separate frozen outputs, wrong actions, incomplete surfaces, and direction failures.',
    kind: 'stages' as const,
    image: withBase('assets/analysis/failure-stages.svg'),
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
      'Task-balanced interaction volume does not positively track Overall across the evaluated configurations (Spearman ρ = −0.68). Claude Opus uses 82.9% of its available budget, while top-ranked Doubao uses 34.3%; these values describe different interaction regimes rather than a causal effect of more steps.',
    kind: 'budget' as const,
    image: withBase('assets/analysis/effective-budget.svg'),
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
      'Across 10–150 step checkpoints, Overall rises by 12.0–27.7 points. Camera has the largest mean gain at 51.3 points, Articulated changes little, and the model ordering changes with budget. The animated curves replay the same frozen checkpoints used in the appendix.',
    kind: 'curves' as const,
    image: withBase('assets/analysis/step-curves.svg'),
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
      'Aggregate step and tool-call counts do not reveal how an agent spends its budget. These scored episodes expose input reads, code edits, render checks, tool errors, and stopping events. They are illustrative process records rather than estimates of how often each behavior occurs.',
    kind: 'trace' as const,
    image: withBase('assets/analysis/agent-traces.svg'),
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
