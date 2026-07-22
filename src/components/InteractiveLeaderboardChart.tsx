import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { leaderboard, scoreLabels } from '../data/leaderboard';
import type { LeaderboardEntry, TaskId } from '../data/types';
import { withBase } from '../data/assetPath';
import { CloseIcon } from './Icons';

const chartOrder = [
  'minimax-m3-high',
  'claude-sonnet-5-high',
  'step-3-7-flash-high',
  'kimi-k2-6-reason',
  'mimo-2-5-high',
  'gemini-3-1-pro-high',
  'qwen-3-7-plus-high',
  'gpt-5-4-high',
  'gpt-5-4-medium',
  'claude-opus-4-6-high',
  'doubao-seed-2-pro-high',
] as const;

const chartEntries = chartOrder
  .map((id) => leaderboard.find((entry) => entry.id === id))
  .filter((entry): entry is LeaderboardEntry => Boolean(entry));

const chartBarCenters = [
  9.793,
  18.324,
  26.854,
  35.385,
  43.914,
  52.444,
  60.976,
  69.507,
  78.035,
  86.566,
  95.096,
] as const;

const taskKeys: TaskId[] = [
  'layout',
  'camera',
  'articulated',
  'reconstruction',
  'dynamic',
];

const taskColors: Record<TaskId, string> = {
  layout: '#1f5f97',
  camera: '#347eae',
  articulated: '#559bc2',
  reconstruction: '#79b6d2',
  dynamic: '#a6cee2',
};

const radarLabels: Record<TaskId, string> = {
  layout: 'Layout',
  camera: 'Camera',
  articulated: 'Artic.',
  reconstruction: 'Recon.',
  dynamic: 'Dynamic',
};

function formatScore(value: number | null) {
  return value === null ? '—' : value.toFixed(1);
}

function radarPoint(index: number, value: number, radius = 82) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / taskKeys.length;
  return {
    x: 130 + Math.cos(angle) * radius * value,
    y: 118 + Math.sin(angle) * radius * value,
  };
}

function pointsForLevel(level: number) {
  return taskKeys
    .map((_, index) => {
      const point = radarPoint(index, level);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function ScoreRadar({ entry }: { entry: LeaderboardEntry }) {
  const scorePoints = taskKeys
    .map((key, index) => {
      const point = radarPoint(index, (entry.scores[key] ?? 0) / 100);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <div className="score-radar">
      <svg viewBox="0 0 260 245" role="img" aria-label={`${entry.model} task profile`}>
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon className="score-radar-grid" points={pointsForLevel(level)} key={level} />
        ))}
        {taskKeys.map((key, index) => {
          const end = radarPoint(index, 1);
          return (
            <line
              className="score-radar-axis"
              x1="130"
              y1="118"
              x2={end.x}
              y2={end.y}
              key={key}
            />
          );
        })}
        <polygon className="score-radar-area" points={scorePoints} />
        {taskKeys.map((key, index) => {
          const point = radarPoint(index, (entry.scores[key] ?? 0) / 100);
          return <circle className="score-radar-point" cx={point.x} cy={point.y} r="3.5" key={key} />;
        })}
        {taskKeys.map((key, index) => {
          const point = radarPoint(index, 1.27);
          return (
            <text
              x={point.x}
              y={point.y}
              textAnchor={point.x < 115 ? 'end' : point.x > 145 ? 'start' : 'middle'}
              dominantBaseline="middle"
              key={key}
            >
              {radarLabels[key]}
            </text>
          );
        })}
      </svg>
      <span>Capability fingerprint</span>
    </div>
  );
}

export function InteractiveLeaderboardChart() {
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [hovered, setHovered] = useState<LeaderboardEntry | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      appRoot?.removeAttribute('inert');
    };
  }, [selected]);

  const openScores = (
    entry: LeaderboardEntry,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    triggerRef.current = event.currentTarget;
    setSelected(entry);
  };

  const closeScores = () => {
    setSelected(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const rankedEntries = [...leaderboard].sort(
    (left, right) => (right.scores.overall ?? -Infinity) - (left.scores.overall ?? -Infinity),
  );
  const selectedRank = selected
    ? rankedEntries.findIndex((entry) => entry.id === selected.id) + 1
    : 0;
  const leaderOverall = rankedEntries[0]?.scores.overall ?? null;
  const taskProfile = selected
    ? taskKeys.map((key) => ({ key, score: selected.scores[key] ?? 0 }))
    : [];
  const strongest = taskProfile.reduce(
    (best, item) => (item.score > best.score ? item : best),
    taskProfile[0] ?? { key: 'layout' as TaskId, score: 0 },
  );
  const weakest = taskProfile.reduce(
    (worst, item) => (item.score < worst.score ? item : worst),
    taskProfile[0] ?? { key: 'layout' as TaskId, score: 0 },
  );
  const hoveredIndex = hovered
    ? chartEntries.findIndex((entry) => entry.id === hovered.id)
    : -1;

  return (
    <>
      <figure className="hero-result-figure interactive-leaderboard-chart">
        <div className="interactive-chart-stage">
          <img
            src={withBase('assets/analysis/leaderboard.svg')}
            alt="Stacked task contributions to Overall for all eleven SceneActBench configurations."
            width="1120"
            height="540"
            loading="eager"
          />
          <div className="interactive-chart-hotspots" aria-label="Open exact model task scores">
            {chartEntries.map((entry, index) => (
              <button
                type="button"
                key={entry.id}
                aria-haspopup="dialog"
                aria-label={`Show ${entry.model} ${entry.configuration} task scores`}
                style={
                  {
                    '--hotspot-left': `${chartBarCenters[index] - 2.475}%`,
                  } as CSSProperties
                }
                onPointerEnter={() => setHovered(entry)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(entry)}
                onBlur={() => setHovered(null)}
                onClick={(event) => openScores(entry, event)}
              />
            ))}
          </div>
          {hovered && hoveredIndex >= 0 && (
            <div
              className="interactive-chart-tooltip"
              style={
                {
                  '--tooltip-left': `${chartBarCenters[hoveredIndex]}%`,
                } as CSSProperties
              }
            >
              <strong>{hovered.model}</strong>
              <span>{hovered.configuration} · Overall {formatScore(hovered.scores.overall)}</span>
              <small>Click for task scores</small>
            </div>
          )}
        </div>

        <figcaption className="interactive-chart-help">
          Click any bar to open that configuration&apos;s Overall and five exact task scores.
        </figcaption>
      </figure>

      {selected && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="metric-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeScores();
              }}
            >
              <article
                ref={dialogRef}
                className="metric-dialog score-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                style={{ '--metric-color': '#1e4a8f' } as CSSProperties}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeScores();
                  } else if (event.key === 'Tab') {
                    const focusable = Array.from(
                      dialogRef.current?.querySelectorAll<HTMLElement>(
                        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                      ) ?? [],
                    );
                    if (focusable.length === 0) return;
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                      event.preventDefault();
                      last?.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                      event.preventDefault();
                      first?.focus();
                    }
                  }
                }}
              >
                <div className="metric-dialog-head">
                  <span>Rank #{selectedRank}</span>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={closeScores}
                    aria-label="Close task scores"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="score-dialog-hero">
                  <div>
                    <p className="score-dialog-meta">
                      {selected.configuration} · {selected.organization}
                    </p>
                    <h3 id={titleId}>{selected.model}</h3>
                    <div className="score-dialog-highlights">
                      <div>
                        <span>Strongest task</span>
                        <strong>{scoreLabels[strongest.key]} · {formatScore(strongest.score)}</strong>
                      </div>
                      <div>
                        <span>Lowest task</span>
                        <strong>{scoreLabels[weakest.key]} · {formatScore(weakest.score)}</strong>
                      </div>
                    </div>
                  </div>
                  <div
                    className="score-overall-orbit"
                    style={
                      {
                        '--overall-score': `${selected.scores.overall ?? 0}%`,
                      } as CSSProperties
                    }
                  >
                    <div>
                      <strong>{formatScore(selected.scores.overall)}</strong>
                      <span>Overall</span>
                    </div>
                  </div>
                </div>

                <div className="score-dialog-dashboard">
                  <ScoreRadar entry={selected} />
                  <div className="score-task-bars">
                    {taskKeys.map((key) => {
                      const score = selected.scores[key] ?? 0;
                      return (
                        <div className="score-task-row" key={key}>
                          <div>
                            <span style={{ background: taskColors[key] }} />
                            <strong>{scoreLabels[key]}</strong>
                            <b>{formatScore(score)}</b>
                          </div>
                          <div className="score-task-track">
                            <i
                              style={
                                {
                                  '--task-color': taskColors[key],
                                  '--score-width': `${score}%`,
                                } as CSSProperties
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="score-dialog-note">
                  {selectedRank === 1
                    ? 'Current Overall leader. The five normalized task scores above average to the fixed Overall summary.'
                    : `${Math.abs((selected.scores.overall ?? 0) - (leaderOverall ?? 0)).toFixed(1)} Overall points behind the leader. The five normalized task scores above average to Overall.`}
                </p>
              </article>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
