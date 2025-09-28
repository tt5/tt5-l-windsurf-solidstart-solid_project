import solid from "vite-plugin-solid"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // @ts-ignore - Vite plugins are properly typed but TypeScript needs help here
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
  },
});