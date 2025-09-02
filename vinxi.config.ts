import { defineConfig } from "vinxi/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solid({
      ssr: true,
    }),
  ],
  ssr: {
    // Mark Node.js built-in modules as external
    noExternal: true,
  },
  // Configure how modules are resolved
  resolve: {
    alias: {
      // Map the ~ alias to the src directory
      '~': '/src',
      // Ensure all database-related code is treated as external in the browser
      './db': './src/lib/server/db',
      'sqlite3': 'unenv/runtime/node/empty',
      'fs': 'unenv/runtime/node/empty',
      'path': 'unenv/runtime/node/empty',
      'util': 'unenv/runtime/node/empty'
    }
  },
  // Configure dependencies optimization
  optimizeDeps: {
    // Force Vite to pre-bundle these dependencies
    include: ['solid-js', '@solidjs/start/server'],
    // Don't try to optimize Node.js built-ins
    exclude: ['fs', 'path', 'sqlite3']
  },
  // Suppress source map warnings for sqlite
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'sqlite3'],
      onwarn(warning, warn) {
        // Suppress source map warnings for sqlite
        if (warning.code === 'SOURCEMAP_ERROR' && warning.id?.includes('node_modules/sqlite')) {
          return;
        }
        // Suppress warnings about Node.js built-ins
        if (warning.code === 'UNRESOLVED_IMPORT' && 
            ['fs', 'path', 'sqlite3'].some(mod => warning.message.includes(`'${mod}'`))) {
          return;
        }
        warn(warning);
      }
    }
  }
});
