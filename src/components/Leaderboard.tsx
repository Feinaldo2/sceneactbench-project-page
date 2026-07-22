import { useMemo, useState } from 'react';
import {
  compareEntries,
  hasPublishedScores,
  leaderboard,
  leaderboardProvenance,
  scoreLabels,
} from '../data/leaderboard';
import type { LeaderboardEntry, ScoreKey } from '../data/types';
import { ChevronDown } from './Icons';

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

export function Leaderboard() {
  const [sortKey, setSortKey] = useState<ScoreKey>('overall');
  const published = hasPublishedScores();

  const sorted = useMemo(
    () => leaderboard.map((entry, index) => ({ entry, sourceIndex: index })).sort((a, b) => {
      const comparison = compareEntries(a.entry, b.entry, sortKey);
      return comparison || a.sourceIndex - b.sourceIndex;
    }),
    [sortKey],
  );

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
                <th
                  scope="col"
                  key={key}
                  aria-sort={sortKey === key ? 'descending' : 'none'}
                >
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
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ entry }, index) => (
                <tr key={entry.id}>
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
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-mobile">
        {sorted.map(({ entry }, index) => (
            <article className="leader-card" key={entry.id}>
              <div className="leader-card-head">
                <span className="leader-rank">{String(index + 1).padStart(2, '0')}</span>
                <ConfigurationName entry={entry} />
              </div>
              <div className="mobile-score">
                <span>{scoreLabels[sortKey]}</span>
                <strong>{formatScore(entry.scores[sortKey])}</strong>
              </div>
              <div className="mobile-task-scores">
                {scoreKeys.filter((key) => key !== sortKey).map((key) => (
                  <span key={key}>
                    {scoreLabels[key]} <b>{formatScore(entry.scores[key])}</b>
                  </span>
                ))}
              </div>
            </article>
        ))}
      </div>

      <div className="leaderboard-footnotes">
        <p>
          <span>Reading Overall</span>
          Overall is a fixed normalized summary across the five tasks. It is not a claim of
          statistical significance; inspect native metrics and case-level evidence before drawing
          model conclusions.
        </p>
      </div>
    </div>
  );
}
