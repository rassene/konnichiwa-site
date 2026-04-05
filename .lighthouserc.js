// Lighthouse CI configuration.
// Runs against the static Astro build served locally by @lhci/cli's built-in server.
// Thresholds: Performance ≥ 90, Accessibility ≥ 95 (spec §7 + WCAG 2.1 AA).
/** @type {import('@lhci/cli').LhciConfig} */
module.exports = {
  ci: {
    collect: {
      // Serve the Astro static output directly — no external server required.
      staticDistDir: './src/site/dist',
      // Routes to audit. Lighthouse CI prefixes these with http://localhost:<port>.
      url: [
        '/',
        '/projects',
        '/resume',
        '/reach-out',
        '/readings',
        '/musings',
        '/links',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance':    ['warn',  { minScore: 0.9 }],
        'categories:accessibility':  ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn',  { minScore: 0.9 }],
        'categories:seo':            ['warn',  { minScore: 0.9 }],
        // Core Web Vitals thresholds (spec §7)
        'first-contentful-paint':    ['warn',  { maxNumericValue: 1500 }],
        'largest-contentful-paint':  ['warn',  { maxNumericValue: 2500 }],
        'cumulative-layout-shift':   ['warn',  { maxNumericValue: 0.1 }],
        'total-blocking-time':       ['warn',  { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
