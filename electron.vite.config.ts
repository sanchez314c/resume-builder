import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // Main process configuration
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
        },
        external: ['better-sqlite3'],
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@common': resolve(__dirname, 'src/common'),
        '@main': resolve(__dirname, 'src/main'),
      },
    },
  },

  // Preload scripts configuration
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@common': resolve(__dirname, 'src/common'),
      },
    },
  },

  // Renderer process configuration
  renderer: {
    plugins: [react()],
    root: resolve(__dirname, 'src/renderer'),
    server: {
      port: 63263,
      strictPort: true,
      hmr: {
        port: 50026,
      },
    },
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@common': resolve(__dirname, 'src/common'),
        '@renderer': resolve(__dirname, 'src/renderer'),
      },
    },
    css: {
      postcss: './postcss.config.mjs',
    },
  },
});
