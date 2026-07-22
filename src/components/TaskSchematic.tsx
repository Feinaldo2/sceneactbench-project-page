import { useState, type CSSProperties, type ReactNode } from 'react';
import { withBase } from '../data/assetPath';
import type { TaskDefinition, TaskId } from '../data/types';

function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <rect className="schematic-paper" x="1" y="1" width="518" height="258" rx="18" />
      <path className="schematic-grid" d="M36 52h448M36 104h448M36 156h448M36 208h448" />
      <path className="schematic-grid" d="M88 28v204M176 28v204M264 28v204M352 28v204M440 28v204" />
      {children}
    </>
  );
}

function LayoutSchematic() {
  return (
    <Frame>
      <path className="schematic-line faint" d="m94 177 144 48 190-74-145-44-189 70Z" />
      <path className="schematic-line faint" d="M94 177V91l189-58 145 41v77M283 33v74" />
      <path className="schematic-fill accent-soft" d="m124 164 67 21 57-22-66-20-58 21Z" />
      <path className="schematic-line accent" d="m124 164 67 21 57-22-66-20-58 21Z" />
      <path className="schematic-fill amber" d="m304 145 52 16 42-17-52-15-42 16Z" />
      <path className="schematic-line amber-line" d="m304 145 52 16 42-17-52-15-42 16Z" />
      <path className="schematic-line accent moving-dash" d="M181 124v-31m0 0-10 12m10-12 10 12" />
      <circle className="schematic-dot" cx="181" cy="124" r="4" />
      <text className="schematic-label" x="118" y="213">Object transforms</text>
      <text className="schematic-label" x="314" y="192">Support + scale</text>
    </Frame>
  );
}

function CameraSchematic() {
  return (
    <Frame>
      <rect className="schematic-fill accent-soft" x="315" y="63" width="128" height="118" rx="8" />
      <rect className="schematic-line accent" x="315" y="63" width="128" height="118" rx="8" />
      <path className="schematic-line accent faint" d="m315 63-107 70 107 48M443 63 208 133l235 48" />
      <path className="schematic-fill navy" d="m119 125 45-25 44 25v48l-44 24-45-24v-48Z" />
      <path className="schematic-line white" d="m119 125 45 25 44-25M164 150v47" />
      <circle className="schematic-fill amber" cx="208" cy="133" r="12" />
      <path className="schematic-line amber-line" d="M192 133h-24m40-16V93" />
      <path className="schematic-line accent moving-dash" d="M250 207c37 23 97 22 137-4" />
      <text className="schematic-label" x="96" y="220">Scene</text>
      <text className="schematic-label" x="189" y="158">Pose</text>
      <text className="schematic-label" x="346" y="202">Target view</text>
    </Frame>
  );
}

function ArticulatedSchematic() {
  return (
    <Frame>
      <path className="schematic-fill navy" d="M113 61h156v148H113z" />
      <path className="schematic-line white" d="M130 80h122v110H130zM191 80v110" />
      <circle className="schematic-fill amber" cx="180" cy="135" r="4" />
      <path className="schematic-line accent moving-dash" d="M288 86c44 13 75 48 80 91" />
      <path className="schematic-line accent" d="m356 167 13 12 9-15" />
      <path className="schematic-fill accent-soft" d="m291 73 91 45v97l-91-25V73Z" />
      <path className="schematic-line accent" d="m291 73 91 45v97l-91-25V73Z" />
      <circle className="schematic-fill amber" cx="306" cy="137" r="4" />
      <path className="schematic-line amber-line" d="M281 59v147" />
      <text className="schematic-label" x="143" y="231">Closed state</text>
      <text className="schematic-label" x="307" y="231">Open state</text>
    </Frame>
  );
}

function ReconstructionSchematic() {
  return (
    <Frame>
      <rect className="schematic-line accent" x="65" y="61" width="122" height="137" rx="9" />
      <path className="schematic-fill accent-soft" d="m78 176 34-55 25 31 16-20 23 44H78Z" />
      <circle className="schematic-fill amber" cx="151" cy="91" r="13" />
      <path className="schematic-line accent moving-dash" d="M210 130h68m-12-10 12 10-12 10" />
      <path className="schematic-line faint" d="m335 61 101 42v95l-101-35V61Z" />
      <path className="schematic-line accent" d="m335 61 53 60 48-18M388 121v62M335 163l53 20 48 15" />
      <circle className="schematic-dot" cx="335" cy="61" r="5" />
      <circle className="schematic-dot" cx="388" cy="121" r="5" />
      <circle className="schematic-dot" cx="436" cy="103" r="5" />
      <circle className="schematic-dot" cx="335" cy="163" r="5" />
      <circle className="schematic-dot" cx="388" cy="183" r="5" />
      <circle className="schematic-dot" cx="436" cy="198" r="5" />
      <text className="schematic-label" x="88" y="223">Visual evidence</text>
      <text className="schematic-label" x="350" y="223">Surface</text>
    </Frame>
  );
}

function DynamicSchematic() {
  return (
    <Frame>
      <path className="schematic-line faint" d="M55 192h410" />
      <path className="schematic-line accent moving-dash" d="M82 165c73-95 136 48 214-36 57-61 103-24 147 5" />
      <circle className="schematic-fill accent pulse-dot" cx="82" cy="165" r="11" />
      <circle className="schematic-fill amber" cx="296" cy="129" r="11" />
      <path className="schematic-fill navy" d="m429 116 24 14-2 28-27 10-20-18 8-27 17-7Z" />
      <path className="schematic-line faint" d="M82 165V73M296 129V73M429 134V73" />
      <rect className="schematic-fill accent-soft" x="58" y="47" width="48" height="26" rx="13" />
      <rect className="schematic-fill accent-soft" x="272" y="47" width="48" height="26" rx="13" />
      <rect className="schematic-fill accent-soft" x="405" y="47" width="48" height="26" rx="13" />
      <text className="schematic-label centered" x="82" y="65">t₀</text>
      <text className="schematic-label centered" x="296" y="65">tₙ</text>
      <text className="schematic-label centered" x="429" y="65">t₁</text>
      <text className="schematic-label" x="62" y="219">Tracked movers across time</text>
    </Frame>
  );
}

const schematics: Record<TaskId, () => ReactNode> = {
  layout: LayoutSchematic,
  camera: CameraSchematic,
  articulated: ArticulatedSchematic,
  reconstruction: ReconstructionSchematic,
  dynamic: DynamicSchematic,
};

const taskImages: Record<TaskId, string> = {
  layout: withBase('assets/paper/task_t1.webp'),
  camera: withBase('assets/paper/task_t3.webp'),
  articulated: withBase('assets/paper/task_t4.webp'),
  reconstruction: withBase('assets/paper/task_t5.webp'),
  dynamic: withBase('assets/paper/task_t6.webp'),
};

export function TaskSchematic({ task }: { task: TaskDefinition }) {
  const [failed, setFailed] = useState(false);
  const Schematic = schematics[task.id];
  if (!failed) {
    return (
      <img
        className="task-schematic task-paper-schematic"
        src={taskImages[task.id]}
        alt={`${task.name} task workflow from benchmark input through hidden evaluation.`}
        width="1743"
        height="619"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <svg
      className="task-schematic"
      viewBox="0 0 520 260"
      role="img"
      aria-label={`${task.name} task schematic`}
      style={{ '--task-accent': task.color.solid } as CSSProperties}
    >
      <Schematic />
    </svg>
  );
}
