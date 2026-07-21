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
  emptyTitle = 'No published preview',
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
        <img src={asset.src} alt={asset.alt} loading="lazy" onError={() => setFailed(true)} />
        <span className="explorer-open-badge">Open ↗</span>
      </a>
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
  }, [asset, inView]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !registered) return;
    const handleLoad = () => setStatus('ready');
    const handleError = () => setStatus('error');
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [registered]);

  return (
    <div className="model-viewer-frame" ref={containerRef}>
      {!asset && (
        <Placeholder
          icon={animated ? <PlayIcon /> : <CubeIcon />}
          eyebrow={label}
          title={animated ? 'No published animated GLB' : 'No published GLB'}
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
          loading="lazy"
          reveal="interaction"
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
  if (assets.length === 0) {
    return (
      <div className="preview-strip-empty">
        <Placeholder
          icon={<ImageIcon />}
          eyebrow={label}
          title="No published frame strip"
          detail={emptyDetail}
        />
      </div>
    );
  }
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
    return (
      <div className="specialized-output">
        <ModelViewer
          asset={articulated?.animatedGlb}
          animated={articulated?.hasAnimation ?? false}
          label={
            articulated?.hasAnimation === false
              ? 'Submitted static articulated geometry'
              : 'Animated articulated geometry'
          }
        />
        <div>
          <span className="micro-label">Keyframe evidence</span>
          <PreviewStrip
            assets={articulated?.keyframes ?? []}
            label="Keyframe"
            emptyDetail="No rendered keyframe strip is published for this configuration."
          />
        </div>
      </div>
    );
  }

  if (taskId === 'dynamic') {
    const dynamic = example?.task === 'dynamic' ? example : undefined;
    return (
      <div className="specialized-output">
        <ModelViewer
          asset={dynamic?.animatedGlb}
          animated={dynamic?.hasAnimation ?? false}
          label={dynamic?.hasAnimation === false ? 'Submitted static geometry' : 'Animated geometry'}
        />
        <div className="dynamic-previews">
          <div>
            <span className="micro-label">Base condition · low-poly input</span>
            <PreviewStrip
              assets={dynamic?.lowPolyPreviews ?? []}
              label="Low-poly-input output"
              emptyDetail="No output strip is published for the base-condition run."
            />
          </div>
          <div>
            <span className="micro-label">Paired condition · photo-realistic input</span>
            <PreviewStrip
              assets={dynamic?.photorealisticPreviews ?? []}
              label="Photo-realistic-input output"
              emptyDetail="No output strip is published for the paired-condition run."
            />
          </div>
        </div>
      </div>
    );
  }

  const sceneExample =
    example?.task === 'layout' || example?.task === 'reconstruction' ? example : undefined;
  return (
    <div className="scene-output-grid">
      <ModelViewer asset={sceneExample?.outputGlb} label="Interactive result" />
      <ImageSlot
        asset={sceneExample?.outputImages[0]}
        label="Output render"
        emptyTitle="No published output render"
        detail="Inspect the submitted GLB directly in the interactive viewer."
      />
    </div>
  );
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
                  label={index === 0 ? 'Reference view' : 'Context view'}
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
