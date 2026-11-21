import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI / animation
          'vendor-ui': ['framer-motion', 'gsap', 'lenis'],
          // Radix UI primitives
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          // Data / forms
          'vendor-data': [
            '@tanstack/react-query',
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          // PDF / Canvas utilities — lazy loaded via dynamic import() in OrdersManager
          // so they are excluded from the critical-path bundle automatically.
          // Charts
          'vendor-charts': ['recharts'],
          // Rich-text / markdown
          'vendor-editor': ['react-quill', 'react-markdown'],
        },
      },
    },
  },
});
