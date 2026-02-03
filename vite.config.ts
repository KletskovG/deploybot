import { resolve } from 'path';

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
    silent: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
  },
  build: {
    target: 'node22',
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        // Node.js built-ins
        /^node:/,
        'fs',
        'path',
        'url',
        'http',
        'http2',
        'https',
        'stream',
        'crypto',
        'events',
        'util',
        'os',
        'querystring',
        'buffer',
        'child_process',
        'net',
        'tls',
        'dns',
        'dgram',
        'readline',
        'zlib',
        'assert',
        'timers',
        'timers/promises',
        // Dependencies (keep external for Node.js)
        'grammy',
        'fastify',
        '@fastify/cors',
        'dotenv',
      ],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@server': resolve(__dirname, 'src/server'),
      '@bot': resolve(__dirname, 'src/bot'),
      '@config': resolve(__dirname, 'src/config'),
      '@logger': resolve(__dirname, 'src/logger'),
      '@typings': resolve(__dirname, 'src/typings'),
      '@db': resolve(__dirname, 'src/db'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@core': resolve(__dirname, 'src/core'),
    },
  },
});
