import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
    },
  },
});
