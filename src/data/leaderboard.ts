import type { LeaderboardEntry, ScoreKey } from './types';

export const leaderboard: LeaderboardEntry[] = [
  {
    id: 'doubao-seed-2-pro-high',
    model: 'Doubao Seed 2.0 Pro',
    organization: 'ByteDance',
    configuration: 'High',
    scores: {
      overall: 50.2,
      layout: 77.4,
      camera: 34.5,
      articulated: 59.6,
      reconstruction: 8.8,
      dynamic: 70.7,
    },
  },
  {
    id: 'claude-opus-4-6-high',
    model: 'Claude Opus 4.6',
    organization: 'Anthropic',
    configuration: 'High',
    scores: {
      overall: 48.9,
      layout: 73.5,
      camera: 34.0,
      articulated: 63.7,
      reconstruction: 9.8,
      dynamic: 63.2,
    },
  },
  {
    id: 'gpt-5-4-medium',
    model: 'GPT 5.4',
    organization: 'OpenAI',
    configuration: 'Medium',
    scores: {
      overall: 48.7,
      layout: 72.7,
      camera: 29.6,
      articulated: 62.3,
      reconstruction: 10.4,
      dynamic: 68.5,
    },
  },
  {
    id: 'gpt-5-4-high',
    model: 'GPT 5.4',
    organization: 'OpenAI',
    configuration: 'High',
    scores: {
      overall: 48.7,
      layout: 84.1,
      camera: 26.4,
      articulated: 73.8,
      reconstruction: 12.3,
      dynamic: 46.7,
    },
  },
  {
    id: 'qwen-3-7-plus-high',
    model: 'Qwen 3.7 Plus',
    organization: 'Alibaba',
    configuration: 'High',
    scores: {
      overall: 46.2,
      layout: 76.2,
      camera: 21.7,
      articulated: 58.0,
      reconstruction: 9.0,
      dynamic: 66.0,
    },
  },
  {
    id: 'gemini-3-1-pro-high',
    model: 'Gemini 3.1 Pro',
    organization: 'Google',
    configuration: 'High',
    scores: {
      overall: 45.4,
      layout: 65.4,
      camera: 33.9,
      articulated: 56.5,
      reconstruction: 7.1,
      dynamic: 63.9,
    },
  },
  {
    id: 'mimo-2-5-high',
    model: 'MiMo 2.5',
    organization: 'Xiaomi',
    configuration: 'High',
    scores: {
      overall: 41.4,
      layout: 79.4,
      camera: 25.0,
      articulated: 49.8,
      reconstruction: 9.1,
      dynamic: 43.7,
    },
  },
  {
    id: 'kimi-k2-6-reason',
    model: 'Kimi K2.6',
    organization: 'Moonshot AI',
    configuration: 'Reason',
    scores: {
      overall: 41.2,
      layout: 70.9,
      camera: 24.6,
      articulated: 57.3,
      reconstruction: 8.5,
      dynamic: 44.8,
    },
  },
  {
    id: 'step-3-7-flash-high',
    model: 'Step 3.7 Flash',
    organization: 'StepFun',
    configuration: 'High',
    scores: {
      overall: 41.1,
      layout: 77.5,
      camera: 13.2,
      articulated: 48.3,
      reconstruction: 8.6,
      dynamic: 57.9,
    },
  },
  {
    id: 'claude-sonnet-5-high',
    model: 'Claude Sonnet 5',
    organization: 'Anthropic',
    configuration: 'High',
    scores: {
      overall: 39.5,
      layout: 51.9,
      camera: 27.3,
      articulated: 57.8,
      reconstruction: 10.5,
      dynamic: 49.9,
    },
  },
  {
    id: 'minimax-m3-high',
    model: 'MiniMax M3',
    organization: 'MiniMax',
    configuration: 'High',
    scores: {
      overall: 38.6,
      layout: 58.1,
      camera: 25.6,
      articulated: 58.4,
      reconstruction: 9.6,
      dynamic: 41.4,
    },
  },
];

export const scoreLabels: Record<ScoreKey, string> = {
  overall: 'Overall',
  layout: 'Layout',
  camera: 'Camera',
  articulated: 'Articulated',
  reconstruction: 'Reconstruction',
  dynamic: 'Dynamic',
};

export const leaderboardProvenance = {
  status: 'published-paper-table' as const,
  source:
    'https://github.com/zhouxiangxin1998/Hunyuan-SceneActBench/blob/main/figures/main_table.tex',
  fallback:
    'https://github.com/zhouxiangxin1998/llm3dbench/blob/main/paper_figure_repro_bundle/data/experiment_snapshot.json',
  note:
    'Exact published task scores and Overall values transcribed from the current paper main table.',
};

export function compareEntries(
  left: LeaderboardEntry,
  right: LeaderboardEntry,
  key: ScoreKey,
): number {
  const leftValue = left.scores[key];
  const rightValue = right.scores[key];
  if (leftValue === null && rightValue === null) return 0;
  if (leftValue === null) return 1;
  if (rightValue === null) return -1;
  return rightValue - leftValue;
}

export function hasPublishedScores(entries = leaderboard): boolean {
  return entries.some((entry) => Object.values(entry.scores).some((score) => score !== null));
}
