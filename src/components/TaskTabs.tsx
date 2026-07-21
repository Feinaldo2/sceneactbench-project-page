import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { tasks } from '../data/tasks';
import type { TaskId } from '../data/types';
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
              <span aria-hidden="true">{task.index}</span>
              <strong aria-hidden="true">{task.name}</strong>
              <small aria-hidden="true">{task.eyebrow}</small>
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
          <span className="micro-label" style={{ color: activeTask.color.solid }}>
            Task {activeTask.index} · {activeTask.eyebrow}
          </span>
          <h3>{activeTask.capability}</h3>
          <p className="task-description">{activeTask.description}</p>
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
          <div className="primary-metric">
            <span>Primary metric</span>
            <strong>{activeTask.primaryMetric}</strong>
            <small>{activeTask.direction === 'higher' ? 'higher is better' : 'lower is better'}</small>
          </div>
        </div>
        <div className="task-panel-visual">
          <TaskSchematic task={activeTask} />
          <p>
            <span style={{ background: activeTask.color.solid }} />
            Published task workflow · evaluator consumes executable output
          </p>
        </div>
      </article>
    </div>
  );
}
