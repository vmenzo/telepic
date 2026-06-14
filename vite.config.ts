import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  publicDir: false,
  build: {
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
      input: 'client/src/main.tsx',
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'style.css';
          return '[name][extname]';
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/raw': 'http://127.0.0.1:8787',
      '/i': 'http://127.0.0.1:8787'
    }
  }
});
