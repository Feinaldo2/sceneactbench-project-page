import { useMemo, useState } from 'react';
import {
  compareEntries,
  hasPublishedScores,
  leaderboard,
  leaderboardProvenance,
  scoreLabels,
} from '../data/leaderboard';
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
      <figure className="leaderboard-hero-figure">
        <img
          src={withBase('assets/analysis/leaderboard.svg')}
          alt="Stacked task contributions to Overall for all eleven SceneActBench configurations."
          width="1120"
          height="540"
          loading="eager"
        />
        <figcaption>
          Overall decomposed into five equally weighted task contributions. Exact task scores remain
          sortable below.
        </figcaption>
      </figure>

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
      </div>
    </div>
  );
}
