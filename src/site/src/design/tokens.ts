// /src/site/src/design/tokens.ts
// Global design tokens — single source of truth for all visual values.
// Accent color is a placeholder; confirm final palette with owner.
export const tokens = {
  color: {
    background:  '#FAFAF8',            // warm off-white
    surface:     '#FFFFFF',
    text:        '#1A1A18',            // near-black
    textMuted:   '#6B6B60',
    accent:      '#D4522A',            // terracotta — TBD with owner
    accentSoft:  '#F0E6DF',
    border:      '#E2E0DA',
    overlay:     'rgba(26,26,24,0.6)',
  },
  font: {
    display: '"Playfair Display", Georgia, serif',  // headings, hero
    body:    '"DM Sans", system-ui, sans-serif',    // body copy
    mono:    '"JetBrains Mono", monospace',         // code, metadata
  },
  space: {
    xs:    '4px',
    sm:    '8px',
    md:    '16px',
    lg:    '24px',
    xl:    '40px',
    '2xl': '64px',
    '3xl': '96px',
  },
  radius: {
    sm:   '4px',
    md:   '8px',
    lg:   '16px',
    full: '9999px',
  },
  motion: {
    fast:      '150ms ease',
    base:      '200ms ease',
    slow:      '400ms ease',
    immersive: '600ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  breakpoint: {
    sm: '375px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export type Tokens = typeof tokens;
