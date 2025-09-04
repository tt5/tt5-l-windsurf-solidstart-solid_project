import { defineConfig } from "vinxi/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    // This will run our initialization script when the server starts
    setup: 'import "~/init-db.server";',
  },
  plugins: [
    solid({
      ssr: true,
    }),
  ],
  ssr: {
    noExternal: true,
  },
  resolve: {
    alias: {
      '~': '/src',
      './db': './src/lib/server/db',
      'sqlite3': 'unenv/runtime/node/empty',
      'fs': 'unenv/runtime/node/empty',
      'path': 'unenv/runtime/node/empty',
      'util': 'unenv/runtime/node/empty',
      'stream': 'unenv/runtime/node/empty',
      'crypto': 'unenv/runtime/node/empty'
    }
  },
  optimizeDeps: {
    include: ['solid-js', '@solidjs/start/server'],
    exclude: ['fs', 'path', 'sqlite3', 'stream', 'crypto']
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'sqlite3', 'stream', 'crypto'],
      onwarn(warning, warn) {
        if (warning.code === 'SOURCEMAP_ERROR' && warning.id?.includes('node_modules/sqlite')) {
          return;
        }
        if (warning.code === 'UNRESOLVED_IMPORT' && 
            ['fs', 'path', 'sqlite3', 'stream', 'crypto'].some(mod => warning.message.includes(`'${mod}'`))) {
          return;
        }
        warn(warning);
      }
    }
  }
});
