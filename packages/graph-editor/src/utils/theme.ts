/**
 * Themeable SVG neutrals for the graph editor.
 *
 * SVG presentation attributes can't resolve `var()`, so these are applied via
 * the `style` prop (CSS `fill`/`stroke` fully support custom properties).
 * Each token falls back to the editor's original dark value, so a host that
 * defines nothing renders exactly as before; a theming host overrides the
 * `--fbp-*` custom properties per theme (see the desktop app's `app.css`).
 *
 * Status/type accents (running-yellow, failed-red, port type colors, …) are
 * intentionally NOT themed — they are semantic and stay constant.
 */
export const FBP = {
  /** Node card background (also port-ring "cutout" strokes against it). */
  surface: 'var(--fbp-surface, #18181b)',
  /** Subnet node header (violet identity — softer tint in light themes). */
  subnetHeader: 'var(--fbp-subnet-header, #7c3aed)',
  /** The "subnet" corner label on that header. */
  subnetHeaderLabel: 'var(--fbp-subnet-header-label, rgba(255,255,255,0.6))',
  /** Node header, badges. */
  surfaceRaised: 'var(--fbp-surface-raised, #27272a)',
  /** Default node border. */
  border: 'var(--fbp-border, #3f3f46)',
  /** Primary node text (titles). */
  text: 'var(--fbp-text, #e4e4e7)',
  /** Secondary text (port names, metadata). */
  textMuted: 'var(--fbp-text-muted, #a1a1aa)',
  /** Faint text (descriptions, node name labels, optional ports). */
  textFaint: 'var(--fbp-text-faint, #71717a)',
  /** Default edge stroke. */
  edge: 'var(--fbp-edge, #64748b)',
  /** Edge whose endpoints are idle during execution. */
  edgeIdle: 'var(--fbp-edge-idle, #52525b)',
  /** Node drop shadow. */
  shadow: 'var(--fbp-shadow, rgba(0,0,0,0.3))',
  /** Canvas grid dots. */
  gridDot: 'var(--fbp-grid-dot, #334155)',
} as const;
