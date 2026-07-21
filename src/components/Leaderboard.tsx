import { useMemo, useState } from 'react';
import {
  compareEntries,
  hasPublishedScores,
  leaderboard,
  leaderboardProvenance,
  scoreLabels,
} from '../data/leaderboard';
import { tasks } from '../data/tasks';
import type { LeaderboardEntry, ScoreKey } from '../data/types';
import { withBase } from '../data/assetPath';
import { CheckIcon, ChevronDown } from './Icons';

const scoreKeys: ScoreKey[] = [
  'overall',
  'layout',
  'camera',
  'articulated',
  'reconstruction',
  'dynamic',
];

function formatScore(value: number | null) {
  return value === null ? '—' : value.toFixed(1);
}

function ConfigurationName({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="model-name">
      <strong>{entry.model}</strong>
      <span>
        {entry.organization} · {entry.configuration}
      </span>
    </div>
  );
}

function TaskComposition({ entry }: { entry: LeaderboardEntry }) {
  const values = tasks.map((task) => ({
    task,
    score: entry.scores[task.id],
  }));
  const total = values.reduce((sum, item) => sum + (item.score ?? 0), 0);

  if (total === 0) {
    return (
      <div className="composition composition-empty" aria-label="Task score profile unavailable">
        {values.map(({ task }) => (
          <span
            key={task.id}
            style={{ background: task.color.solid, width: `${100 / tasks.length}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="composition" aria-label="Task score profile">
      {values.map(({ task, score }) =>
        score === null ? null : (
          <span
            key={task.id}
            title={`${task.name}: ${formatScore(score)}`}
            style={{
              background: task.color.solid,
              width: `${(score / total) * 100}%`,
            }}
          />
        ),
      )}
    </div>
  );
}

function CompareTray({
  entries,
  onRemove,
  onClear,
}: {
  entries: LeaderboardEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="compare-tray" aria-live="polite">
      <div className="compare-tray-head">
        <div>
          <span className="micro-label">Comparison set</span>
          <strong>{entries.length} of 3 configurations</strong>
        </div>
        <button className="text-button" type="button" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="compare-grid">
        {entries.map((entry) => (
          <article className="compare-card" key={entry.id}>
            <button
              className="compare-remove"
              type="button"
              onClick={() => onRemove(entry.id)}
              aria-label={`Remove ${entry.model} ${entry.configuration} from comparison`}
            >
              ×
            </button>
            <ConfigurationName entry={entry} />
            <TaskComposition entry={entry} />
            <dl>
              {scoreKeys.map((key) => (
                <div key={key}>
                  <dt>{scoreLabels[key]}</dt>
                  <dd>{formatScore(entry.scores[key])}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Leaderboard() {
  const [sortKey, setSortKey] = useState<ScoreKey>('overall');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const published = hasPublishedScores();

  const sorted = useMemo(
    () => leaderboard.map((entry, index) => ({ entry, sourceIndex: index })).sort((a, b) => {
      const comparison = compareEntries(a.entry, b.entry, sortKey);
      return comparison || a.sourceIndex - b.sourceIndex;
    }),
    [sortKey],
  );

  const comparedEntries = selectedIds
    .map((id) => leaderboard.find((entry) => entry.id === id))
    .filter((entry): entry is LeaderboardEntry => Boolean(entry));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  };

  return (
    <div className="leaderboard-shell">
      <div className="leaderboard-controls">
        <label className="sort-select">
          <span>Sort configurations by</span>
          <span className="select-wrap">
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as ScoreKey)}>
              {scoreKeys.map((key) => (
                <option value={key} key={key}>{scoreLabels[key]}</option>
              ))}
            </select>
            <ChevronDown />
          </span>
        </label>
        <div className="task-legend" aria-label="Task color legend">
          {tasks.map((task) => (
            <span key={task.id}>
              <i style={{ background: task.color.solid }} />
              {task.name}
            </span>
          ))}
        </div>
      </div>

      {!published && (
        <div className="data-notice" role="status">
          <span className="notice-symbol" aria-hidden="true">i</span>
          <div>
            <strong>Canonical result snapshot is not publicly reachable yet.</strong>
            <p>
              All 11 published configurations are wired into the interactive table, but numeric
              cells intentionally remain blank until <code>main_table.tex</code> or the
              reproducibility snapshot can be fetched. No score has been inferred.
            </p>
          </div>
          <a href={leaderboardProvenance.source}>Check source</a>
        </div>
      )}

      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <caption className="sr-only">
            SceneActBench model configurations and task scores
          </caption>
          <thead>
            <tr>
              <th scope="col" className="rank-column">{published ? 'Rank' : 'No.'}</th>
              <th scope="col" className="model-column">Configuration</th>
              {scoreKeys.map((key) => (
                <th scope="col" key={key}>
                  <button
                    type="button"
                    className={sortKey === key ? 'sort-button active' : 'sort-button'}
                    onClick={() => setSortKey(key)}
                    aria-label={`Sort by ${scoreLabels[key]}`}
                  >
                    {scoreLabels[key]}
                    {sortKey === key && <span aria-hidden="true">↓</span>}
                  </button>
                </th>
              ))}
              <th scope="col" className="composition-column">Task profile</th>
              <th scope="col" className="compare-column"><span className="sr-only">Compare</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ entry }, index) => {
              const selected = selectedIds.includes(entry.id);
              return (
                <tr key={entry.id} className={selected ? 'selected' : undefined}>
                  <td className="rank-cell">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </td>
                  <th scope="row"><ConfigurationName entry={entry} /></th>
                  {scoreKeys.map((key) => (
                    <td
                      key={key}
                      className={key === sortKey ? 'score-cell active-score' : 'score-cell'}
                    >
                      {formatScore(entry.scores[key])}
                    </td>
                  ))}
                  <td><TaskComposition entry={entry} /></td>
                  <td>
                    <button
                      type="button"
                      className={selected ? 'compare-toggle selected' : 'compare-toggle'}
                      onClick={() => toggleSelected(entry.id)}
                      aria-pressed={selected}
                      aria-label={`${selected ? 'Remove' : 'Add'} ${entry.model} ${entry.configuration} ${selected ? 'from' : 'to'} comparison`}
                    >
                      {selected ? <CheckIcon /> : '+'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-mobile">
        {sorted.map(({ entry }, index) => {
          const selected = selectedIds.includes(entry.id);
          return (
            <article className={selected ? 'leader-card selected' : 'leader-card'} key={entry.id}>
              <div className="leader-card-head">
                <span className="leader-rank">{String(index + 1).padStart(2, '0')}</span>
                <ConfigurationName entry={entry} />
                <button
                  type="button"
                  className={selected ? 'compare-toggle selected' : 'compare-toggle'}
                  onClick={() => toggleSelected(entry.id)}
                  aria-pressed={selected}
                  aria-label={`${selected ? 'Remove' : 'Add'} ${entry.model} ${entry.configuration} ${selected ? 'from' : 'to'} comparison`}
                >
                  {selected ? <CheckIcon /> : '+'}
                </button>
              </div>
              <div className="mobile-score">
                <span>{scoreLabels[sortKey]}</span>
                <strong>{formatScore(entry.scores[sortKey])}</strong>
              </div>
              <TaskComposition entry={entry} />
              <div className="mobile-task-scores">
                {scoreKeys.filter((key) => key !== sortKey).map((key) => (
                  <span key={key}>
                    {scoreLabels[key]} <b>{formatScore(entry.scores[key])}</b>
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <details className="paper-ranking-preview">
        <summary>View the published static leaderboard figure</summary>
        <img
          src={withBase('assets/paper/ranking.webp')}
          alt="Published SceneActBench leaderboard with task contributions stacked into Overall score."
          width="844"
          height="404"
          loading="lazy"
        />
      </details>

      <CompareTray
        entries={comparedEntries}
        onRemove={(id) => setSelectedIds((current) => current.filter((item) => item !== id))}
        onClear={() => setSelectedIds([])}
      />

      <div className="leaderboard-footnotes">
        <p>
          <span>Reading Overall</span>
          Overall is a fixed normalized summary across the five tasks. It is not a claim of
          statistical significance; inspect native metrics and case-level evidence before drawing
          model conclusions.
        </p>
        <p>
          <span>Task profile</span>
          Segment widths show each task&apos;s share of the achieved five-task score sum. Overall
          still gives every task equal 20% weight.
        </p>
      </div>
    </div>
  );
}
