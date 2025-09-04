import { initializeServer } from '../src/lib/server/init.js';

async function testDbInit() {
  try {
    console.log('Initializing database...');
    await initializeServer();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

testDbInit().catch(console.error);
