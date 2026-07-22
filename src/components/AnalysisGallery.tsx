import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { analysisItems } from '../data/site';
import { stepCurveBudgets, stepCurveSeries } from '../data/stepCurves';
import { CloseIcon, ExpandIcon } from './Icons';

type AnalysisItem = (typeof analysisItems)[number];

const CHART_DURATION_MS = 5_500;
const CHART_LEFT = 82;
const CHART_RIGHT = 920;
const CHART_TOP = 52;
const CHART_BOTTOM = 390;
const CHART_MIN = 20;
const CHART_MAX = 65;

function chartX(index: number) {
  return CHART_LEFT + (index / (stepCurveBudgets.length - 1)) * (CHART_RIGHT - CHART_LEFT);
}

function chartY(value: number) {
  return (
    CHART_BOTTOM -
    ((value - CHART_MIN) / (CHART_MAX - CHART_MIN)) * (CHART_BOTTOM - CHART_TOP)
  );
}

function curvePath(values: readonly number[]) {
  return values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${chartX(index)} ${chartY(value)}`)
    .join(' ');
}

function AnimatedStepCurve() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setProgress(1);
      setPlaying(false);
      return;
    }

    const startedAt = performance.now() - progress * CHART_DURATION_MS;
    const tick = (time: number) => {
      const nextProgress = Math.min(1, (time - startedAt) / CHART_DURATION_MS);
      setProgress(nextProgress);
      if (nextProgress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [playing]);

  const replay = () => {
    setPlaying(false);
    setProgress(0);
    window.requestAnimationFrame(() => setPlaying(true));
  };
  const currentIndex = Math.min(
    stepCurveBudgets.length - 1,
    Math.floor(progress * stepCurveBudgets.length),
  );
  const currentStep = stepCurveBudgets[currentIndex];
  const currentX = chartX(currentIndex);

  return (
    <div className="step-curve-animation">
      <div className="step-curve-legend" aria-label="Step curve models">
        {stepCurveSeries.map((series) => (
          <span key={series.id}>
            <i style={{ background: series.color }} />
            {series.label}
          </span>
        ))}
      </div>
      <svg
        viewBox="0 0 980 470"
        role="img"
        aria-label="Animated Overall score curves from 10 to 150 agent steps"
      >
        <title>Overall score versus agent steps</title>
        <desc>Six model curves replay the exact frozen step-budget checkpoints.</desc>
        {[20, 30, 40, 50, 60].map((tick) => {
          const y = chartY(tick);
          return (
            <g key={tick}>
              <path className="step-grid-line" d={`M${CHART_LEFT} ${y}H${CHART_RIGHT}`} />
              <text className="step-axis-label" x={CHART_LEFT - 16} y={y + 4} textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
        {[10, 30, 50, 70, 90, 110, 130, 150].map((tick) => {
          const index = tick / 10 - 1;
          const x = chartX(index);
          return (
            <text
              className="step-axis-label"
              x={x}
              y={CHART_BOTTOM + 31}
              textAnchor="middle"
              key={tick}
            >
              {tick}
            </text>
          );
        })}
        <path
          className="step-axis-line"
          d={`M${CHART_LEFT} ${CHART_TOP}V${CHART_BOTTOM}H${CHART_RIGHT}`}
        />
        <text
          className="step-axis-title"
          x={(CHART_LEFT + CHART_RIGHT) / 2}
          y="454"
          textAnchor="middle"
        >
          Agent steps
        </text>
        <text
          className="step-axis-title"
          x="20"
          y={(CHART_TOP + CHART_BOTTOM) / 2}
          textAnchor="middle"
          transform={`rotate(-90 20 ${(CHART_TOP + CHART_BOTTOM) / 2})`}
        >
          Overall score
        </text>
        <path className="step-cursor" d={`M${currentX} ${CHART_TOP}V${CHART_BOTTOM}`} />
        <g className="step-cursor-label" transform={`translate(${currentX} ${CHART_TOP - 14})`}>
          <rect x="-35" y="-18" width="70" height="24" rx="12" />
          <text x="0" y="-2" textAnchor="middle">Step {currentStep}</text>
        </g>
        {stepCurveSeries.map((series) => (
          <g key={series.id}>
            <path
              className="animated-step-line"
              d={curvePath(series.values)}
              pathLength="1"
              style={{
                stroke: series.color,
                strokeDasharray: 1,
                strokeDashoffset: 1 - progress,
              }}
            />
            {series.values.map((value, index) => (
              <circle
                key={`${series.id}-${stepCurveBudgets[index]}`}
                className="animated-step-point"
                cx={chartX(index)}
                cy={chartY(value)}
                r="3.6"
                style={{
                  fill: series.color,
                  opacity:
                    index / (stepCurveBudgets.length - 1) <= progress + 0.015 ? 1 : 0,
                }}
              />
            ))}
          </g>
        ))}
      </svg>
      <div className="step-curve-controls">
        <p>
          <strong>Step {currentStep}</strong>
          Exact frozen checkpoints · Overall
        </p>
        <div>
          <button type="button" onClick={() => setPlaying((value) => !value)}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={replay}>Replay</button>
        </div>
      </div>
    </div>
  );
}

function AnalysisImage({ item }: { item: AnalysisItem }) {
  return (
    <img
      className="analysis-paper-image"
      src={item.image}
      alt={item.alt}
      width={item.width}
      height={item.height}
      loading="eager"
    />
  );
}

export function AnalysisGallery() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const selectedItem = analysisItems[selectedIndex];

  const selectItem = (index: number, pauseAuto = true) => {
    setSelectedIndex((index + analysisItems.length) % analysisItems.length);
    if (pauseAuto) setAutoAdvance(false);
  };

  const open = (button: HTMLButtonElement) => {
    openerRef.current = button;
    setLightboxOpen(true);
  };

  const close = () => {
    setLightboxOpen(false);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') selectItem(selectedIndex + 1);
      if (event.key === 'ArrowLeft') selectItem(selectedIndex - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [lightboxOpen, selectedIndex]);

  useEffect(() => {
    if (!autoAdvance || hoverPaused || lightboxOpen) return;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setSelectedIndex((current) => (current + 1) % analysisItems.length);
    }, 6_500);
    return () => window.clearInterval(timer);
  }, [autoAdvance, hoverPaused, lightboxOpen]);

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % analysisItems.length;
    else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + analysisItems.length) % analysisItems.length;
    } else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = analysisItems.length - 1;
    else return;
    event.preventDefault();
    selectItem(nextIndex);
    window.setTimeout(() => document.getElementById(`analysis-tab-${nextIndex}`)?.focus(), 0);
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div
        className="analysis-navigator"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        <div className="analysis-tabs" role="tablist" aria-label="Analysis figures">
          {analysisItems.map((item, index) => (
            <button
              id={`analysis-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selectedIndex === index}
              aria-controls="analysis-panel"
              tabIndex={selectedIndex === index ? 0 : -1}
              key={item.id}
              style={{ '--analysis-accent': item.accent } as React.CSSProperties}
              onClick={() => selectItem(index)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              {item.tab}
            </button>
          ))}
        </div>

        <article
          id="analysis-panel"
          className="analysis-panel"
          role="tabpanel"
          aria-labelledby={`analysis-tab-${selectedIndex}`}
          style={{ '--analysis-accent': selectedItem.accent } as React.CSSProperties}
        >
          <div className="analysis-panel-copy">
            <span className="micro-label">{selectedItem.kicker}</span>
            <h3>{selectedItem.headline}</h3>
            <p>{selectedItem.description}</p>
          </div>
          <div className="analysis-panel-visual">
            {selectedItem.id === 'steps' ? (
              <AnimatedStepCurve />
            ) : (
              <button
                type="button"
                className="analysis-panel-visual-button"
                onClick={(event) => open(event.currentTarget)}
                aria-label={`Enlarge ${selectedItem.title}`}
              >
                <AnalysisImage item={selectedItem} />
                <span className="expand-control"><ExpandIcon /> Enlarge</span>
              </button>
            )}
          </div>
          <div className="analysis-panel-foot">
            <span>{selectedItem.title}</span>
            <div>
              <button
                type="button"
                className="analysis-auto-toggle"
                aria-pressed={!autoAdvance}
                onClick={() => setAutoAdvance((value) => !value)}
              >
                {autoAdvance ? 'Pause auto' : 'Resume auto'}
              </button>
              <button type="button" onClick={() => selectItem(selectedIndex - 1)}>
                ← Previous
              </button>
              <strong>{selectedIndex + 1} / {analysisItems.length}</strong>
              <button type="button" onClick={() => selectItem(selectedIndex + 1)}>
                Next →
              </button>
            </div>
          </div>
        </article>
      </div>

      {lightboxOpen && selectedItem.id !== 'steps' && (
        <div
          className="lightbox-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={trapFocus}
          >
            <div className="lightbox-head">
              <div>
                <span className="micro-label">{selectedItem.kicker}</span>
                <h3 id={titleId}>{selectedItem.title}</h3>
              </div>
              <button ref={closeRef} type="button" onClick={close} aria-label="Close figure">
                <CloseIcon />
              </button>
            </div>
            <div className="lightbox-visual">
              <AnalysisImage item={selectedItem} />
            </div>
            <div className="lightbox-foot">
              <p>{selectedItem.description}</p>
              <div>
                <button type="button" onClick={() => selectItem(selectedIndex - 1)}>
                  ← Previous
                </button>
                <span>{selectedIndex + 1} / {analysisItems.length}</span>
                <button type="button" onClick={() => selectItem(selectedIndex + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
