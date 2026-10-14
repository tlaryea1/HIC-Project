import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works at username.github.io/<any-repo-name>/
  base: './',
  server: { port: 5173, open: true },
});
