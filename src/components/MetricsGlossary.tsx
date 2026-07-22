import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { metrics } from '../data/metrics';
import { taskById } from '../data/tasks';
import type { MetricDefinition, TaskId } from '../data/types';
import { CloseIcon } from './Icons';

function MetricFormula({ source }: { source: string }) {
  const [markup, setMarkup] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([module]) => {
      if (!active) return;
      setMarkup(
        module.default.renderToString(source, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        }),
      );
    });
    return () => {
      active = false;
    };
  }, [source]);

  return (
    <div
      className={markup ? 'metric-formula-render' : 'metric-formula-render loading'}
      dangerouslySetInnerHTML={markup ? { __html: markup } : undefined}
    />
  );
}

export function TaskMetrics({ taskId }: { taskId: TaskId }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const task = taskById[taskId];
  const taskMetrics = metrics.filter((metric) => metric.task === taskId);
  const overall = metrics.find((metric) => metric.task === 'summary');
  const availableMetrics = overall ? [...taskMetrics, overall] : taskMetrics;

  useEffect(() => {
    if (!selectedMetric) return;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      appRoot?.removeAttribute('inert');
    };
  }, [selectedMetric]);

  const openMetric = (
    metric: MetricDefinition,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    triggerRef.current = event.currentTarget;
    setSelectedMetric(metric);
  };

  const closeMetric = () => {
    setSelectedMetric(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <div className="task-metrics" aria-label={`${task.name} metrics`}>
        {availableMetrics.map((metric) => (
          <button
            className={metric.task === 'summary' ? 'task-metric-button summary' : 'task-metric-button'}
            key={metric.id}
            type="button"
            aria-haspopup="dialog"
            aria-label={`Open ${metric.name} metric details`}
            style={
              {
                '--metric-color':
                  metric.task === 'summary' ? '#1e4a8f' : task.color.solid,
              } as React.CSSProperties
            }
            onClick={(event) => openMetric(metric, event)}
          >
            <strong>{metric.id}</strong>
            <span>{metric.name}</span>
          </button>
        ))}
      </div>

      {selectedMetric && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="metric-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeMetric();
              }}
            >
              <article
                ref={dialogRef}
                className="metric-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                style={
                  {
                    '--metric-color':
                      selectedMetric.task === 'summary'
                        ? '#1e4a8f'
                        : task.color.solid,
                  } as React.CSSProperties
                }
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeMetric();
                  } else if (event.key === 'Tab') {
                    const focusable = Array.from(
                      dialogRef.current?.querySelectorAll<HTMLElement>(
                        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
                  <span>{selectedMetric.id}</span>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={closeMetric}
                    aria-label="Close metric details"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <h3 id={titleId}>{selectedMetric.name}</h3>
                <p className="metric-dialog-summary">{selectedMetric.summary}</p>
                <div className="metric-dialog-formula">
                  <h4>Calculation</h4>
                  <MetricFormula source={selectedMetric.formula} />
                  <p>{selectedMetric.calculation}</p>
                </div>
                <div className="metric-dialog-detail">
                  <h4>Interpretation</h4>
                  <p>{selectedMetric.detail}</p>
                </div>
              </article>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
