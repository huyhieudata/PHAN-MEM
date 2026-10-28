import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' + HashRouter: bản build chạy dưới /PHAN-MEM/ trên GitHub Pages và cả file://.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
