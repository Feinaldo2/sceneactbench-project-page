import type { MetricDefinition } from './types';

export const metrics: MetricDefinition[] = [
  {
    id: 'ADD-S',
    name: 'Symmetry-aware average distance',
    task: 'layout',
    direction: 'lower',
    summary: 'Measures object-placement error while respecting symmetric geometry.',
    detail:
      'For every transformed model point, ADD-S uses the nearest compatible point under the reference placement. It avoids penalizing visually equivalent rotations of symmetric assets.',
    primary: true,
  },
  {
    id: 'PE',
    name: 'Position Error',
    task: 'camera',
    direction: 'lower',
    summary: 'Euclidean displacement between predicted and reference camera positions.',
    detail:
      'PE isolates translational camera error. It is reported with AE because matching position alone does not guarantee the target framing.',
    primary: true,
  },
  {
    id: 'AE',
    name: 'Angular Error',
    task: 'camera',
    direction: 'lower',
    unit: 'degrees',
    summary: 'Angular difference between predicted and reference viewing directions.',
    detail:
      'AE compares the two optical-axis directions and does not penalize roll. Camera outputs remain JSON poses plus verification images; they are not treated as mesh outputs.',
    primary: true,
  },
  {
    id: 'MPE',
    name: 'Maximum Part Error',
    task: 'articulated',
    direction: 'lower',
    summary: 'The largest part-level state error in an articulated result.',
    detail:
      'MPE is the largest opening-aligned geometry error or unreproduced motion range across all ground-truth movable parts. It is reported directly in metres.',
    primary: true,
  },
  {
    id: 'F@5%',
    name: 'Object F-score at 5%',
    task: 'reconstruction',
    direction: 'higher',
    summary: 'Mean per-object harmonic score of surface precision and recall at the 5% threshold.',
    detail:
      'F@5% jointly rewards reconstructed points that lie near the reference surface and reference points covered by the reconstruction. Higher is better.',
    primary: true,
  },
  {
    id: 'MME',
    name: 'Maximum Mover Error',
    task: 'dynamic',
    direction: 'lower',
    summary: 'The maximum normalized trajectory error across ground-truth movers.',
    detail:
      'MME takes the maximum of each mover’s mean centroid-track error after scene-scale normalization. Unmatched ground-truth movers receive an error of 1; extra predicted movers do not enter MME.',
    primary: true,
  },
  {
    id: 'AME',
    name: 'Average Mover Error',
    task: 'dynamic',
    direction: 'diagnostic',
    summary: 'Average normalized trajectory error across ground-truth movers.',
    detail:
      'AME averages the same per-mover errors used by MME, including 1.0 penalties for unmatched movers. It is diagnostic and does not enter Overall.',
  },
  {
    id: 'LE',
    name: 'Layout Error',
    task: 'dynamic',
    direction: 'lower',
    summary: 'Normalized bidirectional static-layout centroid error.',
    detail:
      'LE sums the two directed mean nearest-neighbour distances between predicted and ground-truth static-object centroids, then divides by twice the scene scale. Dynamic task score averages separately normalized MME and LE components.',
    primary: true,
  },
  {
    id: 'Overall',
    name: 'Fixed normalized summary',
    task: 'summary',
    direction: 'higher',
    summary: 'A frozen aggregation of normalized components from all five tasks.',
    detail:
      'Overall averages the five task scores after scene-wise normalization and within-task averaging. It is intended for compact comparison, not as a statistical significance claim.',
    primary: true,
  },
];
