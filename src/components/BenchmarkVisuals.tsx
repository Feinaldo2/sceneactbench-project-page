import { withBase } from '../data/assetPath';

export function HeroScene() {
  return (
    <div className="hero-visual" aria-label="SceneActBench five-task scene illustration" role="img">
      <svg viewBox="0 0 680 540" aria-hidden="true">
        <defs>
          <linearGradient id="hero-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7fbfe" />
            <stop offset="1" stopColor="#dcecf8" />
          </linearGradient>
          <linearGradient id="hero-cube" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#2f6bb2" />
            <stop offset="1" stopColor="#173f78" />
          </linearGradient>
          <filter id="hero-shadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#123563" floodOpacity=".15" />
          </filter>
        </defs>
        <path className="hero-orbit orbit-one" d="M80 275c77-190 414-240 531-50 91 148-95 296-306 269C121 471 23 392 80 275Z" />
        <path className="hero-orbit orbit-two" d="M121 167c126-101 393-75 456 86 53 135-88 228-264 208-190-21-294-196-192-294Z" />
        <path className="hero-floor" d="m136 283 240-122 207 106-243 134-204-118Z" fill="url(#hero-floor)" filter="url(#hero-shadow)" />
        <path className="hero-floor-edge" d="m136 283 204 118 243-134M340 401v45l243-137v-42M136 283v43l204 120" />
        <g className="hero-object object-a" filter="url(#hero-shadow)">
          <path d="m224 247 91-45 72 37-92 49-71-41Z" fill="#83d6cd" />
          <path d="m224 247 71 41v92l-71-40v-93Z" fill="#5cbeb3" />
          <path d="m295 288 92-49v91l-92 50v-92Z" fill="#278f86" />
        </g>
        <g className="hero-object object-b" filter="url(#hero-shadow)">
          <path d="m388 226 57-29 48 24-59 31-46-26Z" fill="#f4c67f" />
          <path d="m388 226 46 26v58l-46-26v-58Z" fill="#dfa14f" />
          <path d="m434 252 59-31v58l-59 31v-58Z" fill="#be7830" />
        </g>
        <g className="hero-object object-c">
          <path d="m390 330 58-31 47 25-59 32-46-26Z" fill="url(#hero-cube)" />
          <path d="m390 330 46 26v43l-46-27v-42Z" fill="#173f78" />
          <path d="m436 356 59-32v43l-59 32v-43Z" fill="#112f5a" />
        </g>
        <path className="hero-path" d="M159 302c87 9 126-38 178-23 49 14 64 80 145 68" />
        <circle className="hero-mover" cx="337" cy="279" r="11" />
        <g className="hero-camera">
          <path d="m95 196 40-18 32 19-41 20-31-21Z" />
          <path d="m126 217 14 28 29-14-2-34-41 20Z" />
          <path className="hero-camera-ray" d="m166 208 187 42M166 208l126 129" />
        </g>
        <g className="hero-hinge">
          <path d="M386 238v86" />
          <circle cx="386" cy="238" r="7" />
          <path className="hero-open-arrow" d="M403 225c37 13 52 40 47 71m0 0-9-13m9 13 12-10" />
        </g>
        <g className="hero-cloud">
          <circle cx="548" cy="117" r="5" />
          <circle cx="568" cy="98" r="4" />
          <circle cx="585" cy="127" r="6" />
          <circle cx="524" cy="139" r="4" />
          <circle cx="557" cy="148" r="4" />
          <circle cx="603" cy="151" r="5" />
          <path d="m548 117 20-19 17 29m-61 12 24-22 9 31 28-21 18 24" />
        </g>
      </svg>
      <div className="hero-chip chip-layout"><span>01</span> Layout</div>
      <div className="hero-chip chip-camera"><span>02</span> Camera</div>
      <div className="hero-chip chip-articulated"><span>03</span> Articulated</div>
      <div className="hero-chip chip-reconstruction"><span>04</span> Reconstruction</div>
      <div className="hero-chip chip-dynamic"><span>05</span> Dynamic</div>
      <div className="hero-visual-note">
        <span className="live-dot" />
        executable evaluation
      </div>
    </div>
  );
}

export function PipelineVisual() {
  return (
    <div className="pipeline-visual">
      <figure className="pipeline-paper-figure">
        <img
          src={withBase('assets/paper/pipeline.webp')}
          alt="SceneActBench shared agent-environment loop from task input through Blender actions to hidden evaluation."
          width="1743"
          height="558"
          loading="lazy"
        />
        <figcaption>Shared inspect–act–render loop and task-specific hidden evaluators.</figcaption>
      </figure>
    </div>
  );
}
