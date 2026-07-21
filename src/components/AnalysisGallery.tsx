import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { analysisItems } from '../data/site';
import { tasks } from '../data/tasks';
import { CloseIcon, ExpandIcon } from './Icons';

type AnalysisItem = (typeof analysisItems)[number];

function StackedVisual() {
  const widths = [
    [26, 18, 23, 17, 16],
    [22, 24, 18, 21, 15],
    [19, 20, 25, 16, 20],
    [24, 17, 19, 18, 22],
  ];
  return (
    <svg viewBox="0 0 660 360" aria-hidden="true">
      <path className="plot-axis" d="M76 55v240h526" />
      {widths.map((row, rowIndex) => {
        let x = 100;
        return (
          <g key={rowIndex} transform={`translate(0 ${75 + rowIndex * 56})`}>
            <text className="plot-label" x="75" y="19" textAnchor="end">C{rowIndex + 1}</text>
            {row.map((width, index) => {
              const node = (
                <rect
                  key={index}
                  x={x}
                  y="0"
                  width={width * 4.2}
                  height="28"
                  rx={index === 0 || index === row.length - 1 ? 6 : 0}
                  fill={tasks[index].color.solid}
                  opacity={1 - rowIndex * 0.08}
                />
              );
              x += width * 4.2;
              return node;
            })}
          </g>
        );
      })}
      <text className="plot-caption" x="340" y="338" textAnchor="middle">fixed task-normalized components</text>
    </svg>
  );
}

function SensitivityVisual() {
  return (
    <svg viewBox="0 0 660 360" aria-hidden="true">
      <path className="plot-axis" d="M112 44v250h480" />
      {['direct', 'multi-view', 'partial', 'ambiguous'].map((label, row) => (
        <g key={label}>
          <text className="plot-label" x="100" y={87 + row * 57} textAnchor="end">{label}</text>
          {tasks.map((task, column) => {
            const radius = 8 + ((column * 7 + row * 5) % 17);
            return (
              <circle
                key={task.id}
                cx={157 + column * 94}
                cy={80 + row * 57}
                r={radius}
                fill={task.color.solid}
                opacity={0.32 + ((column + row) % 4) * 0.14}
              />
            );
          })}
        </g>
      ))}
      {tasks.map((task, column) => (
        <text className="plot-label" x={157 + column * 94} y="321" textAnchor="middle" key={task.id}>
          {task.name.slice(0, 4)}
        </text>
      ))}
    </svg>
  );
}

function StagesVisual() {
  const stages = [
    ['Perceive', 440, '#2f6bb2'],
    ['Plan', 365, '#6c76bf'],
    ['Execute', 292, '#1f9c91'],
    ['Verify', 220, '#d7903d'],
  ] as const;
  return (
    <svg viewBox="0 0 660 360" aria-hidden="true">
      {stages.map(([label, width, color], index) => (
        <g key={label} transform={`translate(${(660 - width) / 2} ${45 + index * 68})`}>
          <path
            d={`M0 0h${width}l-26 48H26L0 0Z`}
            fill={color}
            opacity={0.9 - index * 0.12}
          />
          <text className="plot-label light" x={width / 2} y="29" textAnchor="middle">{label}</text>
        </g>
      ))}
      <path className="plot-dash" d="M91 324h478" />
      <text className="plot-caption" x="330" y="347" textAnchor="middle">stage-tagged evaluator traces</text>
    </svg>
  );
}

function BudgetVisual() {
  const rows = [
    ['allocated', 450, '#dcecf8'],
    ['invoked', 354, '#2f6bb2'],
    ['effective', 262, '#1f9c91'],
  ] as const;
  return (
    <svg viewBox="0 0 660 360" aria-hidden="true">
      <path className="plot-axis" d="M120 53v240h455" />
      {rows.map(([label, width, color], index) => (
        <g key={label} transform={`translate(0 ${78 + index * 74})`}>
          <text className="plot-label" x="108" y="24" textAnchor="end">{label}</text>
          <rect x="135" width="450" height="36" rx="9" fill="#edf3f7" />
          <rect x="135" width={width} height="36" rx="9" fill={color} />
          <circle cx={135 + width} cy="18" r="7" fill="#fff" stroke={color} strokeWidth="4" />
        </g>
      ))}
      <text className="plot-caption" x="355" y="331" textAnchor="middle">interactions retained after evaluator validation</text>
    </svg>
  );
}

function CurvesVisual() {
  return (
    <svg viewBox="0 0 660 360" aria-hidden="true">
      <path className="plot-axis" d="M75 45v250h530" />
      <path className="plot-grid" d="M75 95h530M75 145h530M75 195h530M75 245h530" />
      <path className="plot-curve blue" d="M90 268c66-18 76-91 142-106 76-17 96 41 165-10 72-54 112-67 190-73" />
      <path className="plot-curve teal" d="M90 279c80-9 102-52 171-61 89-12 115-51 175-73 57-21 90-10 151-39" />
      <path className="plot-curve amber" d="M90 287c83-42 129-5 191-57 52-43 78-92 151-65 69 25 102-13 155-50" />
      {[90, 195, 300, 405, 510, 587].map((x) => <circle key={x} className="curve-point" cx={x} cy={x === 90 ? 268 : 108 + (x % 73)} r="5" />)}
      <text className="plot-caption" x="340" y="330" textAnchor="middle">agent steps →</text>
    </svg>
  );
}

function TraceVisual() {
  const rows = [
    ['OBS', 'inspect target + inventory', '#2f6bb2'],
    ['ACT', 'set object transform', '#1f9c91'],
    ['OBS', 'render verification view', '#2f6bb2'],
    ['FIX', 'adjust orientation', '#d7903d'],
    ['END', 'submit executable scene', '#173f78'],
  ] as const;
  return (
    <svg viewBox="0 0 660 360" aria-hidden="true">
      <path className="trace-spine" d="M139 48v262" />
      {rows.map(([tag, text, color], index) => (
        <g key={`${tag}-${text}`} transform={`translate(0 ${42 + index * 58})`}>
          <circle cx="139" cy="15" r="8" fill={color} />
          <rect x="176" width="360" height="34" rx="8" fill="#f3f7fa" />
          <rect x="176" width="58" height="34" rx="8" fill={color} opacity=".14" />
          <text className="trace-tag" x="205" y="22" textAnchor="middle" fill={color}>{tag}</text>
          <text className="plot-label" x="252" y="22">{text}</text>
        </g>
      ))}
    </svg>
  );
}

function AnalysisVisual({ item }: { item: AnalysisItem }) {
  const paperAsset = item as AnalysisItem & {
    image?: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  if (paperAsset.image) {
    return (
      <img
        className="analysis-paper-image"
        src={paperAsset.image}
        alt={paperAsset.alt ?? item.title}
        width={paperAsset.width}
        height={paperAsset.height}
        loading="lazy"
      />
    );
  }
  if (item.kind === 'stacked') return <StackedVisual />;
  if (item.kind === 'sensitivity') return <SensitivityVisual />;
  if (item.kind === 'stages') return <StagesVisual />;
  if (item.kind === 'budget') return <BudgetVisual />;
  if (item.kind === 'curves') return <CurvesVisual />;
  return <TraceVisual />;
}

export function AnalysisGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const currentIndex = activeIndex ?? 0;
  const activeItem = activeIndex === null ? null : analysisItems[currentIndex];

  const open = (index: number, button: HTMLButtonElement) => {
    openerRef.current = button;
    setActiveIndex(index);
  };

  const close = () => {
    setActiveIndex(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => current === null ? 0 : (current + 1) % analysisItems.length);
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) =>
          current === null ? 0 : (current - 1 + analysisItems.length) % analysisItems.length,
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [activeIndex]);

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
      <div className="analysis-gallery">
        {analysisItems.map((item, index) => (
          <article className="analysis-card" key={item.id}>
            <button
              type="button"
              className="analysis-visual-button"
              onClick={(event) => open(index, event.currentTarget)}
              aria-label={`Enlarge ${item.title}`}
            >
              <AnalysisVisual item={item} />
              <span className="expand-control"><ExpandIcon /> Enlarge</span>
            </button>
            <div className="analysis-card-copy">
              <span className="micro-label">{item.kicker}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>

      {activeItem && (
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
                <span className="micro-label">{activeItem.kicker}</span>
                <h3 id={titleId}>{activeItem.title}</h3>
              </div>
              <button ref={closeRef} type="button" onClick={close} aria-label="Close figure">
                <CloseIcon />
              </button>
            </div>
            <div className="lightbox-visual">
              <AnalysisVisual item={activeItem} />
            </div>
            <div className="lightbox-foot">
              <p>{activeItem.description}</p>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((currentIndex - 1 + analysisItems.length) % analysisItems.length)
                  }
                >
                  ← Previous
                </button>
                <span>{currentIndex + 1} / {analysisItems.length}</span>
                <button
                  type="button"
                  onClick={() => setActiveIndex((currentIndex + 1) % analysisItems.length)}
                >
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
