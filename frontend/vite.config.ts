import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const target = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/media': target,
      '/socket.io': { target, ws: true },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
