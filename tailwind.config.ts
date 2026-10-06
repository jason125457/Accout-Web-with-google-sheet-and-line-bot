import type { Config } from 'tailwindcss';
import { palette as p } from './src/theme/tokens';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Semantic tokens from src/theme/tokens.ts — use these instead of raw hex values.
      colors: {
        canvas: p.canvas,
        surface: { DEFAULT: p.surface, hover: p.surfaceHover },
        line: p.line,
        ink: { DEFAULT: p.ink, muted: p.inkMuted, subtle: p.inkSubtle },
        primary: { DEFAULT: p.primary, strong: p.primaryStrong, deep: p.primaryDeep, soft: p.primarySoft },
        gold: { DEFAULT: p.gold, strong: p.goldStrong, deep: p.goldDeep },
        night: { DEFAULT: p.night, raised: p.nightRaised, card: p.nightCard, line: p.nightLine },
      },
    },
  },
  plugins: [],
} satisfies Config;
