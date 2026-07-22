import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { tasks } from '../data/tasks';
import type { TaskId } from '../data/types';
import { TaskMetrics } from './MetricsGlossary';
import { TaskSchematic } from './TaskSchematic';

export function TaskTabs() {
  const [activeId, setActiveId] = useState<TaskId>('layout');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const instanceId = useId();
  const activeTask = tasks.find((task) => task.id === activeId) ?? tasks[0];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tasks.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tasks.length) % tasks.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tasks.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    setActiveId(tasks[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="tasks-module">
      <div className="task-tablist" role="tablist" aria-label="SceneActBench tasks">
        {tasks.map((task, index) => {
          const active = task.id === activeTask.id;
          return (
            <button
              key={task.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`${instanceId}-${task.id}-tab`}
              className={active ? 'task-tab active' : 'task-tab'}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${instanceId}-${task.id}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveId(task.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              style={{ '--tab-color': task.color.solid } as React.CSSProperties}
            >
              <span className="sr-only">
                {task.index} {task.name} {task.eyebrow}
              </span>
              <span className="task-tab-index" aria-hidden="true">{task.index}</span>
              <span className="task-tab-copy" aria-hidden="true">
                <strong>{task.name}</strong>
                <small>{task.eyebrow}</small>
              </span>
              <span className="task-tab-metric" aria-hidden="true">{task.primaryMetric}</span>
            </button>
          );
        })}
      </div>

      <article
        className="task-panel"
        id={`${instanceId}-${activeTask.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${instanceId}-${activeTask.id}-tab`}
        key={activeTask.id}
      >
        <div className="task-panel-copy">
          <div className="task-panel-intro">
            <span className="micro-label">Task {activeTask.index} · {activeTask.name}</span>
            <h3>{activeTask.capability}</h3>
            <p className="task-description">{activeTask.description}</p>
          </div>
          <dl className="task-specs">
            <div>
              <dt>Input</dt>
              <dd>{activeTask.input}</dd>
            </div>
            <div>
              <dt>Output</dt>
              <dd>{activeTask.output}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{activeTask.budget}</dd>
            </div>
            <div>
              <dt>Instances / condition</dt>
              <dd>
                {activeTask.caseCount === null
                  ? 'Included in the 520-case published suite'
                  : activeTask.caseCount}
              </dd>
            </div>
          </dl>
          <div className="task-evaluation">
            <div className="task-evaluation-head">
              <span className="micro-label">How this task is scored</span>
              <small>Open a metric for its formal definition</small>
            </div>
            <TaskMetrics taskId={activeTask.id} />
          </div>
        </div>
        <div className="task-panel-visual">
          <TaskSchematic task={activeTask} />
          <p>
            <span style={{ background: activeTask.color.solid }} />
            Published workflow · the evaluator consumes the executable artifact
          </p>
        </div>
      </article>
    </div>
  );
}
