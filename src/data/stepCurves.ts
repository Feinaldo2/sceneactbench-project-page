export const stepCurveBudgets = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150,
] as const;

// Overall curves from paper_figure_repro_bundle/data/step_curve_scores.json.
export const stepCurveSeries = [
  {
    id: 'doubao',
    label: 'Doubao Seed 2.0 Pro',
    color: '#2f6bb2',
    values: [
      39.74, 45.35, 49.6, 53.9, 57.28, 59.03, 59.72, 61.29, 61.61, 62.36,
      62.37, 62.78, 62.57, 62.64, 62.75,
    ],
  },
  {
    id: 'minimax',
    label: 'MiniMax M3',
    color: '#6d6fc4',
    values: [
      25.94, 32.89, 38.25, 42.47, 43.38, 45.13, 45.69, 45.93, 46.39, 49.92,
      49.62, 49.26, 51.74, 51.5, 53.61,
    ],
  },
  {
    id: 'qwen',
    label: 'Qwen 3.7 Plus',
    color: '#1f9c91',
    values: [
      35.88, 48.39, 50.57, 52.02, 53.95, 51.78, 54.28, 53.27, 51.65, 53.34,
      54.36, 53.25, 53.95, 52.96, 54.02,
    ],
  },
  {
    id: 'mimo',
    label: 'MiMo 2.5',
    color: '#65b9ad',
    values: [
      30.63, 38.21, 41.65, 44.08, 42.84, 42.86, 44.35, 43.6, 45.23, 45.96,
      45.05, 46, 44.97, 46.71, 47.43,
    ],
  },
  {
    id: 'kimi',
    label: 'Kimi K2.6',
    color: '#8b61cf',
    values: [
      30.88, 35.9, 39.17, 39.83, 41.69, 40.81, 41.98, 42.95, 43.01, 42.65,
      42.13, 43.02, 42.39, 42.79, 42.87,
    ],
  },
  {
    id: 'sonnet',
    label: 'Claude Sonnet 5',
    color: '#d7903d',
    values: [
      32.29, 34.72, 34.98, 35.42, 37.61, 35.69, 34.56, 35.46, 35.46, 35.46,
      35.46, 35.46, 35.46, 35.46, 35.46,
    ],
  },
] as const;
