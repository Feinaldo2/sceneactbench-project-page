export const taskIds = [
  'layout',
  'camera',
  'articulated',
  'reconstruction',
  'dynamic',
] as const;

export type TaskId = (typeof taskIds)[number];
export type ScoreKey = 'overall' | TaskId;

export type TaskColor = {
  solid: string;
  soft: string;
};

export type TaskDefinition = {
  id: TaskId;
  name: string;
  index: string;
  eyebrow: string;
  capability: string;
  description: string;
  input: string;
  output: string;
  budget: string;
  caseCount: number | null;
  primaryMetric: string;
  secondaryMetrics: string[];
  direction: 'higher' | 'lower';
  color: TaskColor;
};

export type MetricDefinition = {
  id: string;
  name: string;
  task: TaskId | 'summary';
  direction: 'higher' | 'lower' | 'diagnostic';
  unit?: string;
  summary: string;
  detail: string;
  primary?: boolean;
};

export type LeaderboardScores = Record<ScoreKey, number | null>;

export type LeaderboardEntry = {
  id: string;
  model: string;
  organization: string;
  configuration: string;
  scores: LeaderboardScores;
};

export type MediaAsset = {
  src: string;
  alt: string;
  poster?: string;
};

export type NativeMetricValue = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  direction?: 'higher' | 'lower' | 'diagnostic';
};

export type BaseExample = {
  id: string;
  task: TaskId;
  modelId: string;
  title: string;
  sourceInstance: string;
  prompt?: string;
  metrics: NativeMetricValue[];
  referenceImages: MediaAsset[];
  outputImages: MediaAsset[];
  notes?: string;
};

export type SceneExample = BaseExample & {
  task: 'layout' | 'reconstruction';
  outputGlb?: MediaAsset;
};

export type CameraExample = BaseExample & {
  task: 'camera';
  poseJson?: string;
};

export type ArticulatedExample = BaseExample & {
  task: 'articulated';
  animatedGlb?: MediaAsset;
  hasAnimation: boolean;
  keyframes: MediaAsset[];
};

export type DynamicExample = BaseExample & {
  task: 'dynamic';
  animatedGlb?: MediaAsset;
  hasAnimation: boolean;
  lowPolyPreviews: MediaAsset[];
  photorealisticPreviews: MediaAsset[];
};

export type BenchmarkExample =
  | SceneExample
  | CameraExample
  | ArticulatedExample
  | DynamicExample;

export type ExamplesManifest = {
  schemaVersion: 1;
  generatedAt: string | null;
  assetBase: string;
  examples: BenchmarkExample[];
};
