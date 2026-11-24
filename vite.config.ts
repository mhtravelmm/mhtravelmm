/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    // Domain and data tests run in node, as they always have. Only a file named
    // `*.dom.test.tsx` gets a document, so rendering a page never slows the rest.
    environment: 'node',
    environmentMatchGlobs: [['src/**/*.dom.test.tsx', 'jsdom']],
    setupFiles: ['src/test/setupDom.ts'],
  },
});
