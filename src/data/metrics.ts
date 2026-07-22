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
    formula:
      'dₛᵤᵣ𝒻(V̂ᵢ,Vⱼ) = (1/|V̂ᵢ|) Σᵥ̂∈V̂ᵢ minᵥ∈Vⱼ ‖v̂−v‖₂\nADD-S = (1/|M|) Σ₍ᵢ,ⱼ₎∈M dₛᵤᵣ𝒻(V̂ᵢ,Vⱼ)',
    calculation:
      'Transform each predicted and reference mesh into world space, compute every pairwise directed surface distance, use Hungarian assignment to obtain the matched set M, then average the matched costs.',
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
    formula: 'PE = ‖ĉ − c‖₂',
    calculation:
      'Read the final active camera centre ĉ and compare it with the hidden reference centre c using Euclidean distance in metres.',
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
    formula: 'AE = (180°/π) arccos(d̂ᵀd)',
    calculation:
      'Extract the predicted and reference unit viewing directions from the negative local Z axes, take their dot product, and convert the arccosine from radians to degrees. Roll is excluded.',
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
    formula: 'MPE = maxᵢ∈Pₘₒᵥ { εᵢ, (1−κᵢ)gᵢ }',
    calculation:
      'Align predicted and reference states by opening degree. For each movable part, compare its largest aligned geometry error εᵢ with the incomplete-motion penalty (1−κᵢ)gᵢ, then take the maximum over parts.',
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
    formula:
      'τⱼ = 0.05δⱼ\nF@5% = (1/N) Σⱼ 2 Precⱼ Recⱼ / (Precⱼ + Recⱼ)',
    calculation:
      'After fixed-scale ICP, clustering, and Hungarian matching, compute point precision and recall for each object within 5% of its reference bounding-box diagonal. Unmatched or zero-denominator objects contribute zero.',
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
    formula:
      'eᵢ = (1/(mᵢS)) Σᵣ₌₁ᵐⁱ ‖p̂σ₍ᵢ₎ʳ − pᵢʳ‖₂\nMME = max₁≤ᵢ≤Nₘₒᵥ eᵢ',
    calculation:
      'Match predicted and reference mover tracks after one global translation correction. Average each matched centroid-track error over shared frames, normalize by scene scale S, assign 1 to unmatched reference movers, then take the maximum.',
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
    formula: 'AME = (1/Nₘₒᵥ) Σᵢ₌₁ᴺᵐᵒᵛ eᵢ',
    calculation:
      'Use the same scene-normalized per-mover errors eᵢ as MME, including 1.0 penalties for unmatched reference movers, and take their arithmetic mean.',
  },
  {
    id: 'LE',
    name: 'Layout Error',
    task: 'dynamic',
    direction: 'lower',
    summary: 'Normalized bidirectional static-layout centroid error.',
    detail:
      'LE sums the two directed mean nearest-neighbour distances between predicted and ground-truth static-object centroids, then divides by twice the scene scale. Dynamic task score averages separately normalized MME and LE components.',
    formula:
      'dₛₜₐₜ = meanₓ̂ minₓ ‖x̂−x‖₂ + meanₓ minₓ̂ ‖x−x̂‖₂\nLE = dₛₜₐₜ / (2S)',
    calculation:
      'After applying the shared translation correction, compute nearest-neighbour centroid distance in both directions between predicted and reference static objects, sum the two means, and normalize by twice the scene scale.',
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
    formula:
      'q↓(m;u) = 100 max(0, 1−m/u)\nq↑(m;u) = 100 min(1, m/u)\nOverall = (1/5) Σₜ TaskScoreₜ',
    calculation:
      'Convert native scene metrics with fixed references (4 m for ADD-S and PE, 90° for AE, 1 m for MPE, and 1 for F@5%, MME, and LE). Camera averages its PE and AE scores, Dynamic averages MME and LE, and Overall averages the five task scores.',
    primary: true,
  },
];
