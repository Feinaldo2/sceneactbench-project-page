import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MediaAsset } from '../data/types';
import { ensureModelViewer } from '../lib/modelViewerLoader';
import { CloseIcon, CubeIcon, ImageIcon, PlayIcon } from './Icons';

export type FocusItem = {
  id: string;
  kind: 'image' | 'video' | 'glb';
  asset: MediaAsset;
  label: string;
  animated?: boolean;
};

export function FocusMode({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: FocusItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const item = items[index];

  useEffect(() => {
    if (item?.kind === 'glb') void ensureModelViewer();
  }, [item]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      appRoot?.removeAttribute('inert');
    };
  }, []);

  if (!item || typeof document === 'undefined') return null;

  const move = (step: number) => {
    onIndexChange((index + step + items.length) % items.length);
  };

  return createPortal(
    <div
      className="focus-mode-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        ref={dialogRef}
        className="focus-mode"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1);
          } else if (event.key.toLowerCase() === 'd') {
            const link = document.createElement('a');
            link.href = item.asset.src;
            link.download = '';
            link.click();
          } else if (event.key === 'Tab') {
            const focusable = Array.from(
              dialogRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), video[controls], model-viewer, [tabindex]:not([tabindex="-1"])',
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
        <div className="focus-mode-toolbar">
          <div>
            <span>
              {item.kind === 'image' ? <ImageIcon /> : item.kind === 'video' ? <PlayIcon /> : <CubeIcon />}
            </span>
            <div>
              <h3 id={titleId}>{item.label}</h3>
              <p>{index + 1} / {items.length}</p>
            </div>
          </div>
          <nav aria-label="Focus mode controls">
            <button type="button" onClick={() => move(-1)} aria-label="Previous media">←</button>
            <button type="button" onClick={() => move(1)} aria-label="Next media">→</button>
            <a href={item.asset.src} download aria-label="Download current media">Download</a>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close focus mode">
              <CloseIcon />
            </button>
          </nav>
        </div>

        <div className={`focus-mode-stage ${item.kind}`}>
          {item.kind === 'image' && (
            <img src={item.asset.src} alt={item.asset.alt} />
          )}
          {item.kind === 'video' && (
            <video controls autoPlay loop muted playsInline poster={item.asset.poster}>
              <source src={item.asset.src} type="video/mp4" />
            </video>
          )}
          {item.kind === 'glb' && (
            <model-viewer
              src={item.asset.src}
              poster={item.asset.poster}
              alt={item.asset.alt}
              camera-controls
              auto-rotate={!item.animated}
              autoplay={item.animated}
              shadow-intensity="0.85"
              exposure="1"
              loading="eager"
              reveal="auto"
              interaction-prompt="auto"
              touch-action="pan-y"
              tabIndex={0}
            />
          )}
        </div>
        <p className="focus-mode-help">
          Use ←/→ to move, D to download, and Esc to close.
        </p>
      </article>
    </div>,
    document.body,
  );
}
