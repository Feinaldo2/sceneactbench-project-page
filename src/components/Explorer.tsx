import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
import { ChevronDown, CubeIcon, FileIcon, ImageIcon, PlayIcon } from './Icons';

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
}: {
  asset?: MediaAsset;
  label: string;
  detail: string;
  emptyTitle?: string;
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
      <a
        className="explorer-image-open"
        href={asset.src}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open full-size ${label.toLowerCase()}`}
      >
        <img src={asset.src} alt={asset.alt} loading="eager" onError={() => setFailed(true)} />
        <span className="explorer-open-badge">Open ↗</span>
      </a>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function VideoSlot({ asset, label }: { asset: MediaAsset; label: string }) {
  return (
    <figure className="explorer-video">
      <video controls loop muted playsInline preload="metadata" poster={asset.poster}>
        <source src={asset.src} type="video/mp4" />
      </video>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function ModelViewer({
  asset,
  animated = false,
  label,
}: {
  asset?: MediaAsset;
  animated?: boolean;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

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
      { rootMargin: '180px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [asset]);

  useEffect(() => {
    if (!asset || !inView) return;
    let active = true;
    setStatus('loading');
    void import('@google/model-viewer')
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
    const modelViewer = viewer as HTMLElement & { loaded?: boolean };
    let pollId: number | undefined;
    let timeoutId: number | undefined;
    const stopPolling = () => {
      if (pollId !== undefined) window.clearInterval(pollId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
    const handleLoad = () => {
      stopPolling();
      setStatus('ready');
    };
    const handleError = () => {
      stopPolling();
      setStatus('error');
    };
    const syncLoaded = () => {
      if (!modelViewer.loaded) return false;
      handleLoad();
      return true;
    };
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    if (!syncLoaded()) {
      pollId = window.setInterval(syncLoaded, 100);
      timeoutId = window.setTimeout(() => {
        if (pollId !== undefined) window.clearInterval(pollId);
      }, 30_000);
    }
    return () => {
      stopPolling();
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
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
      {asset && (!registered || status === 'error') && (
        <div className="viewer-fallback">
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
          auto-rotate={!animated}
          autoplay={animated}
          shadow-intensity="0.8"
          exposure="1"
          loading="eager"
          reveal="auto"
        />
      )}
      {asset && status === 'loading' && <span className="viewer-status">Loading geometry…</span>}
      {asset && (
        <a className="viewer-download" href={asset.src} download>
          Download GLB
        </a>
      )}
    </div>
  );
}

function PreviewStrip({
  assets,
  label,
  emptyDetail,
}: {
  assets: MediaAsset[];
  label: string;
  emptyDetail: string;
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
        />
      ))}
    </div>
  );
}

function CameraOutput({ example }: { example?: BenchmarkExample }) {
  const poseJson = example?.task === 'camera' ? example.poseJson : undefined;
  return (
    <div className="camera-output">
      <div className="pose-card">
        <div className="pose-card-head">
          <FileIcon />
          <span>
            <strong>camera_pose.json</strong>
            <small>structured output</small>
          </span>
        </div>
        {poseJson ? (
          <pre>{poseJson}</pre>
        ) : (
          <div className="pose-empty">
            <code>{'{\n  "position": pending,\n  "orientation": pending,\n  "fov": pending\n}'}</code>
            <p>Camera examples use pose JSON and rendered images—not GLB geometry.</p>
          </div>
        )}
      </div>
      <ImageSlot
        asset={example?.outputImages[0]}
        label="Rendered verification"
        emptyTitle="No verification render"
        detail="The pose is still available as structured JSON."
      />
    </div>
  );
}

function TaskOutput({ taskId, example }: { taskId: TaskId; example?: BenchmarkExample }) {
  if (taskId === 'camera') return <CameraOutput example={example} />;

  if (taskId === 'articulated') {
    const articulated = example?.task === 'articulated' ? example : undefined;
    const hasKeyframes = (articulated?.keyframes.length ?? 0) > 0;
    return (
      <div className={`specialized-output articulated-output ${hasKeyframes ? 'has-keyframes' : 'viewer-only'}`}>
        <ModelViewer
          asset={articulated?.animatedGlb}
          animated={articulated?.hasAnimation ?? false}
          label={
            articulated?.hasAnimation === false
              ? 'Submitted static articulated geometry'
              : 'Animated articulated geometry'
          }
        />
        {hasKeyframes && (
          <div>
            <span className="micro-label">Keyframe evidence</span>
            <PreviewStrip
              assets={articulated?.keyframes ?? []}
              label="Keyframe"
              emptyDetail="Rendered keyframe unavailable."
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
            label={
              dynamic?.hasAnimation === false
                ? 'Submitted static base geometry'
                : 'Animated base geometry'
            }
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
            label={
              dynamic?.pairedHasAnimation === false
                ? 'Submitted static paired geometry'
                : 'Animated paired geometry'
            }
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
      <ModelViewer asset={sceneExample?.outputGlb} label="Interactive result" />
      {outputImage && (
        <ImageSlot
          asset={outputImage}
          label="Output render"
          detail="Rendered verification of the submitted scene."
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

export function Explorer() {
  const [taskId, setTaskId] = useState<TaskId>('layout');
  const [modelId, setModelId] = useState(leaderboard[0].id);
  const [manifest, setManifest] = useState<ExamplesManifest>(emptyExamplesManifest);
  const [manifestState, setManifestState] = useState<'loading' | 'ready' | 'error'>('loading');

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
                  : `Schema v${manifest.schemaVersion}`}
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
          <div className={`reference-grid ${referenceImages.length <= 1 ? 'single' : ''}`}>
            {referenceImages.length > 0 ? (
              referenceImages.slice(0, 2).map((asset, index) => (
                <ImageSlot
                  key={asset.src}
                  asset={asset}
                  label={referenceImageLabel(taskId, index)}
                  detail="Reference evidence for this benchmark case."
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
                label={example.referenceGlbAnimated ? 'Animated ground truth' : 'Ground-truth geometry'}
              />
            </div>
          )}
          {example?.referenceVideos && example.referenceVideos.length > 0 && (
            <div className="reference-videos">
              <span className="micro-label">Reference video</span>
              <div className="reference-video-grid">
                {example.referenceVideos.map((video, index) => (
                  <VideoSlot
                    key={video.src}
                    asset={video}
                    label={referenceVideoLabel(taskId, index)}
                  />
                ))}
              </div>
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
          <TaskOutput taskId={taskId} example={example} />
        </section>
      </div>

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
                  <small>
                    {metric.direction === 'higher'
                      ? 'higher is better'
                      : metric.direction === 'lower'
                        ? 'lower is better'
                        : 'diagnostic'}
                  </small>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
