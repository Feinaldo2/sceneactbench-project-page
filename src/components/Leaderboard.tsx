import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  compareEntries,
  hasPublishedScores,
  leaderboard,
  leaderboardProvenance,
  scoreLabels,
} from '../data/leaderboard';
import type { LeaderboardEntry, ScoreKey } from '../data/types';
import { ChevronDown, CloseIcon } from './Icons';

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
  const [notesOpen, setNotesOpen] = useState(false);
  const notesTriggerRef = useRef<HTMLButtonElement>(null);
  const notesCloseRef = useRef<HTMLButtonElement>(null);
  const notesDialogRef = useRef<HTMLElement>(null);
  const notesTitleId = useId();
  const published = hasPublishedScores();

  const sorted = useMemo(
    () => leaderboard.map((entry, index) => ({ entry, sourceIndex: index })).sort((a, b) => {
      const comparison = compareEntries(a.entry, b.entry, sortKey);
      return comparison || a.sourceIndex - b.sourceIndex;
    }),
    [sortKey],
  );

  useEffect(() => {
    if (!notesOpen) return;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    notesCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      appRoot?.removeAttribute('inert');
    };
  }, [notesOpen]);

  const closeNotes = (restoreFocus = true) => {
    setNotesOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => notesTriggerRef.current?.focus());
    }
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
        <button
          ref={notesTriggerRef}
          className="leaderboard-notes-trigger"
          type="button"
          aria-haspopup="dialog"
          onClick={() => setNotesOpen(true)}
        >
          Evaluation notes
        </button>
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

      {notesOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="metric-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeNotes();
              }}
            >
              <article
                ref={notesDialogRef}
                className="metric-dialog notes-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={notesTitleId}
                style={{ '--metric-color': '#1e4a8f' } as React.CSSProperties}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeNotes();
                  } else if (event.key === 'Tab') {
                    const focusable = Array.from(
                      notesDialogRef.current?.querySelectorAll<HTMLElement>(
                        'a[href], button:not([disabled])',
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
                  <span>Evaluation scope</span>
                  <button
                    ref={notesCloseRef}
                    type="button"
                    onClick={() => closeNotes()}
                    aria-label="Close evaluation notes"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <h3 id={notesTitleId}>How to read the leaderboard</h3>
                <ul className="evaluation-notes-list">
                  <li>Each configuration–case pair has one completed run; scores are not repeated-run estimates.</li>
                  <li>Overall uses fixed normalization references; native task metrics define the geometric meaning.</li>
                  <li>Multi-view Layout and photo-realistic Dynamic are reported separately and excluded from Overall.</li>
                  <li>Dynamic contains 10 scenes and should be read as a targeted stress test.</li>
                </ul>
                <a
                  className="notes-explorer-link"
                  href="#explorer"
                  onClick={() => closeNotes(false)}
                >
                  Inspect case-level examples ↓
                </a>
              </article>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
