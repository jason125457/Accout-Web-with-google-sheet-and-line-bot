/**
 * Design tokens — single source of truth for colors.
 *
 * Consumed by tailwind.config.ts (as utility classes like `bg-canvas`, `border-line`,
 * `text-ink-muted`, `bg-gold`) and directly by Recharts, which needs raw hex values.
 * Components should never hard-code hex colors; add a token here instead.
 */

export const palette = {
  // Surfaces
  canvas: '#FBF9F5',      // page background (warm cream)
  surface: '#FFFFFF',     // cards
  surfaceHover: '#F5F2EB',
  line: '#ECE7DE',        // 1px hairline borders on cream

  // Text
  ink: '#0F172A',         // primary text (slate-900)
  inkMuted: '#64748B',    // secondary text, axis labels (slate-500)
  inkSubtle: '#94A3B8',   // captions, minor ticks (slate-400)

  // Brand
  primary: '#0D9488',     // teal-600
  primaryStrong: '#0F766E', // teal-700
  primaryDeep: '#042F2E', // selected bars
  primarySoft: '#2DD4BF', // in-progress month

  // Accents
  gold: '#E5A93C',
  goldStrong: '#D4982E',
  goldDeep: '#B87C1E',
  warning: '#F59E0B',     // averages / large amounts (amber-500)
  danger: '#E11D48',      // over budget (rose-600)

  // Dark sidebar
  night: '#111A18',
  nightRaised: '#182622',
  nightCard: '#14201D',
  nightLine: '#233530',

  // Chart chrome
  grid: '#F1F5F9',        // slate-100
  axis: '#E2E8F0',        // slate-200
  hover: '#F8FAFC',       // slate-50
} as const;

/** Category colors (chart fills and legend dots). */
export const categoryColors: Record<string, string> = {
  '生活': '#0D9488', // teal-600
  '家用': '#2563EB', // blue-600
  '社交': '#EC4899', // pink-500
  '娛樂': '#F59E0B', // amber-500
  '雜支': '#64748B', // slate-500
};

export const categoryFallback = palette.inkSubtle;

export const categoryColor = (category: string): string =>
  categoryColors[category] ?? categoryFallback;
