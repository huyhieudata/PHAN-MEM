import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
// base './' + single-file bundle => dist/index.html works offline via file://
export default defineConfig({ base: './', plugins: [react(), viteSingleFile()] });
