import React from 'react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBox,
  FiCircle,
  FiCloud,
  FiCode,
  FiCpu,
  FiDatabase,
  FiFile,
  FiFileText,
  FiFilter,
  FiGitMerge,
  FiGlobe,
  FiHash,
  FiImage,
  FiKey,
  FiLayers,
  FiLink,
  FiLock,
  FiMail,
  FiMinus,
  FiMusic,
  FiPlus,
  FiRepeat,
  FiScissors,
  FiSend,
  FiSettings,
  FiShield,
  FiSquare,
  FiTerminal,
  FiToggleLeft,
  FiType,
  FiUserPlus,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { SiGraphql } from 'react-icons/si';
import { TbBraces, TbBrain, TbCursorText, TbFileSearch,TbQuote, TbSparkles, TbWand } from 'react-icons/tb';

interface NodeIconProps {
  icon: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'arrow-right': FiArrowRight,
  'arrow-left': FiArrowLeft,
  settings: FiSettings,
  file: FiFile,
  'file-text': FiFileText,
  'text-cursor': TbCursorText,
  square: FiSquare,
  type: FiType,
  hash: FiHash,
  plus: FiPlus,
  minus: FiMinus,
  x: FiX,
  circle: FiCircle,
  braces: TbBraces,
  zap: FiZap,
  quote: TbQuote,
  link: FiLink,
  graphql: SiGraphql,
  mail: FiMail,
  globe: FiGlobe,
  'git-merge': FiGitMerge,
  scissors: FiScissors,
  shield: FiShield,
  repeat: FiRepeat,
  toggle: FiToggleLeft,
  'toggle-left': FiToggleLeft,
  cpu: FiCpu,
  code: FiCode,
  send: FiSend,
  box: FiBox,
  layers: FiLayers,
  filter: FiFilter,
  database: FiDatabase,
  terminal: FiTerminal,
  key: FiKey,
  'user-plus': FiUserPlus,
  image: FiImage,
  music: FiMusic,
  lock: FiLock,
  cloud: FiCloud,
  wand: TbWand,
  sparkles: TbSparkles,
  brain: TbBrain,
  'file-search': TbFileSearch,
};

export function NodeIcon({ icon, size = 14, className = '' }: NodeIconProps) {
  const IconComponent = iconMap[icon] ?? FiCircle;

  return <IconComponent size={size} className={className} />;
}

export function NodeIconSvg({ icon, size = 11 }: { icon: string; size?: number }) {
  const iconPaths: Record<string, string> = {
    'arrow-right': 'M5 12h14M12 5l7 7-7 7',
    'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    file: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7',
    'file-text': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    'text-cursor': 'M6 4v16 M18 4v16 M6 12h12',
    square: 'M3 3h18v18H3z',
    type: 'M4 7V4h16v3 M9 20h6 M12 4v16',
    hash: 'M4 9h16 M4 15h16 M10 3v18 M14 3v18',
    plus: 'M12 5v14 M5 12h14',
    minus: 'M5 12h14',
    x: 'M18 6L6 18 M6 6l12 12',
    circle: 'M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0',
    braces: 'M8 3H7a2 2 0 00-2 2v5a2 2 0 01-2 2 2 2 0 012 2v5a2 2 0 002 2h1 M16 3h1a2 2 0 012 2v5a2 2 0 002 2 2 2 0 00-2 2v5a2 2 0 01-2 2h-1',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    quote: 'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z',
    link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
    graphql: 'M12 2L2 7v10l10 5 10-5V7L12 2z M12 22V12 M2 7l10 5 10-5',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
    globe: 'M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0 M2 12h20 M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
    'git-merge': 'M18 18m-3 0a3 3 0 106 0 3 3 0 10-6 0 M6 6m-3 0a3 3 0 106 0 3 3 0 10-6 0 M6 21V9a9 9 0 009 9',
    scissors: 'M6 9m-3 0a3 3 0 106 0 3 3 0 10-6 0 M6 15m-3 0a3 3 0 106 0 3 3 0 10-6 0 M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    repeat: 'M17 1l4 4-4 4 M3 11V9a4 4 0 014-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 01-4 4H3',
    toggle: 'M8 5h8a7 7 0 0 1 7 7 7 7 0 0 1-7 7H8A7 7 0 0 1 1 12a7 7 0 0 1 7-7z M8 9a3 3 0 0 0 0 6 3 3 0 0 0 0-6z',
    'toggle-left': 'M8 5h8a7 7 0 0 1 7 7 7 7 0 0 1-7 7H8A7 7 0 0 1 1 12a7 7 0 0 1 7-7z M8 9a3 3 0 0 0 0 6 3 3 0 0 0 0-6z',
    cpu: 'M6 6h12v12H6z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
    code: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
    send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
    box: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
    layers: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    database: 'M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2z M2 6.5C2 8.98 6.48 11 12 11s10-2.02 10-4.5 M2 12c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5',
    terminal: 'M4 17l6-5-6-5 M12 19h8',
    key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    'user-plus': 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M8.5 3a4 4 0 100 8 4 4 0 000-8z M20 8v6 M23 11h-6',
    image: 'M3 3h18v18H3z M8.5 8.5m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0 M21 15l-5-5L5 21',
    music: 'M9 18V5l12-2v13 M6 21a3 3 0 100-6 3 3 0 000 6z M18 19a3 3 0 100-6 3 3 0 000 6z',
    lock: 'M5 11h14v10H5z M7 11V7a5 5 0 0110 0v4',
    cloud: 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z',
    wand: 'M21.64 3.64l-1.28-1.28a1.21 1.21 0 00-1.72 0L2.36 18.64a1.21 1.21 0 000 1.72l1.28 1.28a1.2 1.2 0 001.72 0L21.64 5.36a1.2 1.2 0 000-1.72 M14 7l3 3 M5 6v4 M19 14v4 M10 2v2 M7 8H3 M21 16h-4 M11 3H9',
    sparkles: 'M12 3l1.9 5.7a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-2a2 2 0 001.3-1.3L12 3z M5 3v4 M19 17v4 M3 5h4 M17 19h4',
    brain: 'M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3A2.5 2.5 0 019.5 2z M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0014.5 2z',
    'file-search': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M11.5 12.5a3 3 0 100 6 3 3 0 000-6z M13.6 17.6L15.5 19.5',
  };

  const path = iconPaths[icon] ?? iconPaths['circle'];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--fbp-text-muted, rgba(255,255,255,0.7))' }}
    >
      <path d={path} />
    </svg>
  );
}
