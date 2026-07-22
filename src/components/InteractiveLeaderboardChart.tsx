import { useState, type CSSProperties } from 'react';
import { leaderboard, scoreLabels } from '../data/leaderboard';
import type { LeaderboardEntry, TaskId } from '../data/types';
import { withBase } from '../data/assetPath';

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

const taskKeys: TaskId[] = [
  'layout',
  'camera',
  'articulated',
  'reconstruction',
  'dynamic',
];

function formatScore(value: number | null) {
  return value === null ? '—' : value.toFixed(1);
}

export function InteractiveLeaderboardChart() {
  const [selectedId, setSelectedId] = useState('doubao-seed-2-pro-high');
  const selected =
    chartEntries.find((entry) => entry.id === selectedId) ??
    chartEntries[chartEntries.length - 1];

  if (!selected) return null;

  return (
    <figure className="hero-result-figure interactive-leaderboard-chart">
      <div className="interactive-chart-stage">
        <img
          src={withBase('assets/analysis/leaderboard.svg')}
          alt="Stacked task contributions to Overall for all eleven SceneActBench configurations."
          width="1120"
          height="540"
          loading="eager"
        />
        <div className="interactive-chart-hotspots" aria-label="Inspect model task scores">
          {chartEntries.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              aria-label={`Inspect ${entry.model} ${entry.configuration} scores`}
              aria-pressed={entry.id === selected.id}
              style={
                {
                  '--hotspot-left': `${7.8 + index * 8.35}%`,
                } as CSSProperties
              }
              onPointerEnter={() => setSelectedId(entry.id)}
              onFocus={() => setSelectedId(entry.id)}
              onClick={() => setSelectedId(entry.id)}
            />
          ))}
        </div>
      </div>

      <figcaption className="interactive-chart-caption">
        <div className="interactive-chart-selection">
          <div>
            <strong>{selected.model}</strong>
            <span>{selected.configuration} · {selected.organization}</span>
          </div>
          <p>
            Overall <strong>{formatScore(selected.scores.overall)}</strong>
          </p>
        </div>
        <dl>
          {taskKeys.map((key) => {
            const score = selected.scores[key];
            return (
              <div key={key}>
                <dt>{scoreLabels[key]}</dt>
                <dd>
                  {formatScore(score)}
                  {score !== null && <small>+{(score / 5).toFixed(1)}</small>}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="interactive-chart-help">
          Hover, focus, or click a bar to inspect its exact task scores; the smaller value is its
          contribution to Overall.
        </p>
      </figcaption>
    </figure>
  );
}
