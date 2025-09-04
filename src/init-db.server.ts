import { initializeServer } from './lib/server/init';

// This will run when the server starts
initializeServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
