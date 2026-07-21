import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.3 7.6 7.7 4.3 7.7-4.3M12 12v9" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m9 7 8 5-8 5V7Z" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 4" />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
