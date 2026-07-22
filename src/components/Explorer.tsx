import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { withBase } from '../data/assetPath';
import { emptyExamplesManifest, loadExamplesManifest } from '../data/examples';
import { leaderboard } from '../data/leaderboard';
import { metrics } from '../data/metrics';
import { taskById, tasks } from '../data/tasks';
import type {
  BenchmarkExample,
  ExamplesManifest,
  MediaAsset,
  TaskId,
} from '../data/types';
import { ensureModelViewer } from '../lib/modelViewerLoader';
import { FocusMode, type FocusItem } from './FocusMode';
import { ChevronDown, CubeIcon, ExpandIcon, FileIcon, ImageIcon, PlayIcon } from './Icons';

type ModelViewerApi = HTMLElement & {
  loaded?: boolean;
  currentTime: number;
  duration: number;
  paused: boolean;
  cameraOrbit?: string;
  cameraTarget?: string;
  fieldOfView?: string;
  getCameraOrbit?: () => { toString: () => string };
  getCameraTarget?: () => { toString: () => string };
  getFieldOfView?: () => number;
  jumpCameraToGoal?: () => void;
  play?: () => void;
  pause?: () => void;
};

type FocusOpener = (
  itemId: string,
  event: ReactMouseEvent<HTMLButtonElement>,
) => void;

function focusItemId(kind: FocusItem['kind'], asset: MediaAsset) {
  return `${kind}:${asset.src}`;
}

function Placeholder({
  icon,
  eyebrow,
  title,
  detail,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="media-placeholder">
      <span className="placeholder-icon">{icon}</span>
      <span className="micro-label">{eyebrow}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function ImageSlot({
  asset,
  label,
  detail,
  emptyTitle = 'Preview unavailable',
  loading = 'lazy',
  onOpen,
}: {
  asset?: MediaAsset;
  label: string;
  detail: string;
  emptyTitle?: string;
  loading?: 'eager' | 'lazy';
  onOpen?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  const [failed, setFailed] = useState(false);
  if (!asset || failed) {
    return (
      <Placeholder
        icon={<ImageIcon />}
        eyebrow={label}
        title={failed ? 'Preview could not be loaded' : emptyTitle}
        detail={failed ? 'Reload the page or inspect the released artifact directly.' : detail}
      />
    );
  }
  return (
    <figure className="explorer-image">
      <button
        type="button"
        className="explorer-image-open"
        aria-label={`Open ${label.toLowerCase()} in focus mode`}
        onClick={onOpen}
      >
        <img src={asset.src} alt={asset.alt} loading={loading} onError={() => setFailed(true)} />
        <span className="explorer-open-badge"><ExpandIcon /> Focus</span>
      </button>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function VideoSlot({
  asset,
  label,
  onOpen,
}: {
  asset: MediaAsset;
  label: string;
  onOpen?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <figure className="explorer-video">
      <video controls loop muted playsInline preload="metadata" poster={asset.poster}>
        <source src={asset.src} type="video/mp4" />
      </video>
      <button
        type="button"
        className="media-focus-button"
        onClick={onOpen}
        aria-label={`Open ${label.toLowerCase()} in focus mode`}
      >
        <ExpandIcon /> Focus
      </button>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function ModelViewer({
  asset,
  animated = false,
  autoRotate,
  autoplay = animated,
  label,
  priority = 'secondary',
  onOpen,
  onViewerReady,
}: {
  asset?: MediaAsset;
  animated?: boolean;
  autoRotate?: boolean;
  autoplay?: boolean;
  label: string;
  priority?: 'primary' | 'secondary';
  onOpen?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onViewerReady?: (viewer: ModelViewerApi | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerApi>(null);
  const onViewerReadyRef = useRef(onViewerReady);
  const [inView, setInView] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    onViewerReadyRef.current = onViewerReady;
  }, [onViewerReady]);

  useEffect(() => {
    if (!asset) return;
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: priority === 'primary' ? '320px' : '120px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [asset, priority]);

  useEffect(() => {
    if (!asset || !inView) return;
    let active = true;
    setStatus('loading');
    void ensureModelViewer()
      .then(() => {
        if (active) setRegistered(true);
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => { active = false; };
  }, [asset?.src, inView]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !registered) return;
    const handleLoad = () => {
      setStatus('ready');
      onViewerReadyRef.current?.(viewer);
    };
    const handleError = () => {
      setStatus('error');
      onViewerReadyRef.current?.(null);
    };
    const handleProgress = (event: Event) => {
      const progress = event as CustomEvent<{ totalProgress?: number }>;
      if ((progress.detail?.totalProgress ?? 0) >= 1) setStatus('ready');
    };
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    viewer.addEventListener('progress', handleProgress);
    if (viewer.loaded) handleLoad();
    return () => {
      onViewerReadyRef.current?.(null);
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
      viewer.removeEventListener('progress', handleProgress);
    };
  }, [asset?.src, registered]);

  return (
    <div className="model-viewer-frame" ref={containerRef}>
      {!asset && (
        <Placeholder
          icon={animated ? <PlayIcon /> : <CubeIcon />}
          eyebrow={label}
          title="3D artifact unavailable"
          detail="No interactive 3D artifact is available for this selected example."
        />
      )}
      {asset && status !== 'ready' && (
        <div className={`viewer-fallback ${status !== 'error' ? 'is-loading' : ''}`}>
          {asset.poster && status !== 'error' ? (
            <img src={asset.poster} alt="" />
          ) : (
            <Placeholder
              icon={<CubeIcon />}
              eyebrow={label}
              title={status === 'error' ? '3D preview unavailable' : 'Loading 3D viewer'}
              detail={
                status === 'error'
                  ? 'Use the poster or verify the GLB path in the examples manifest.'
                  : 'The viewer is loaded only when this panel approaches the viewport.'
              }
            />
          )}
        </div>
      )}
      {asset && registered && status !== 'error' && (
        <model-viewer
          ref={viewerRef}
          src={asset.src}
          poster={asset.poster}
          alt={asset.alt}
          camera-controls
          auto-rotate={autoRotate ?? !animated}
          autoplay={animated && autoplay}
          shadow-intensity="0.8"
          exposure="1"
          loading={priority === 'primary' ? 'eager' : 'lazy'}
          reveal="auto"
          interaction-prompt="auto"
          touch-action="pan-y"
        />
      )}
      {asset && status === 'loading' && <span className="viewer-status">Loading geometry…</span>}
      {asset && (
        <a className="viewer-download" href={asset.src} download>
          Download GLB
        </a>
      )}
      {asset && (
        <button
          type="button"
          className="viewer-focus"
          onClick={onOpen}
          aria-label={`Open ${label.toLowerCase()} in focus mode`}
        >
          <ExpandIcon /> Focus
        </button>
      )}
    </div>
  );
}

function PreviewStrip({
  assets,
  label,
  emptyDetail,
  onOpenFocus,
}: {
  assets: MediaAsset[];
  label: string;
  emptyDetail: string;
  onOpenFocus?: FocusOpener;
}) {
  if (assets.length === 0) return null;
  return (
    <div className="preview-strip" aria-label={label}>
      {assets.slice(0, 4).map((asset, index) => (
        <ImageSlot
          key={asset?.src ?? `${label}-${index}`}
          asset={asset}
          label={`${label} ${index + 1}`}
          detail={emptyDetail}
          onOpen={(event) => onOpenFocus?.(focusItemId('image', asset), event)}
        />
      ))}
    </div>
  );
}

function CameraOutput({
  example,
  onOpenFocus,
}: {
  example?: BenchmarkExample;
  onOpenFocus?: FocusOpener;
}) {
  const poseJson = example?.task === 'camera' ? example.poseJson : undefined;
  return (
    <div className="camera-output">
      <ImageSlot
        asset={example?.outputImages[0]}
        label="Rendered verification"
        emptyTitle="No verification render"
        detail="The pose is still available as structured JSON."
        onOpen={(event) => {
          const asset = example?.outputImages[0];
          if (asset) onOpenFocus?.(focusItemId('image', asset), event);
        }}
      />
      <details className="pose-card">
        <summary className="pose-card-head">
          <FileIcon />
          <span>
            <strong>camera_pose.json</strong>
            <small>structured output</small>
          </span>
          <span className="pose-toggle">
            <span className="pose-view">View JSON</span>
            <span className="pose-hide">Hide JSON</span>
          </span>
        </summary>
        <div className="pose-card-body">
          {poseJson ? (
            <pre>{poseJson}</pre>
          ) : (
            <div className="pose-empty">
              <code>{'{\n  "position": pending,\n  "orientation": pending,\n  "fov": pending\n}'}</code>
              <p>Camera examples use pose JSON and rendered images—not GLB geometry.</p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function TaskOutput({
  taskId,
  example,
  onOpenFocus,
  registerViewer,
}: {
  taskId: TaskId;
  example?: BenchmarkExample;
  onOpenFocus?: FocusOpener;
  registerViewer?: (key: string, viewer: ModelViewerApi | null) => void;
}) {
  if (taskId === 'camera') {
    return <CameraOutput example={example} onOpenFocus={onOpenFocus} />;
  }

  if (taskId === 'articulated') {
    const articulated = example?.task === 'articulated' ? example : undefined;
    const hasKeyframes = (articulated?.keyframes.length ?? 0) > 0;
    return (
      <div className={`specialized-output articulated-output ${hasKeyframes ? 'has-keyframes' : 'viewer-only'}`}>
        <ModelViewer
          asset={articulated?.animatedGlb}
          animated={articulated?.hasAnimation ?? false}
          autoplay={false}
          label={
            articulated?.hasAnimation === false
              ? 'Submitted static articulated geometry'
              : 'Animated articulated geometry'
          }
          priority="primary"
          onOpen={(event) => {
            if (articulated?.animatedGlb) {
              onOpenFocus?.(focusItemId('glb', articulated.animatedGlb), event);
            }
          }}
          onViewerReady={(viewer) => registerViewer?.('output', viewer)}
        />
        {hasKeyframes && (
          <div>
            <span className="micro-label">Keyframe evidence</span>
            <PreviewStrip
              assets={articulated?.keyframes ?? []}
              label="Keyframe"
              emptyDetail="Rendered keyframe unavailable."
              onOpenFocus={onOpenFocus}
            />
          </div>
        )}
      </div>
    );
  }

  if (taskId === 'dynamic') {
    const dynamic = example?.task === 'dynamic' ? example : undefined;
    return (
      <div className="dynamic-output-stack">
        <div className="dynamic-condition">
          <div className="condition-heading">
            <span className="micro-label">Base condition</span>
            <strong>Low-poly input</strong>
          </div>
          <ModelViewer
            asset={dynamic?.animatedGlb}
            animated={dynamic?.hasAnimation ?? false}
            autoplay={false}
            label={
              dynamic?.hasAnimation === false
                ? 'Submitted static base geometry'
                : 'Animated base geometry'
            }
            priority="primary"
            onOpen={(event) => {
              if (dynamic?.animatedGlb) {
                onOpenFocus?.(focusItemId('glb', dynamic.animatedGlb), event);
              }
            }}
            onViewerReady={(viewer) => registerViewer?.('output-base', viewer)}
          />
        </div>
        <div className="dynamic-condition">
          <div className="condition-heading">
            <span className="micro-label">Paired condition</span>
            <strong>Photo-realistic input</strong>
          </div>
          <ModelViewer
            asset={dynamic?.pairedAnimatedGlb}
            animated={dynamic?.pairedHasAnimation ?? false}
            autoplay={false}
            label={
              dynamic?.pairedHasAnimation === false
                ? 'Submitted static paired geometry'
                : 'Animated paired geometry'
            }
            onOpen={(event) => {
              if (dynamic?.pairedAnimatedGlb) {
                onOpenFocus?.(focusItemId('glb', dynamic.pairedAnimatedGlb), event);
              }
            }}
            onViewerReady={(viewer) => registerViewer?.('output-paired', viewer)}
          />
        </div>
      </div>
    );
  }

  const sceneExample =
    example?.task === 'layout' || example?.task === 'reconstruction' ? example : undefined;
  const outputImage = sceneExample?.outputImages[0];
  return (
    <div className={`scene-output-grid ${outputImage ? 'has-render' : 'viewer-only'}`}>
      <ModelViewer
        asset={sceneExample?.outputGlb}
        label="Interactive result"
        priority="primary"
        onOpen={(event) => {
          if (sceneExample?.outputGlb) {
            onOpenFocus?.(focusItemId('glb', sceneExample.outputGlb), event);
          }
        }}
      />
      {outputImage && (
        <ImageSlot
          asset={outputImage}
          label="Output render"
          detail="Rendered verification of the submitted scene."
          onOpen={(event) => {
            if (outputImage) onOpenFocus?.(focusItemId('image', outputImage), event);
          }}
        />
      )}
    </div>
  );
}

function referenceImageLabel(taskId: TaskId, index: number) {
  if (taskId === 'dynamic') {
    return index === 0 ? 'Low-poly input' : 'Photo-realistic input';
  }
  if (taskId === 'articulated') return index === 0 ? 'Closed input frame' : 'Open input frame';
  if (taskId === 'reconstruction') return `Input view ${index + 1}`;
  return 'Input reference';
}

function referenceVideoLabel(taskId: TaskId, index: number) {
  if (taskId === 'dynamic') {
    return index === 0 ? 'Low-poly input video' : 'Photo-realistic input video';
  }
  return 'Input motion sequence';
}

function buildFocusItems(example?: BenchmarkExample): FocusItem[] {
  if (!example) return [];
  const items: FocusItem[] = [];
  const add = (
    kind: FocusItem['kind'],
    asset: MediaAsset | undefined,
    label: string,
    animated = false,
  ) => {
    if (!asset) return;
    const id = focusItemId(kind, asset);
    if (items.some((item) => item.id === id)) return;
    items.push({ id, kind, asset, label, animated });
  };

  example.referenceImages.forEach((asset, index) => {
    add('image', asset, referenceImageLabel(example.task, index));
  });
  example.referenceVideos?.forEach((asset, index) => {
    add('video', asset, referenceVideoLabel(example.task, index));
  });
  add(
    'glb',
    example.referenceGlb,
    example.referenceGlbAnimated ? 'Animated ground truth' : 'Ground-truth geometry',
    example.referenceGlbAnimated ?? false,
  );
  example.outputImages.forEach((asset, index) => {
    add('image', asset, `Output render ${index + 1}`);
  });

  if (example.task === 'layout' || example.task === 'reconstruction') {
    add('glb', example.outputGlb, 'Interactive result');
  } else if (example.task === 'articulated') {
    add('glb', example.animatedGlb, 'Submitted articulated result', example.hasAnimation);
    example.keyframes.forEach((asset, index) => add('image', asset, `Keyframe ${index + 1}`));
  } else if (example.task === 'dynamic') {
    add('glb', example.animatedGlb, 'Low-poly-input result', example.hasAnimation);
    add(
      'glb',
      example.pairedAnimatedGlb,
      'Photo-realistic-input result',
      example.pairedHasAnimation,
    );
    example.lowPolyPreviews.forEach((asset, index) => {
      add('image', asset, `Low-poly preview ${index + 1}`);
    });
    example.photorealisticPreviews.forEach((asset, index) => {
      add('image', asset, `Photo-realistic preview ${index + 1}`);
    });
  }
  return items;
}

export function Explorer() {
  const [taskId, setTaskId] = useState<TaskId>('layout');
  const [modelId, setModelId] = useState(leaderboard[0].id);
  const [manifest, setManifest] = useState<ExamplesManifest>(emptyExamplesManifest);
  const [manifestState, setManifestState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [viewers, setViewers] = useState<Record<string, ModelViewerApi | null>>({});
  const [syncPlaying, setSyncPlaying] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const focusTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void loadExamplesManifest(controller.signal)
      .then((nextManifest) => {
        setManifest(nextManifest);
        setManifestState('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setManifestState('error');
      });
    return () => controller.abort();
  }, []);

  const example = useMemo(
    () => manifest.examples.find((item) => item.task === taskId && item.modelId === modelId),
    [manifest, modelId, taskId],
  );
  const task = taskById[taskId];
  const model = leaderboard.find((entry) => entry.id === modelId) ?? leaderboard[0];
  const nativeMetrics = metrics.filter((metric) => metric.task === taskId);
  const referenceImages = example?.referenceImages ?? [];
  const focusItems = useMemo(() => buildFocusItems(example), [example]);
  const sameSceneExamples = useMemo(() => {
    if (!example) return [];
    return leaderboard
      .map((entry) =>
        manifest.examples.find(
          (item) =>
            item.task === taskId &&
            item.sourceInstance === example.sourceInstance &&
            item.modelId === entry.id,
        ),
      )
      .filter((item): item is BenchmarkExample => Boolean(item));
  }, [example, manifest.examples, taskId]);
  const sameSceneIndex = sameSceneExamples.findIndex((item) => item.modelId === modelId);

  const registerViewer = useCallback((key: string, viewer: ModelViewerApi | null) => {
    setViewers((current) => {
      if (current[key] === viewer) return current;
      return { ...current, [key]: viewer };
    });
  }, []);

  const openFocus = (itemId: string, event: ReactMouseEvent<HTMLButtonElement>) => {
    const nextIndex = focusItems.findIndex((item) => item.id === itemId);
    if (nextIndex < 0) return;
    focusTriggerRef.current = event.currentTarget;
    setFocusIndex(nextIndex);
  };

  const closeFocus = () => {
    setFocusIndex(null);
    window.requestAnimationFrame(() => focusTriggerRef.current?.focus());
  };

  useEffect(() => {
    setViewers({});
    setSyncPlaying(false);
    setSyncProgress(0);
    setFocusIndex(null);
  }, [modelId, taskId]);

  useEffect(() => {
    const activeViewers = Object.values(viewers).filter(
      (viewer): viewer is ModelViewerApi => Boolean(viewer),
    );
    if (activeViewers.length < 2) return;
    let applyingSync = false;
    let releaseFrame: number | undefined;
    const syncFrom = (source: ModelViewerApi) => {
      if (applyingSync) return;
      const orbit = source.getCameraOrbit?.().toString();
      const target = source.getCameraTarget?.().toString();
      const fieldOfView = source.getFieldOfView?.();
      if (!orbit || !target || fieldOfView === undefined) return;
      applyingSync = true;
      activeViewers.forEach((viewer) => {
        if (viewer === source) return;
        viewer.cameraOrbit = orbit;
        viewer.cameraTarget = target;
        viewer.fieldOfView = `${fieldOfView}deg`;
        viewer.jumpCameraToGoal?.();
      });
      releaseFrame = window.requestAnimationFrame(() => {
        applyingSync = false;
      });
    };
    const handlers = activeViewers.map((viewer) => {
      const handler = () => syncFrom(viewer);
      viewer.addEventListener('camera-change', handler);
      return { viewer, handler };
    });
    syncFrom(activeViewers[0]);
    return () => {
      if (releaseFrame !== undefined) window.cancelAnimationFrame(releaseFrame);
      handlers.forEach(({ viewer, handler }) => {
        viewer.removeEventListener('camera-change', handler);
      });
    };
  }, [viewers]);

  const animatedViewers = useMemo(() => {
    const keys =
      example?.task === 'articulated'
        ? example.hasAnimation
          ? ['reference', 'output']
          : ['reference']
        : example?.task === 'dynamic'
          ? [
              'reference',
              ...(example.hasAnimation ? ['output-base'] : []),
              ...(example.pairedHasAnimation ? ['output-paired'] : []),
            ]
          : [];
    return keys
      .map((key) => viewers[key])
      .filter((viewer): viewer is ModelViewerApi => Boolean(viewer));
  }, [example, viewers]);
  const canSyncPlayback = animatedViewers.length >= 2;
  const hasSyncAnimationPair =
    example?.task === 'articulated'
      ? Boolean(example.referenceGlbAnimated && example.hasAnimation)
      : example?.task === 'dynamic'
        ? Boolean(
            example.referenceGlbAnimated &&
              (example.hasAnimation || example.pairedHasAnimation),
          )
        : false;
  const cameraSyncReady =
    Object.values(viewers).filter((viewer) => Boolean(viewer)).length >= 2;

  useEffect(() => {
    if (!syncPlaying || !canSyncPlayback) return;
    let frameId: number;
    const tick = () => {
      const leader = animatedViewers[0];
      if (leader && leader.duration > 0) {
        const progress = Math.min(1, leader.currentTime / leader.duration);
        setSyncProgress(progress);
        animatedViewers.slice(1).forEach((viewer) => {
          if (viewer.duration > 0) viewer.currentTime = progress * viewer.duration;
        });
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [animatedViewers, canSyncPlayback, syncPlaying]);

  const showRandomExample = () => {
    const alternatives = manifest.examples.filter((item) => item.id !== example?.id);
    const pool = alternatives.length > 0 ? alternatives : manifest.examples;
    if (pool.length === 0) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (!next) return;
    setTaskId(next.task);
    setModelId(next.modelId);
  };

  const showNextModelOnScene = () => {
    if (sameSceneExamples.length < 2) return;
    const currentIndex = sameSceneExamples.findIndex((item) => item.modelId === modelId);
    const next = sameSceneExamples[(currentIndex + 1 + sameSceneExamples.length) % sameSceneExamples.length];
    if (next) setModelId(next.modelId);
  };

  const toggleSyncedPlayback = () => {
    if (!canSyncPlayback) return;
    if (syncPlaying) {
      animatedViewers.forEach((viewer) => viewer.pause?.());
      setSyncPlaying(false);
    } else {
      animatedViewers.forEach((viewer) => viewer.play?.());
      setSyncPlaying(true);
    }
  };

  const scrubSyncedPlayback = (progress: number) => {
    setSyncProgress(progress);
    animatedViewers.forEach((viewer) => {
      if (viewer.duration > 0) viewer.currentTime = progress * viewer.duration;
    });
  };

  return (
    <div className="explorer-shell">
      <div className="explorer-controls">
        <div>
          <span className="control-label">Choose task</span>
          <div className="explorer-task-pills" role="group" aria-label="Choose explorer task">
            {tasks.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === taskId ? 'active' : undefined}
                onClick={() => setTaskId(item.id)}
                style={{ '--pill-color': item.color.solid } as React.CSSProperties}
                aria-pressed={item.id === taskId}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <label className="model-select">
          <span className="control-label">Choose configuration</span>
          <span className="select-wrap">
            <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
              {leaderboard.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.model} · {entry.configuration}
                </option>
              ))}
            </select>
            <ChevronDown />
          </span>
        </label>
        <button
          className="random-example-button"
          type="button"
          disabled={manifestState !== 'ready' || manifest.examples.length < 2}
          onClick={showRandomExample}
        >
          Random example
        </button>
        <button
          className="same-scene-button"
          type="button"
          disabled={sameSceneExamples.length < 2}
          onClick={showNextModelOnScene}
        >
          Next model · same scene
        </button>
      </div>

      <div className="explorer-context">
        <div>
          <span className="micro-label" style={{ color: task.color.solid }}>{task.name} case</span>
          <h3>{example?.title ?? 'Curated example slot'}</h3>
          <p>
            {example?.prompt ??
              example?.notes ??
              (example
                ? task.description
                : 'Select a task and configuration to inspect the curated benchmark artifact.')}
          </p>
        </div>
        <div className="example-state">
          <span className={example ? 'state-dot ready' : 'state-dot'} />
          <span>
            <strong>{example ? 'Example loaded' : 'Example unavailable'}</strong>
            <small>
              {manifestState === 'loading'
                ? 'Loading manifest'
                : manifestState === 'error'
                  ? 'Example data could not be loaded'
                  : `${sameSceneIndex + 1}/${sameSceneExamples.length || 1} configurations · Schema v${manifest.schemaVersion}`}
            </small>
          </span>
        </div>
      </div>

      <div className="explorer-evidence">
        <section className="evidence-input" aria-labelledby="explorer-input-title">
          <div className="panel-heading">
            <span>01</span>
            <div>
              <h4 id="explorer-input-title">Reference evidence</h4>
              <p>{example?.sourceInstance ?? 'Source instance will be recorded here'}</p>
            </div>
          </div>
          <div
            className={`reference-grid reference-grid-${taskId} ${
              referenceImages.length <= 1 ? 'single' : ''
            }`}
          >
            {referenceImages.length > 0 ? (
              referenceImages.slice(0, 2).map((asset, index) => (
                <ImageSlot
                  key={asset.src}
                  asset={asset}
                  label={referenceImageLabel(taskId, index)}
                  detail="Reference evidence for this benchmark case."
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onOpen={(event) => openFocus(focusItemId('image', asset), event)}
                />
              ))
            ) : (
              <ImageSlot
                label="Reference evidence"
                emptyTitle="Reference unavailable"
                detail="No reference image is published for this case."
              />
            )}
          </div>
          {example?.referenceGlb && (
            <div className="reference-geometry">
              <span className="micro-label">Hidden ground-truth 3D</span>
              <ModelViewer
                asset={example.referenceGlb}
                animated={example.referenceGlbAnimated ?? false}
                autoRotate={example.task === 'articulated' ? true : undefined}
                autoplay={
                  example.task === 'articulated' || example.task === 'dynamic'
                    ? false
                    : undefined
                }
                label={example.referenceGlbAnimated ? 'Animated ground truth' : 'Ground-truth geometry'}
                priority="primary"
                onOpen={(event) => {
                  if (example.referenceGlb) {
                    openFocus(focusItemId('glb', example.referenceGlb), event);
                  }
                }}
                onViewerReady={(viewer) => registerViewer('reference', viewer)}
              />
            </div>
          )}
        </section>

        <section className="evidence-output" aria-labelledby="explorer-output-title">
          <div className="panel-heading">
            <span>02</span>
            <div>
              <h4 id="explorer-output-title">{task.name} output</h4>
              <p>{model.model} · {model.configuration}</p>
            </div>
          </div>
          <TaskOutput
            taskId={taskId}
            example={example}
            onOpenFocus={openFocus}
            registerViewer={registerViewer}
          />
        </section>
      </div>

      {(taskId === 'articulated' || taskId === 'dynamic') && (
        <div className="synced-playback" aria-label="Synchronized 3D comparison controls">
          <span className={cameraSyncReady ? 'sync-status ready' : 'sync-status'}>
            {cameraSyncReady ? 'Camera linked' : 'Preparing camera link'}
          </span>
          <button
            type="button"
            disabled={!canSyncPlayback}
            onClick={toggleSyncedPlayback}
          >
            {syncPlaying ? 'Pause both' : 'Play both'}
          </button>
          <input
            type="range"
            min="0"
            max="1000"
            value={Math.round(syncProgress * 1000)}
            disabled={!canSyncPlayback}
            aria-label="Synchronized animation progress"
            onChange={(event) => scrubSyncedPlayback(Number(event.target.value) / 1000)}
          />
          <small>
            {canSyncPlayback
              ? 'Shared camera and animation timeline'
              : hasSyncAnimationPair
                ? 'Loading synchronized animation controls'
                : 'Camera sync only; one submission is static'}
          </small>
        </div>
      )}

      {example?.referenceVideos && example.referenceVideos.length > 0 && (
        <section className="explorer-reference-videos" aria-labelledby="explorer-video-title">
          <div className="panel-heading">
            <span>03</span>
            <div>
              <h4 id="explorer-video-title">Reference motion</h4>
              <p>Agent-visible temporal evidence for the selected case</p>
            </div>
          </div>
          <div
            className={`reference-video-grid ${
              example.referenceVideos.length === 1 ? 'single' : ''
            }`}
          >
            {example.referenceVideos.map((video, index) => (
              <VideoSlot
                key={video.src}
                asset={video}
                label={referenceVideoLabel(taskId, index)}
                onOpen={(event) => openFocus(focusItemId('video', video), event)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="native-metrics">
        <div className="native-metrics-intro">
          <span className="micro-label">Native evaluation</span>
          <strong>Read the artifact in its own metric space.</strong>
        </div>
        <dl>
          {nativeMetrics.map((metric) => {
            const value = example?.metrics.find((item) => item.id === metric.id);
            return (
              <div key={metric.id}>
                <dt>{metric.id}</dt>
                <dd>
                  {value ? `${value.value}${value.unit ?? ''}` : '—'}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      {focusIndex !== null && (
        <FocusMode
          items={focusItems}
          index={focusIndex}
          onIndexChange={setFocusIndex}
          onClose={closeFocus}
        />
      )}
    </div>
  );
}
