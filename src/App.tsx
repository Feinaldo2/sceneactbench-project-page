import { useEffect, useState, type ReactNode } from 'react';
import { PipelineVisual } from './components/BenchmarkVisuals';
import { Explorer } from './components/Explorer';
import { ArrowUpRight, CheckIcon, CloseIcon, CopyIcon, MenuIcon } from './components/Icons';
import { Leaderboard } from './components/Leaderboard';
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
  ['tasks', 'Tasks'],
  ['leaderboard', 'Results'],
  ['explorer', 'Examples'],
  ['benchmark', 'Protocol'],
  ['citation', 'Citation'],
] as const;

function SectionHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="section-title">
        <span className="section-number" aria-hidden="true">{number}</span>
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
      <div className="page-shell hero-shell">
        <div className="hero-copy">
          <div className="hero-institution">
            <img
              src={withBase('assets/paper/hunyuan-logo.png')}
              width="170"
              height="48"
              alt="Tencent Hunyuan"
            />
          </div>
          <h1 aria-label="SceneActBench: Can Agents Act on the 3D Scenes They See?">
            <span className="title-name">SceneActBench</span>
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
          <p className="hero-lede">
            An executable benchmark for measuring whether multimodal agents can perceive,
            reason about, and act on complete 3D scenes.
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
        <dl className="hero-facts">
          <div>
            <dt>Tasks</dt>
            <dd>5</dd>
          </div>
          <div>
            <dt>Source instances</dt>
            <dd>210</dd>
          </div>
          <div>
            <dt>Task cases</dt>
            <dd>520</dd>
          </div>
          <div>
            <dt>VLM configurations</dt>
            <dd>11</dd>
          </div>
        </dl>
        <PipelineVisual />
      </div>
    </section>
  );
}

function AbstractSection() {
  return (
    <section className="section section-abstract" id="abstract">
      <div className="page-shell">
        <SectionHeading
          number="01"
          title="Abstract"
        >
          SceneActBench evaluates whether multimodal agents can turn visual evidence into
          executable 3D action.
        </SectionHeading>
        <div className="abstract-layout">
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
          <div className="contribution-list" aria-label="Key benchmark properties">
            <article>
              <span>01</span>
              <div>
                <h3>Executable outputs</h3>
                <p>Agents produce camera poses, scenes, state sequences, and animation—not text.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Controlled protocol</h3>
                <p>Every configuration acts through the same tools and fixed interaction budgets.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Geometric verification</h3>
                <p>Hidden 3D ground truth scores each artifact in its task-native metric space.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function MotivationSection() {
  return (
    <section className="section section-motivation" aria-labelledby="motivation-title">
      <div className="page-shell narrative-block">
        <span className="question-label">Research question</span>
        <h2 id="motivation-title">
          Can an agent that sees a scene act on a 3D environment to match it?
        </h2>
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
          number="03"
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
          number="05"
          title="Benchmark"
        >
          A controlled agent–environment loop makes every result reproducible and auditable.
        </SectionHeading>
        <h3 className="protocol-title">One fixed loop makes every final artifact auditable.</h3>
        <div className="protocol-grid">
          <article>
            <span>01</span>
            <h3>Observe</h3>
            <p>Receive task-defined images or sampled video frames and, where applicable, supplied 3D assets.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Act</h3>
            <p>Inspect, edit, and render through one shared headless Blender tool interface.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Evaluate</h3>
            <p>Score the final JSON or GLB artifact once against hidden 3D ground truth.</p>
          </article>
        </div>
        <div className="budget-panel">
          <div>
            <span className="micro-label">Fixed interaction budgets</span>
            <p>
              Paired multi-view Layout and photo-realistic Dynamic conditions are reported
              separately and remain outside Overall.
            </p>
          </div>
          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <span>{task.name}</span>
                <strong>{task.budget.replace(' agent steps', '')}</strong>
                <small>steps</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TasksSection() {
  return (
    <section className="section section-tasks" id="tasks">
      <div className="page-shell">
        <SectionHeading
          number="02"
          title="Tasks"
        >
          Each task pairs its executable workflow with native metrics; open any metric for its
          definition without expanding the page.
        </SectionHeading>
        <TaskTabs />
      </div>
    </section>
  );
}

function ExplorerSection() {
  return (
    <section className="section section-explorer" id="explorer">
      <div className="page-shell">
        <SectionHeading
          number="04"
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
          number="06"
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
        <span>Research project page · Accessible by design</span>
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
        <TasksSection />
        <LeaderboardSection />
        <ExplorerSection />
        <BenchmarkSection />
        <CitationSection />
      </main>
      <Footer />
    </>
  );
}
