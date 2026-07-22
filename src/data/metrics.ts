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
    formula: String.raw`\begin{aligned}
d_{\mathrm{surf}}(\hat V_i,V_j)
&= \frac{1}{|\hat V_i|}
\sum_{\hat{\mathbf v}\in\hat V_i}
\min_{\mathbf v\in V_j}
\left\|\hat{\mathbf v}-\mathbf v\right\|_2,\\
\mathrm{ADD\text{-}S}_{\mathrm{scene}}
&= \frac{1}{|\mathcal M|}
\sum_{(i,j)\in\mathcal M}
d_{\mathrm{surf}}(\hat V_i,V_j).
\end{aligned}`,
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
    formula: String.raw`\mathrm{PE}=\left\|\hat{\mathbf c}-\mathbf c\right\|_2`,
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
    formula: String.raw`\mathrm{AE}
=\frac{180^\circ}{\pi}
\arccos\!\left(\hat{\mathbf d}^{\mathsf T}\mathbf d\right)`,
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
    formula: String.raw`\mathrm{MPE}
=\max_{i\in\mathcal P_{\mathrm{mov}}}
\left\{\epsilon_i,\,(1-\kappa_i)g_i\right\}`,
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
    formula: String.raw`\begin{aligned}
\tau_j &= 0.05\,\delta_j,\\
\mathrm{F@5\%}
&= \frac{1}{N}\sum_{j=1}^{N}
\frac{2\,\mathrm{Prec}_j\,\mathrm{Rec}_j}
{\mathrm{Prec}_j+\mathrm{Rec}_j}.
\end{aligned}`,
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
    formula: String.raw`\begin{aligned}
e_i
&= \frac{1}{m_iS}\sum_{r=1}^{m_i}
\left\|\hat{\mathbf p}_{\sigma(i)}^r-\mathbf p_i^r\right\|_2,\\
\mathrm{MME}
&= \max_{1\le i\le N_{\mathrm{mov}}}e_i.
\end{aligned}`,
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
    formula: String.raw`\mathrm{AME}
=\frac{1}{N_{\mathrm{mov}}}
\sum_{i=1}^{N_{\mathrm{mov}}}e_i`,
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
    formula: String.raw`\begin{aligned}
d_{\mathrm{stat}}(\hat{\mathcal X},\mathcal X)
&= \underset{\hat{\mathbf x}\in\hat{\mathcal X}}{\operatorname{mean}}
\min_{\mathbf x\in\mathcal X}\|\hat{\mathbf x}-\mathbf x\|_2\\
&\quad+
\underset{\mathbf x\in\mathcal X}{\operatorname{mean}}
\min_{\hat{\mathbf x}\in\hat{\mathcal X}}\|\mathbf x-\hat{\mathbf x}\|_2,\\
\mathrm{LE}&=\frac{d_{\mathrm{stat}}}{2S}.
\end{aligned}`,
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
    formula: String.raw`\begin{aligned}
q^\downarrow(m;u)&=100\max\!\left(0,1-\frac{m}{u}\right),\\
q^\uparrow(m;u)&=100\min\!\left(1,\frac{m}{u}\right),\\
\mathrm{Overall}&=\frac{1}{5}\sum_{t=1}^{5}\mathrm{TaskScore}_t.
\end{aligned}`,
    calculation:
      'Convert native scene metrics with fixed references (4 m for ADD-S and PE, 90° for AE, 1 m for MPE, and 1 for F@5%, MME, and LE). Camera averages its PE and AE scores, Dynamic averages MME and LE, and Overall averages the five task scores.',
    primary: true,
  },
];
