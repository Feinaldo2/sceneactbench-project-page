import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { stepCurveBudgets, stepCurveSeries } from '../data/stepCurves';
import { withBase } from '../data/assetPath';
import { CloseIcon, PlayIcon } from './Icons';

const CHART_WIDTH = 820;
const CHART_HEIGHT = 390;
const CHART_LEFT = 62;
const CHART_RIGHT = 26;
const CHART_TOP = 28;
const CHART_BOTTOM = 48;
const SCORE_MIN = 20;
const SCORE_MAX = 65;

function xAt(index: number) {
  return (
    CHART_LEFT +
    (index / (stepCurveBudgets.length - 1)) *
      (CHART_WIDTH - CHART_LEFT - CHART_RIGHT)
  );
}

function yAt(value: number) {
  return (
    CHART_TOP +
    ((SCORE_MAX - value) / (SCORE_MAX - SCORE_MIN)) *
      (CHART_HEIGHT - CHART_TOP - CHART_BOTTOM)
  );
}

function pathUntil(values: readonly number[], endIndex: number) {
  return values
    .slice(0, endIndex + 1)
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index)} ${yAt(value)}`)
    .join(' ');
}

function StepBudgetPanel() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [currentIndex, setCurrentIndex] = useState(reducedMotion ? stepCurveBudgets.length - 1 : 0);
  const [selectedId, setSelectedId] = useState('doubao');
  const [playing, setPlaying] = useState(!reducedMotion);
  const selected =
    stepCurveSeries.find((series) => series.id === selectedId) ?? stepCurveSeries[0];
  const currentBudget = stepCurveBudgets[currentIndex];
  const currentValue = selected.values[currentIndex];
  const gain = currentValue - selected.values[0];
  const currentRanking = useMemo(
    () =>
      [...stepCurveSeries]
        .sort((left, right) => right.values[currentIndex] - left.values[currentIndex])
        .findIndex((series) => series.id === selected.id) + 1,
    [currentIndex, selected.id],
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((index) => Math.min(index + 1, stepCurveBudgets.length - 1));
    }, 360);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (currentIndex >= stepCurveBudgets.length - 1 && playing) {
      setPlaying(false);
    }
  }, [currentIndex, playing]);

  const restart = () => {
    setCurrentIndex(0);
    setPlaying(!reducedMotion);
  };

  return (
    <div className="step-insight">
      <div className="insight-callout">
        <div>
          <span>Frozen experiment</span>
          <strong>More steps help—until models plateau or regress.</strong>
        </div>
        <p>
          5 configurations · 15 checkpoints · 10–150 agent steps
        </p>
      </div>

      <div className="step-insight-layout">
        <div className="step-chart-card">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={`Overall score curves through ${currentBudget} steps`}
          >
            <defs>
              <linearGradient id="step-chart-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f8fbfe" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
              <filter id="line-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width={CHART_WIDTH} height={CHART_HEIGHT} rx="12" fill="url(#step-chart-bg)" />
            {[20, 30, 40, 50, 60].map((tick) => (
              <g key={tick}>
                <line
                  className="insight-grid-line"
                  x1={CHART_LEFT}
                  x2={CHART_WIDTH - CHART_RIGHT}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                />
                <text className="insight-axis-label" x={CHART_LEFT - 12} y={yAt(tick) + 4} textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}
            {[0, 4, 9, 14].map((index) => (
              <text
                className="insight-axis-label"
                x={xAt(index)}
                y={CHART_HEIGHT - 17}
                textAnchor="middle"
                key={index}
              >
                {stepCurveBudgets[index]}
              </text>
            ))}
            <line
              className="insight-cursor"
              x1={xAt(currentIndex)}
              x2={xAt(currentIndex)}
              y1={CHART_TOP}
              y2={CHART_HEIGHT - CHART_BOTTOM}
            />
            {stepCurveSeries.map((series) => {
              const active = series.id === selected.id;
              return (
                <g
                  className={active ? 'step-series active' : 'step-series'}
                  key={series.id}
                  onClick={() => setSelectedId(series.id)}
                >
                  <path
                    d={pathUntil(series.values, currentIndex)}
                    stroke={series.color}
                    filter={active ? 'url(#line-glow)' : undefined}
                  />
                  <circle
                    cx={xAt(currentIndex)}
                    cy={yAt(series.values[currentIndex])}
                    r={active ? 6 : 4}
                    fill={series.color}
                  />
                </g>
              );
            })}
            <g className="insight-cursor-label" transform={`translate(${xAt(currentIndex) - 29} ${CHART_TOP + 5})`}>
              <rect width="58" height="24" rx="12" />
              <text x="29" y="16" textAnchor="middle">{currentBudget} steps</text>
            </g>
          </svg>

          <div className="step-chart-controls">
            <button
              type="button"
              onClick={() => {
                if (currentIndex >= stepCurveBudgets.length - 1) restart();
                else setPlaying((value) => !value);
              }}
            >
              <PlayIcon /> {playing ? 'Pause' : currentIndex >= stepCurveBudgets.length - 1 ? 'Replay' : 'Play'}
            </button>
            <input
              type="range"
              min="0"
              max={stepCurveBudgets.length - 1}
              value={currentIndex}
              aria-label="Step budget checkpoint"
              onChange={(event) => {
                setPlaying(false);
                setCurrentIndex(Number(event.target.value));
              }}
            />
            <strong>{currentBudget}</strong>
          </div>
        </div>

        <aside className="step-insight-side">
          <div className="step-model-picker" role="list" aria-label="Step curve models">
            {stepCurveSeries.map((series) => (
              <button
                type="button"
                className={series.id === selected.id ? 'active' : undefined}
                key={series.id}
                style={{ '--series-color': series.color } as CSSProperties}
                onClick={() => setSelectedId(series.id)}
              >
                <i />
                <span>{series.shortLabel}</span>
                <strong>{series.values[currentIndex].toFixed(1)}</strong>
              </button>
            ))}
          </div>
          <div className="step-selected-stats">
            <span>{selected.label}</span>
            <div>
              <p><small>Current Overall</small><strong>{currentValue.toFixed(1)}</strong></p>
              <p><small>Gain from 10</small><strong>{gain >= 0 ? '+' : ''}{gain.toFixed(1)}</strong></p>
              <p><small>Rank now</small><strong>#{currentRanking}</strong></p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InputConditionsPanel() {
  return (
    <div className="input-insight">
      <div className="insight-callout">
        <div>
          <span>Controlled input change</span>
          <strong>Richer visual evidence does not help every configuration.</strong>
        </div>
        <p>Same scenes · same targets · same evaluators</p>
      </div>
      <div className="input-insight-layout">
        <figure>
          <img
            src={withBase('assets/analysis/input-sensitivity.svg')}
            alt="Input-condition score changes for multi-view Layout and photo-realistic Dynamic."
            width="748"
            height="418"
            loading="lazy"
          />
        </figure>
        <div className="condition-insight-cards">
          <article>
            <span>Layout · multi-view</span>
            <strong>9 / 11 improve</strong>
            <p>Largest gains: Sonnet +12.1, Gemini +9.4, Claude Opus +8.5.</p>
          </article>
          <article>
            <span>Dynamic · photo-realistic</span>
            <strong>4 improve · 6 decline</strong>
            <p>GPT 5.4 High gains +17.3; Step and Sonnet fall by roughly 10 points.</p>
          </article>
          <article className="insight-caution">
            <span>Interpretation</span>
            <strong>Input sensitivity, not output difficulty</strong>
            <p>Layout and motion targets stay fixed, so changes isolate reference appearance.</p>
          </article>
        </div>
      </div>
    </div>
  );
}

export function PaperInsights() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'inputs'>('steps');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      appRoot?.removeAttribute('inert');
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const selectTab = (tab: 'steps' | 'inputs', index: number) => {
    setActiveTab(tab);
    tabRefs.current[index]?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="paper-insights-trigger"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span>✦</span>
        <strong>Paper insights</strong>
        <small>Interactive results</small>
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="paper-insights-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <article
                ref={dialogRef}
                className="paper-insights"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    close();
                  } else if (event.key === 'Tab') {
                    const focusable = Array.from(
                      dialogRef.current?.querySelectorAll<HTMLElement>(
                        'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
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
                <div className="paper-insights-head">
                  <div>
                    <span>SceneActBench · Paper results</span>
                    <h2 id={titleId}>Interactive research insights</h2>
                  </div>
                  <button ref={closeRef} type="button" onClick={close} aria-label="Close paper insights">
                    <CloseIcon />
                  </button>
                </div>
                <div className="paper-insights-tabs" role="tablist" aria-label="Paper insight views">
                  <button
                    ref={(element) => { tabRefs.current[0] = element; }}
                    id={`${titleId}-steps-tab`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'steps'}
                    aria-controls={`${titleId}-panel`}
                    tabIndex={activeTab === 'steps' ? 0 : -1}
                    onClick={() => setActiveTab('steps')}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight' || event.key === 'End') {
                        event.preventDefault();
                        selectTab('inputs', 1);
                      }
                    }}
                  >
                    Step budget
                  </button>
                  <button
                    ref={(element) => { tabRefs.current[1] = element; }}
                    id={`${titleId}-inputs-tab`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'inputs'}
                    aria-controls={`${titleId}-panel`}
                    tabIndex={activeTab === 'inputs' ? 0 : -1}
                    onClick={() => setActiveTab('inputs')}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'Home') {
                        event.preventDefault();
                        selectTab('steps', 0);
                      }
                    }}
                  >
                    Input conditions
                  </button>
                </div>
                <div
                  id={`${titleId}-panel`}
                  className="paper-insights-body"
                  role="tabpanel"
                  aria-labelledby={
                    activeTab === 'steps'
                      ? `${titleId}-steps-tab`
                      : `${titleId}-inputs-tab`
                  }
                >
                  {activeTab === 'steps' ? <StepBudgetPanel /> : <InputConditionsPanel />}
                </div>
              </article>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
