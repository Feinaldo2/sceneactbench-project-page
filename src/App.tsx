import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Explorer } from './components/Explorer';
import { ArrowUpRight, CheckIcon, CloseIcon, CopyIcon, MenuIcon } from './components/Icons';
import { InteractiveLeaderboardChart } from './components/InteractiveLeaderboardChart';
import { Leaderboard } from './components/Leaderboard';
import { PaperInsights } from './components/PaperInsights';
import { TaskTabs } from './components/TaskTabs';
import { withBase } from './data/assetPath';
import {
  affiliations,
  authors,
  bibtex,
  links,
} from './data/site';
import { datasetProvenance } from './data/provenance';

const navItems = [
  ['explorer', 'Demos'],
  ['leaderboard', 'Results'],
  ['tasks', 'Tasks'],
  ['citation', 'Citation'],
] as const;

function usePageMotion() {
  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      target?.classList.add('is-visible');
      target?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    let frameId = 0;
    const updateProgress = () => {
      frameId = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      document.documentElement.style.setProperty('--scroll-progress', String(progress));
    };
    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.section'));
    if (reduced || typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }
    sections.forEach((section) => section.classList.add('reveal-ready'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

}

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
  const [activeSection, setActiveSection] = useState('');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

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
      if (window.innerWidth > 1120) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    document.body.style.overflow = 'hidden';
    main?.setAttribute('inert', '');
    footer?.setAttribute('inert', '');

    const links = Array.from(navigationRef.current?.querySelectorAll('a') ?? []);
    links[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable: HTMLElement[] = [...links];
      if (menuButtonRef.current) focusable.push(menuButtonRef.current);
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      if (currentIndex < 0) return;
      event.preventDefault();
      const step = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + step + focusable.length) % focusable.length;
      focusable[nextIndex]?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute('inert');
      footer?.removeAttribute('inert');
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <a className="brand" href="#top" aria-label="SceneActBench home">
          <img
            className="brand-mark"
            src={withBase('assets/paper/hunyuan-logo.png')}
            width="126"
            height="36"
            alt="Tencent Hunyuan"
          />
        </a>
        <nav
          ref={navigationRef}
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
          ref={menuButtonRef}
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
          <h1 aria-label="SceneActBench: Can Agents Act on the 3D Scenes They See?">
            <span className="title-name">SceneActBench</span>
            <span className="title-question">
              Can Agents Act on the <em>3D Scenes</em> They See?
            </span>
          </h1>
          <div className="author-line" aria-label="Authors">
            {authors.map((author, index) => {
              const startsSecondRow = author.name === 'Haowei Lin';
              const nextStartsSecondRow = authors[index + 1]?.name === 'Haowei Lin';
              return (
                <Fragment key={author.name}>
                  {startsSecondRow && <span className="author-row-break" aria-hidden="true" />}
                  <span>
                    <a href="#citation">{author.name}</a>
                    <sup>
                      {author.affiliations.join(',')}
                      {'equal' in author && author.equal ? ',*' : ''}
                      {'corresponding' in author && author.corresponding ? ',†' : ''}
                    </sup>
                    {index < authors.length - 1 && !nextStartsSecondRow && <i>·</i>}
                  </span>
                </Fragment>
              );
            })}
          </div>
          <div className="affiliation-line">
            {affiliations.map((affiliation) => (
              <span key={affiliation.id}><sup>{affiliation.id}</sup>{affiliation.name}</span>
            ))}
          </div>
          <div className="contribution-line">
            <span>* Equal contribution</span>
            <span>† Corresponding author</span>
          </div>
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
        <div className="provenance-strip" aria-label="Dataset provenance">
          {datasetProvenance.map((source) => (
            <div key={source.name}>
              <strong>{source.name}</strong>
              <span>{source.count}</span>
              <small>{source.detail}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeaderboardSection() {
  const [view, setView] = useState<'overview' | 'table'>('overview');

  return (
    <section className="section section-leaderboard" id="leaderboard">
      <div className="page-shell">
        <SectionHeading
          number="02"
          title="Results"
        >
          Switch between the visual overview and the sortable exact-score table.
        </SectionHeading>
        <div className="results-view-toolbar">
          <div className="results-view-tabs" role="tablist" aria-label="Choose results view">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'overview'}
              aria-controls="results-overview-panel"
              className={view === 'overview' ? 'active' : undefined}
              onClick={() => setView('overview')}
            >
              Visual overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'table'}
              aria-controls="results-table-panel"
              className={view === 'table' ? 'active' : undefined}
              onClick={() => setView('table')}
            >
              Exact scores
            </button>
          </div>
          <span>11 configurations · 5 tasks</span>
        </div>
        {view === 'overview' ? (
          <div className="results-view-panel" id="results-overview-panel" role="tabpanel">
            <InteractiveLeaderboardChart />
          </div>
        ) : (
          <div className="results-view-panel" id="results-table-panel" role="tabpanel">
            <Leaderboard />
          </div>
        )}
      </div>
    </section>
  );
}

function TasksSection() {
  return (
    <section className="section section-tasks" id="tasks">
      <div className="page-shell">
        <SectionHeading
          number="03"
          title="Tasks"
        >
          Select a task to inspect its input, artifact, workflow, and metric.
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
          number="01"
          title="Demos"
        >
          Five task demos per model. Select a card to open its interactive artifact.
        </SectionHeading>
        <Explorer />
      </div>
    </section>
  );
}

function BibtexLine({ line }: { line: string }) {
  const entry = line.match(/^(@\w+)(\{)([^,]+)(,?)$/);
  if (entry) {
    return (
      <>
        <span className="bibtex-entry">{entry[1]}</span>
        <span className="bibtex-punctuation">{entry[2]}</span>
        <span className="bibtex-key">{entry[3]}</span>
        <span className="bibtex-punctuation">{entry[4]}</span>
      </>
    );
  }

  const field = line.match(/^(\s*)([A-Za-z]+)(\s*=\s*)(\{)(.*)(\})(,?)$/);
  if (field) {
    return (
      <>
        {field[1]}
        <span className="bibtex-field">{field[2]}</span>
        <span className="bibtex-operator">{field[3]}</span>
        <span className="bibtex-punctuation">{field[4]}</span>
        <span className="bibtex-value">{field[5]}</span>
        <span className="bibtex-punctuation">{field[6]}{field[7]}</span>
      </>
    );
  }

  return <span className="bibtex-punctuation">{line}</span>;
}

function CitationSection() {
  const [copied, setCopied] = useState(false);
  const bibtexLines = bibtex.split('\n');
  const bibtexDownload = `data:text/plain;charset=utf-8,${encodeURIComponent(bibtex)}`;

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
          number="04"
          title="Citation"
        >
          Copy the publication-ready BibTeX entry or download it as a file.
        </SectionHeading>
        <div className="citation-grid">
          <div className="citation-card">
            <aside className="citation-meta">
              <div className="citation-mark" aria-hidden="true">{'{ }'}</div>
              <span className="micro-label">Publication record</span>
              <h3>SceneActBench</h3>
              <p>2026 · Preprint</p>
              <div className="citation-links">
                <a href={links.paper}>Paper <ArrowUpRight /></a>
                <a href={bibtexDownload} download="sceneactbench.bib">Download .bib</a>
              </div>
            </aside>
            <div className="bibtex-card">
              <div className="bibtex-head">
                <div>
                  <span>BibTeX</span>
                  <strong>Ready to paste</strong>
                </div>
                <button
                  type="button"
                  className={copied ? 'copied' : undefined}
                  onClick={copyCitation}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied' : 'Copy BibTeX'}
                </button>
              </div>
              <pre aria-label="SceneActBench BibTeX citation"><code>{bibtexLines.map((line, index) => (
                  <span className="bibtex-line" key={`${index}-${line}`}>
                    <span className="bibtex-line-number" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span><BibtexLine line={line} /></span>
                  </span>
                ))}</code></pre>
              <span className="sr-only" aria-live="polite">{copied ? 'Citation copied' : ''}</span>
            </div>
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
  usePageMotion();

  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <ExplorerSection />
        <LeaderboardSection />
        <TasksSection />
        <CitationSection />
      </main>
      <PaperInsights />
      <Footer />
    </>
  );
}
