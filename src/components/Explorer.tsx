import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { emptyExamplesManifest, loadExamplesManifest } from '../data/examples';
import { leaderboard } from '../data/leaderboard';
import { tasks } from '../data/tasks';
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
  getFieldOfView?: () => number;
  updateFraming?: () => void;
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

const demoActions: Record<TaskId, string> = {
  layout: 'Compare 3D',
  camera: 'Match view',
  articulated: 'Play motion',
  reconstruction: 'Switch views',
  dynamic: 'Toggle input',
};

type CameraFrame = 'reference' | 'prediction';
type DynamicCondition = 'base' | 'paired';

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
      viewer.cameraTarget = 'auto auto auto';
      viewer.fieldOfView = 'auto';
      viewer.updateFraming?.();
      window.requestAnimationFrame(() => viewer.jumpCameraToGoal?.());
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
          camera-target="auto auto auto"
          field-of-view="auto"
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

function CameraPoseCard({ example }: { example?: BenchmarkExample }) {
  const poseJson = example?.task === 'camera' ? example.poseJson : undefined;
  return (
    <div className="camera-output">
      <details className="pose-card">
        <summary className="pose-card-head">
          <FileIcon />
          <span>
            <strong>camera_pose.json</strong>
            <small>Structured output</small>
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

function TaskSpecificDemo({
  taskId,
  example,
  cameraFrame,
  onCameraFrameChange,
  reconstructionView,
  onReconstructionViewChange,
  dynamicCondition,
  onDynamicConditionChange,
  cameraSyncReady,
  onOpenFocus,
  registerViewer,
}: {
  taskId: TaskId;
  example?: BenchmarkExample;
  cameraFrame: CameraFrame;
  onCameraFrameChange: (frame: CameraFrame) => void;
  reconstructionView: number;
  onReconstructionViewChange: (index: number) => void;
  dynamicCondition: DynamicCondition;
  onDynamicConditionChange: (condition: DynamicCondition) => void;
  cameraSyncReady: boolean;
  onOpenFocus?: FocusOpener;
  registerViewer?: (key: string, viewer: ModelViewerApi | null) => void;
}) {
  if (taskId === 'camera') {
    const camera = example?.task === 'camera' ? example : undefined;
    const reference = camera?.referenceImages[0];
    const prediction = camera?.outputImages[0];
    const selected = cameraFrame === 'reference' ? reference : prediction;
    const angularError = camera?.metrics.find((metric) => metric.id === 'AE');
    const angularErrorValue =
      typeof angularError?.value === 'number'
        ? angularError.value.toFixed(1)
        : angularError?.value;
    return (
      <div className="task-specific-demo camera-demo">
        <div className="task-demo-toolbar">
          <div>
            <span className="micro-label">View matching</span>
            <strong>Reference versus predicted camera</strong>
          </div>
          <div className="task-demo-switch" role="group" aria-label="Choose camera view">
            <button
              type="button"
              className={cameraFrame === 'reference' ? 'active' : undefined}
              aria-pressed={cameraFrame === 'reference'}
              onClick={() => onCameraFrameChange('reference')}
            >
              Reference
            </button>
            <button
              type="button"
              className={cameraFrame === 'prediction' ? 'active' : undefined}
              aria-pressed={cameraFrame === 'prediction'}
              onClick={() => onCameraFrameChange('prediction')}
            >
              Prediction
            </button>
          </div>
        </div>
        <div className="camera-demo-content">
          <ImageSlot
            asset={selected}
            label={cameraFrame === 'reference' ? 'Target view' : 'Predicted view'}
            emptyTitle="Camera view unavailable"
            detail="No rendered view is published for this example."
            loading="eager"
            onOpen={(event) => {
              if (selected) onOpenFocus?.(focusItemId('image', selected), event);
            }}
          />
          <CameraPoseCard example={camera} />
          {cameraFrame === 'prediction' && camera?.notes && (
            <div className="camera-prediction-notice" role="status">
              <span>
                {angularErrorValue
                  ? `AE ${angularErrorValue}${angularError?.unit?.trim() ?? ''}`
                  : 'Camera failure'}
              </span>
              <div>
                <strong>Rendered output — not a loading state</strong>
                <small>{camera.notes}</small>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (taskId === 'articulated') {
    const articulated = example?.task === 'articulated' ? example : undefined;
    const inputVideo = articulated?.referenceVideos?.[0];
    const inputImage = articulated?.referenceImages[0];
    return (
      <div className="task-specific-demo articulated-demo">
        <div className="task-demo-toolbar">
          <div>
            <span className="micro-label">Motion playback</span>
            <strong>Input motion and synchronized 3D result</strong>
          </div>
        </div>
        <div className="temporal-input">
          {inputVideo ? (
            <VideoSlot
              asset={inputVideo}
              label="Agent-visible motion"
              onOpen={(event) => onOpenFocus?.(focusItemId('video', inputVideo), event)}
            />
          ) : (
            <ImageSlot
              asset={inputImage}
              label="Agent-visible motion frame"
              detail="No motion frame is published for this example."
              onOpen={(event) => {
                if (inputImage) onOpenFocus?.(focusItemId('image', inputImage), event);
              }}
            />
          )}
        </div>
        <div className="task-demo-compare">
          <section className="task-demo-pane">
            <div className="panel-heading">
              <span>01</span>
              <div><h4>Ground-truth motion</h4><p>Hidden articulated reference</p></div>
            </div>
            <ModelViewer
              asset={articulated?.referenceGlb}
              animated={articulated?.referenceGlbAnimated ?? false}
              autoplay={false}
              label="Animated ground truth"
              priority="primary"
              onOpen={(event) => {
                if (articulated?.referenceGlb) {
                  onOpenFocus?.(focusItemId('glb', articulated.referenceGlb), event);
                }
              }}
              onViewerReady={(viewer) => registerViewer?.('reference', viewer)}
            />
          </section>
          <section className="task-demo-pane">
            <div className="panel-heading">
              <span>02</span>
              <div><h4>Agent motion</h4><p>Submitted articulated artifact</p></div>
            </div>
            <ModelViewer
              asset={articulated?.animatedGlb}
              animated={articulated?.hasAnimation ?? false}
              autoplay={false}
              label={articulated?.hasAnimation === false ? 'Static submission' : 'Animated submission'}
              priority="primary"
              onOpen={(event) => {
                if (articulated?.animatedGlb) {
                  onOpenFocus?.(focusItemId('glb', articulated.animatedGlb), event);
                }
              }}
              onViewerReady={(viewer) => registerViewer?.('output', viewer)}
            />
          </section>
        </div>
      </div>
    );
  }

  if (taskId === 'reconstruction') {
    const reconstruction = example?.task === 'reconstruction' ? example : undefined;
    const views = reconstruction?.referenceImages ?? [];
    const selectedView = views[Math.min(reconstructionView, Math.max(0, views.length - 1))];
    return (
      <div className="task-specific-demo reconstruction-demo">
        <div className="task-demo-toolbar">
          <div>
            <span className="micro-label">Calibrated views</span>
            <strong>Switch input view, then inspect recovered geometry</strong>
          </div>
          <div className="task-demo-switch" role="group" aria-label="Choose reconstruction input view">
            {views.map((_, index) => (
              <button
                type="button"
                key={index}
                className={reconstructionView === index ? 'active' : undefined}
                aria-label={`Input view ${index + 1}`}
                aria-pressed={reconstructionView === index}
                onClick={() => onReconstructionViewChange(index)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
        <div className="reconstruction-input">
          <ImageSlot
            asset={selectedView}
            label={`Calibrated input ${Math.min(reconstructionView + 1, Math.max(1, views.length))}`}
            detail="No calibrated input view is published for this example."
            loading="eager"
            onOpen={(event) => {
              if (selectedView) onOpenFocus?.(focusItemId('image', selectedView), event);
            }}
          />
        </div>
        <div className="task-demo-compare">
          <section className="task-demo-pane">
            <div className="panel-heading">
              <span>01</span>
              <div><h4>Ground-truth scene</h4><p>Hidden reconstruction target</p></div>
            </div>
            <ModelViewer
              asset={reconstruction?.referenceGlb}
              label="Ground-truth geometry"
              priority="primary"
              onOpen={(event) => {
                if (reconstruction?.referenceGlb) {
                  onOpenFocus?.(focusItemId('glb', reconstruction.referenceGlb), event);
                }
              }}
              onViewerReady={(viewer) => registerViewer?.('reference', viewer)}
            />
          </section>
          <section className="task-demo-pane">
            <div className="panel-heading">
              <span>02</span>
              <div><h4>Reconstructed scene</h4><p>Agent-produced geometry</p></div>
            </div>
            <ModelViewer
              asset={reconstruction?.outputGlb}
              label="Reconstructed geometry"
              priority="primary"
              onOpen={(event) => {
                if (reconstruction?.outputGlb) {
                  onOpenFocus?.(focusItemId('glb', reconstruction.outputGlb), event);
                }
              }}
              onViewerReady={(viewer) => registerViewer?.('output', viewer)}
            />
          </section>
        </div>
      </div>
    );
  }

  if (taskId === 'dynamic') {
    const dynamic = example?.task === 'dynamic' ? example : undefined;
    const paired = dynamicCondition === 'paired';
    const inputVideo = dynamic?.referenceVideos?.[paired ? 1 : 0];
    const inputImage = dynamic?.referenceImages[paired ? 1 : 0];
    const output = paired ? dynamic?.pairedAnimatedGlb : dynamic?.animatedGlb;
    const outputAnimated = paired ? dynamic?.pairedHasAnimation : dynamic?.hasAnimation;
    return (
      <div className="task-specific-demo dynamic-demo">
        <div className="task-demo-toolbar">
          <div>
            <span className="micro-label">Input condition</span>
            <strong>Compare one matched condition at a time</strong>
          </div>
          <div className="task-demo-switch" role="group" aria-label="Choose dynamic input condition">
            <button
              type="button"
              className={!paired ? 'active' : undefined}
              aria-pressed={!paired}
              onClick={() => onDynamicConditionChange('base')}
            >
              Low-poly
            </button>
            <button
              type="button"
              className={paired ? 'active' : undefined}
              aria-pressed={paired}
              onClick={() => onDynamicConditionChange('paired')}
            >
              Photo-real
            </button>
          </div>
        </div>
        <div className="temporal-input">
          {inputVideo ? (
            <VideoSlot
              asset={inputVideo}
              label={paired ? 'Photo-realistic input' : 'Low-poly input'}
              onOpen={(event) => onOpenFocus?.(focusItemId('video', inputVideo), event)}
            />
          ) : (
            <ImageSlot
              asset={inputImage}
              label={paired ? 'Photo-realistic input' : 'Low-poly input'}
              detail="No dynamic input preview is published for this example."
              onOpen={(event) => {
                if (inputImage) onOpenFocus?.(focusItemId('image', inputImage), event);
              }}
            />
          )}
        </div>
        <div className="task-demo-compare">
          <section className="task-demo-pane">
            <div className="panel-heading">
              <span>01</span>
              <div><h4>Ground-truth motion</h4><p>Shared hidden target</p></div>
            </div>
            <ModelViewer
              asset={dynamic?.referenceGlb}
              animated={dynamic?.referenceGlbAnimated ?? false}
              autoplay={false}
              label="Animated ground truth"
              priority="primary"
              onOpen={(event) => {
                if (dynamic?.referenceGlb) {
                  onOpenFocus?.(focusItemId('glb', dynamic.referenceGlb), event);
                }
              }}
              onViewerReady={(viewer) => registerViewer?.('reference', viewer)}
            />
          </section>
          <section className="task-demo-pane">
            <div className="panel-heading">
              <span>02</span>
              <div>
                <h4>{paired ? 'Photo-real result' : 'Low-poly result'}</h4>
                <p>Agent-produced dynamic artifact</p>
              </div>
            </div>
            <ModelViewer
              asset={output}
              animated={outputAnimated ?? false}
              autoplay={false}
              label={outputAnimated === false ? 'Static submission' : 'Animated submission'}
              priority="primary"
              onOpen={(event) => {
                if (output) onOpenFocus?.(focusItemId('glb', output), event);
              }}
              onViewerReady={(viewer) =>
                registerViewer?.(paired ? 'output-paired' : 'output-base', viewer)
              }
            />
          </section>
        </div>
      </div>
    );
  }

  const layout = example?.task === 'layout' ? example : undefined;
  const input = layout?.referenceImages[0];
  return (
    <div className="task-specific-demo layout-demo">
      <div className="task-demo-toolbar">
        <div>
          <span className="micro-label">Spatial comparison</span>
          <strong>Inspect the input, then compare linked 3D scenes</strong>
        </div>
        <span className={cameraSyncReady ? 'sync-status ready' : 'sync-status'}>
          {cameraSyncReady ? '3D views linked' : 'Loading 3D views'}
        </span>
      </div>
      <div className="layout-input">
        <ImageSlot
          asset={input}
          label="Agent-visible room"
          detail="No room reference is published for this example."
          loading="eager"
          onOpen={(event) => {
            if (input) onOpenFocus?.(focusItemId('image', input), event);
          }}
        />
      </div>
      <div className="task-demo-compare">
        <section className="task-demo-pane">
          <div className="panel-heading">
            <span>01</span>
            <div><h4>Ground-truth layout</h4><p>Hidden target geometry</p></div>
          </div>
          <ModelViewer
            asset={layout?.referenceGlb}
            label="Ground-truth layout"
            priority="primary"
            onOpen={(event) => {
              if (layout?.referenceGlb) {
                onOpenFocus?.(focusItemId('glb', layout.referenceGlb), event);
              }
            }}
            onViewerReady={(viewer) => registerViewer?.('reference', viewer)}
          />
        </section>
        <section className="task-demo-pane">
          <div className="panel-heading">
            <span>02</span>
            <div><h4>Agent layout</h4><p>Submitted scene geometry</p></div>
          </div>
          <ModelViewer
            asset={layout?.outputGlb}
            label="Agent layout"
            priority="primary"
            onOpen={(event) => {
              if (layout?.outputGlb) {
                onOpenFocus?.(focusItemId('glb', layout.outputGlb), event);
              }
            }}
            onViewerReady={(viewer) => registerViewer?.('output', viewer)}
          />
        </section>
      </div>
    </div>
  );
}

function demoPreview(example?: BenchmarkExample): MediaAsset | undefined {
  if (!example) return undefined;
  if (example.outputImages[0]) return example.outputImages[0];
  const artifact =
    example.task === 'layout' || example.task === 'reconstruction'
      ? example.outputGlb
      : example.task === 'articulated'
        ? example.animatedGlb
        : example.task === 'dynamic'
          ? example.animatedGlb
          : undefined;
  if (artifact?.poster) {
    return { src: artifact.poster, alt: `Preview of the ${example.task} submission.` };
  }
  return example.referenceImages[example.referenceImages.length > 1 ? 1 : 0];
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

  if (example.task === 'layout') {
    add('image', example.referenceImages[0], 'Agent-visible room');
    add('glb', example.referenceGlb, 'Ground-truth layout');
    add('glb', example.outputGlb, 'Agent layout');
  } else if (example.task === 'camera') {
    add('image', example.referenceImages[0], 'Target view');
    add('image', example.outputImages[0], 'Predicted view');
  } else if (example.task === 'articulated') {
    if (example.referenceVideos?.[0]) {
      add('video', example.referenceVideos[0], 'Agent-visible motion');
    } else {
      add('image', example.referenceImages[0], 'Motion input frame');
    }
    add('glb', example.referenceGlb, 'Ground-truth motion', true);
    add('glb', example.animatedGlb, 'Agent motion', example.hasAnimation);
  } else if (example.task === 'reconstruction') {
    example.referenceImages.forEach((asset, index) => {
      add('image', asset, `Calibrated input ${index + 1}`);
    });
    add('glb', example.referenceGlb, 'Ground-truth geometry');
    add('glb', example.outputGlb, 'Reconstructed geometry');
  } else if (example.task === 'dynamic') {
    if (example.referenceVideos?.length) {
      example.referenceVideos.forEach((asset, index) => {
        add('video', asset, index === 0 ? 'Low-poly input' : 'Photo-realistic input');
      });
    } else {
      example.referenceImages.slice(0, 2).forEach((asset, index) => {
        add('image', asset, index === 0 ? 'Low-poly input' : 'Photo-realistic input');
      });
    }
    add('glb', example.referenceGlb, 'Ground-truth motion', true);
    add('glb', example.animatedGlb, 'Low-poly result', example.hasAnimation);
    add('glb', example.pairedAnimatedGlb, 'Photo-realistic result', example.pairedHasAnimation);
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
  const [cameraFrame, setCameraFrame] = useState<CameraFrame>('reference');
  const [reconstructionView, setReconstructionView] = useState(0);
  const [dynamicCondition, setDynamicCondition] = useState<DynamicCondition>('base');
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
  const demoExamples = tasks.map((item) => ({
    task: item,
    example: manifest.examples.find(
      (candidate) => candidate.task === item.id && candidate.modelId === modelId,
    ),
  }));
  const focusItems = useMemo(() => buildFocusItems(example), [example]);

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
    setCameraFrame('reference');
    setReconstructionView(0);
    setDynamicCondition('base');
  }, [modelId, taskId]);

  useEffect(() => {
    setSyncPlaying(false);
    setSyncProgress(0);
  }, [dynamicCondition]);

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
      const fieldOfView = source.getFieldOfView?.();
      if (!orbit || fieldOfView === undefined) return;
      applyingSync = true;
      activeViewers.forEach((viewer) => {
        if (viewer === source) return;
        viewer.cameraOrbit = orbit;
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
          ? dynamicCondition === 'paired'
            ? ['reference', ...(example.pairedHasAnimation ? ['output-paired'] : [])]
            : ['reference', ...(example.hasAnimation ? ['output-base'] : [])]
          : [];
    return keys
      .map((key) => viewers[key])
      .filter((viewer): viewer is ModelViewerApi => Boolean(viewer));
  }, [dynamicCondition, example, viewers]);
  const canSyncPlayback = animatedViewers.length >= 2;
  const hasSyncAnimationPair =
    example?.task === 'articulated'
      ? Boolean(example.referenceGlbAnimated && example.hasAnimation)
      : example?.task === 'dynamic'
        ? Boolean(
            example.referenceGlbAnimated &&
              (dynamicCondition === 'paired' ? example.pairedHasAnimation : example.hasAnimation),
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
      <div className="demo-gallery-head">
        <label className="model-select">
          <span className="control-label">Configuration</span>
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
      </div>

      <div className="demo-grid" role="group" aria-label="Choose explorer task">
        {demoExamples.map(({ task: demoTask, example: demoExample }) => {
          const preview = demoPreview(demoExample);
          const active = demoTask.id === taskId;
          return (
            <button
              className={active ? 'demo-card active' : 'demo-card'}
              type="button"
              key={demoTask.id}
              aria-label={demoTask.name}
              aria-pressed={active}
              onClick={() => setTaskId(demoTask.id)}
              style={{ '--demo-color': demoTask.color.solid } as React.CSSProperties}
            >
              <span className="demo-card-cover">
                {preview ? (
                  <img src={preview.src} alt="" />
                ) : (
                  <span className="demo-card-placeholder"><CubeIcon /></span>
                )}
                <span className="demo-card-index">{demoTask.index}</span>
                <span className="demo-card-open">
                  {active ? 'Selected' : demoActions[demoTask.id]}
                </span>
              </span>
              <span className="demo-card-body">
                <strong>{demoTask.name}</strong>
                <small>{demoExample?.sourceInstance.split(' · ')[0] ?? 'Demo unavailable'}</small>
                <span className="demo-card-metrics">
                  {(demoExample?.metrics ?? []).slice(0, 2).map((item) => (
                    <span key={item.id}>
                      {item.id} <b>{item.value}{item.unit ?? ''}</b>
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <span className="sr-only" aria-live="polite">
        {manifestState === 'loading'
          ? 'Loading examples'
          : manifestState === 'error'
            ? 'Example data could not be loaded'
            : `Examples ready · Schema v${manifest.schemaVersion}`}
      </span>

      <TaskSpecificDemo
        taskId={taskId}
        example={example}
        cameraFrame={cameraFrame}
        onCameraFrameChange={setCameraFrame}
        reconstructionView={reconstructionView}
        onReconstructionViewChange={setReconstructionView}
        dynamicCondition={dynamicCondition}
        onDynamicConditionChange={setDynamicCondition}
        cameraSyncReady={cameraSyncReady}
        onOpenFocus={openFocus}
        registerViewer={registerViewer}
      />

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
