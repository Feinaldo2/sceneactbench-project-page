import { metrics } from '../data/metrics';
import { taskById } from '../data/tasks';

export function MetricsGlossary() {
  return (
    <div className="metrics-module">
      <div className="metric-disambiguation">
        <div className="metric-family">
          <span className="metric-token teal">MPE</span>
          <div>
            <strong>Maximum <u>Part</u> Error</strong>
            <p>Articulated · maximum moving-part state error</p>
          </div>
        </div>
        <span className="not-equal" aria-label="is not equal to">≠</span>
        <div className="metric-family">
          <span className="metric-token coral">MME</span>
          <div>
            <strong>Maximum <u>Mover</u> Error</strong>
            <p>Dynamic · maximum mover trajectory error</p>
          </div>
        </div>
        <span className="versus" aria-hidden="true">vs.</span>
        <div className="metric-family">
          <span className="metric-token amber">AME</span>
          <div>
            <strong>Average <u>Mover</u> Error</strong>
            <p>Dynamic · diagnostic mean</p>
          </div>
        </div>
      </div>

      <div className="metric-grid">
        {metrics.map((metric) => {
          const task = metric.task === 'summary' ? null : taskById[metric.task];
          return (
            <article className="metric-card" key={metric.id}>
              <div className="metric-card-head">
                <span
                  className="metric-id"
                  style={{ '--metric-color': task?.color.solid ?? '#1e4a8f' } as React.CSSProperties}
                >
                  {metric.id}
                </span>
                <span className={`direction ${metric.direction}`}>
                  {metric.direction === 'higher'
                    ? '↑ higher'
                    : metric.direction === 'lower'
                      ? '↓ lower'
                      : 'diagnostic'}
                </span>
              </div>
              <h3>{metric.name}</h3>
              <p>{metric.summary}</p>
              <details>
                <summary>How to read it</summary>
                <p>{metric.detail}</p>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
