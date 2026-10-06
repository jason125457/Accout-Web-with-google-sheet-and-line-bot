/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tests assert Taiwan-local month boundaries (AGENTS.md gotcha 1); workers inherit this.
process.env.TZ = 'Asia/Taipei';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the heavy chart library in its own long-lived cacheable chunk
        manualChunks: {
          recharts: ['recharts']
        }
      }
    }
  },
  test: {
    environment: 'node'
  }
});
