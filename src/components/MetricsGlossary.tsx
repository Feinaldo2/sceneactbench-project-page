import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { metrics } from '../data/metrics';
import { taskById } from '../data/tasks';
import type { MetricDefinition, TaskId } from '../data/types';
import { CloseIcon } from './Icons';

export function TaskMetrics({ taskId }: { taskId: TaskId }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const task = taskById[taskId];
  const taskMetrics = metrics.filter((metric) => metric.task === taskId);
  const overall = metrics.find((metric) => metric.task === 'summary');
  const availableMetrics = overall ? [...taskMetrics, overall] : taskMetrics;

  useEffect(() => {
    if (selectedMetric) closeRef.current?.focus();
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
                    event.preventDefault();
                    closeRef.current?.focus();
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
                <div className="metric-dialog-detail">
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
