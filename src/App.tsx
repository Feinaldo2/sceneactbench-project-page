import { useEffect, useState, type ReactNode } from 'react';
import { AnalysisGallery } from './components/AnalysisGallery';
import { HeroScene, PipelineVisual } from './components/BenchmarkVisuals';
import { Explorer } from './components/Explorer';
import { ArrowUpRight, CheckIcon, CloseIcon, CopyIcon, MenuIcon } from './components/Icons';
import { Leaderboard } from './components/Leaderboard';
import { MetricsGlossary } from './components/MetricsGlossary';
import { TaskTabs } from './components/TaskTabs';
import { withBase } from './data/assetPath';
import {
  affiliations,
  authors,
  bibtex,
  links,
} from './data/site';
import { tasks } from './data/tasks';

const navItems = [
  ['abstract', 'Abstract'],
  ['leaderboard', 'Leaderboard'],
  ['explorer', 'Examples'],
  ['benchmark', 'Benchmark'],
  ['tasks', 'Tasks'],
  ['metrics', 'Metrics'],
  ['analysis', 'Analysis'],
  ['citation', 'Citation'],
] as const;

function SectionHeading({
  index,
  eyebrow,
  title,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="section-index">{index}</div>
      <div className="section-title">
        <span className="micro-label">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <p>{children}</p>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('abstract');

  useEffect(() => {
    const sections = navItems
      .map(([id]) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-16% 0px -70% 0px', threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <a className="brand" href="#top" aria-label="SceneActBench home">
          <img
            className="brand-mark"
            src={withBase('assets/logos/hunyuan-mark.png')}
            width="34"
            height="34"
            alt=""
          />
          <span>SceneAct<span>Bench</span></span>
        </a>
        <nav
          id="mobile-navigation"
          className={open ? 'primary-nav open' : 'primary-nav'}
          aria-label="Page sections"
        >
          {navItems.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeSection === id ? 'active' : undefined}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-resource-links">
          <a className="nav-code-link" href={links.code}>
            Code <ArrowUpRight />
          </a>
          <a className="nav-code-link nav-dataset-link" href={links.dataset}>
            Dataset <ArrowUpRight />
          </a>
        </div>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-grid page-shell">
        <div className="hero-copy">
          <h1 aria-label="SceneActBench: Can Agents Act on the 3D Scenes They See?">
            <span className="title-name">SceneActBench:</span>
            <span className="title-question">
              Can Agents Act on the <em>3D Scenes</em> They See?
            </span>
          </h1>
          <div className="author-line" aria-label="Authors">
            {authors.map((author, index) => (
              <span key={author.name}>
                <a href="#citation">{author.name}</a>
                <sup>
                  {author.affiliations.join(',')}
                  {'equal' in author && author.equal ? ',*' : ''}
                  {'corresponding' in author && author.corresponding ? ',†' : ''}
                </sup>
                {index < authors.length - 1 && <i>·</i>}
              </span>
            ))}
          </div>
          <p className="affiliation-line">
            {affiliations.map((affiliation) => (
              <span key={affiliation.id}><sup>{affiliation.id}</sup>{affiliation.name}</span>
            ))}
            <span>* Equal contribution</span>
            <span>† Corresponding author</span>
          </p>
          <div className="hero-actions">
            <a className="button primary" href={links.paper}>
              Paper <ArrowUpRight />
            </a>
            <a className="button secondary" href={links.code}>
              Code <ArrowUpRight />
            </a>
            <a className="button secondary" href={links.dataset}>
              Dataset <ArrowUpRight />
            </a>
          </div>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}

function AbstractSection() {
  return (
    <section className="section section-abstract" id="abstract">
      <div className="page-shell">
        <SectionHeading
          index="01"
          eyebrow="Paper overview"
          title="Abstract"
        >
          SceneActBench evaluates whether multimodal agents can turn visual evidence into
          executable 3D action.
        </SectionHeading>
        <div className="abstract-copy">
          <p>
            Vision-language model (VLM) agents increasingly use tools to act on 3D scenes rather
            than only describe them. Existing 3D benchmarks score textual responses or
            single-object operations, leaving agent action on complete multi-object 3D scenes
            under-evaluated. We present <strong>SceneActBench</strong>, a benchmark for visually
            conditioned action across five 3D tasks under a unified agent–environment loop. Given
            PNG images or sampled video frames and, where applicable, supplied 3D assets, an agent
            acts on a 3D environment. We evaluate each final output against hidden ground truth
            with task-specific geometric metrics. SceneActBench comprises five tasks built from
            210 source instances, yielding 520 task cases including paired input conditions. Every
            task runs through one fixed agent loop to keep the comparison fair. Across eleven
            proprietary VLM configurations, Overall scores range from 38.6 to 50.2, and no
            configuration succeeds consistently across tasks. We further analyse where and{' '}
            <span className="nowrap">how failures manifest.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function MotivationSection() {
  return (
    <section className="section section-motivation" aria-labelledby="motivation-title">
      <div className="page-shell narrative-block">
        <span className="micro-label">Why action</span>
        <h2 id="motivation-title">Acting makes 3D understanding observable.</h2>
        <div className="narrative-columns">
          <p>
            Acting on a scene, rather than describing it, is a stronger test of an agent&apos;s 3D
            understanding. Text-answer benchmarks do not require the agent to change scene state,
            while existing action benchmarks typically isolate one object or one static edit.
            Practical 3D work instead requires coordinated decisions across complete scenes.
          </p>
          <p>
            SceneActBench therefore evaluates executable outputs. An agent observes images or
            sampled video frames, acts through a shared tool interface, and produces JSON or GLB
            artifacts. The evaluator compares those artifacts with hidden 3D ground truth across
            five tasks, 210 source instances, and 520 task cases.
          </p>
        </div>
      </div>
    </section>
  );
}

function LeaderboardSection() {
  return (
    <section className="section section-leaderboard" id="leaderboard">
      <div className="page-shell">
        <SectionHeading
          index="02"
          eyebrow="Interactive leaderboard"
          title="Leaderboard"
        >
          Overall averages five fixed task scores; the figure explains the aggregate and the table
          preserves every exact score.
        </SectionHeading>
        <Leaderboard />
      </div>
    </section>
  );
}

function BenchmarkSection() {
  return (
    <section className="section section-benchmark" id="benchmark">
      <div className="page-shell">
        <SectionHeading
          index="04"
          eyebrow="Benchmark loop"
          title="Benchmark"
        >
          Visual evidence becomes an executable artifact that is measured after execution.
        </SectionHeading>
        <div className="benchmark-narrative">
          <h3>One fixed loop makes every final artifact auditable.</h3>
          <p>
            Each configuration receives task-defined PNG images or sampled video frames and
            controls headless Blender through the same tool interface. Depending on the task, the
            final output is a camera pose in JSON, a static GLB, a sequence of GLB states, or an
            animated GLB. Every output is scored once against hidden 3D ground truth.
          </p>
          <p>
            The shared harness fixes the tools and interaction budget for each task: 30 steps for
            Layout and Camera, 60 for Articulated, 35 for Reconstruction, and 80 for Dynamic. The
            paired multi-view Layout and photo-realistic Dynamic conditions are reported
            separately and remain outside Overall.
          </p>
        </div>
        <PipelineVisual />
      </div>
    </section>
  );
}

function TasksSection() {
  return (
    <section className="section section-tasks" id="tasks">
      <div className="page-shell">
        <SectionHeading
          index="05"
          eyebrow="Five tasks"
          title="Tasks"
        >
          The suite moves from spatial placement and camera control to part motion, surface
          reconstruction, and time-varying scenes.
        </SectionHeading>
        <TaskTabs />
      </div>
    </section>
  );
}

function MetricsSection() {
  return (
    <section className="section section-metrics" id="metrics">
      <div className="page-shell">
        <SectionHeading
          index="06"
          eyebrow="Metrics glossary"
          title="Metrics"
        >
          SceneActBench keeps each task in its natural metric space, then normalizes only the
          frozen components used by Overall.
        </SectionHeading>
        <MetricsGlossary />
      </div>
    </section>
  );
}

function ExplorerSection() {
  return (
    <section className="section section-explorer" id="explorer">
      <div className="page-shell">
        <SectionHeading
          index="03"
          eyebrow="Model × task explorer"
          title="Examples"
        >
          Each curated example pairs reference evidence with task-native metrics, verification
          renders, structured poses, and interactive geometry.
        </SectionHeading>
        <Explorer />
      </div>
    </section>
  );
}

function AnalysisSection() {
  return (
    <section className="section section-analysis" id="analysis">
      <div className="page-shell">
        <SectionHeading
          index="07"
          eyebrow="Analysis"
          title="Analysis"
        >
          Move from aggregate rankings to input effects, failure stages, budgets, scaling curves,
          and representative action traces.
        </SectionHeading>
        <AnalysisGallery />
      </div>
    </section>
  );
}

function CitationSection() {
  const [copied, setCopied] = useState(false);

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = bibtex;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="section section-citation" id="citation">
      <div className="page-shell">
        <SectionHeading
          index="08"
          eyebrow="Citation"
          title="Citation"
        >
          Cite SceneActBench when using the benchmark, data, or evaluation protocol.
        </SectionHeading>
        <div className="citation-grid">
          <div className="bibtex-card">
            <div className="bibtex-head">
              <div>
                <span className="micro-label">BibTeX</span>
                <strong>Provisional preprint citation</strong>
              </div>
              <button type="button" onClick={copyCitation}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre><code>{bibtex}</code></pre>
            <span className="sr-only" aria-live="polite">{copied ? 'Citation copied' : ''}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-main page-shell">
        <a className="footer-brand" href="#top">
          SceneAct<span>Bench</span>
        </a>
        <p>
          Can agents act on the 3D scenes they see?
          <span>Five tasks. Native metrics. Executable evidence.</span>
        </p>
        <div>
          <a href={links.paper}>Paper</a>
          <a href={links.code}>Code</a>
          <a href={links.dataset}>Dataset</a>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
      <div className="footer-bottom page-shell">
        <span>© 2026 SceneActBench</span>
        <span>Designed for research clarity · Built with accessible web standards</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <AbstractSection />
        <MotivationSection />
        <LeaderboardSection />
        <ExplorerSection />
        <BenchmarkSection />
        <TasksSection />
        <MetricsSection />
        <AnalysisSection />
        <CitationSection />
      </main>
      <Footer />
    </>
  );
}
