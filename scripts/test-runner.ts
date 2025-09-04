#!/usr/bin/env node
import { 
  TEST_CONFIG, 
  logTestSection, 
  logTestStep, 
  logSuccess, 
  logError,
  logInfo,
  logWarning,
  withDatabase,
  generateTestUsername,
  createTestUser,
  deleteTestUser,
  clearTestData,
  fetchWithRetry
} from './test-utils';

interface TestCategory {
  name: string;
  description: string;
  run: () => Promise<void>;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];
  private currentTest = '';
  private startTime = 0;
  private categories: Record<string, TestCategory> = {};

  constructor() {
    // Register test categories
    this.registerCategory('auth', 'Authentication tests', () => this.runAuthTests());
    this.registerCategory('db', 'Database tests', () => this.runDatabaseTests());
    this.registerCategory('api', 'API tests', () => this.runApiTests());
  }

  private registerCategory(name: string, description: string, run: () => Promise<void>) {
    this.categories[name] = { name, description, run };
  }

  private showHelp() {
    logTestSection('Test Runner Help');
    console.log('\nUsage:');
    console.log('  npm test [category]    Run all tests or a specific category');
    console.log('  npm test --help       Show this help message\n');
    
    console.log('Available categories:');
    Object.values(this.categories).forEach(cat => {
      console.log(`  ${cat.name.padEnd(15)} ${cat.description}`);
    });
    
    console.log('\nExamples:');
    console.log('  npm test             # Run all tests');
    console.log('  npm test auth        # Run only auth tests');
    console.log('  npm test db          # Run only database tests');
    console.log('  npm test api         # Run only API tests');
  }

  async run(category?: string) {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      this.showHelp();
      process.exit(0);
    }

    logTestSection('Starting Test Runner');
    
    try {
      if (category && this.categories[category]) {
        logInfo(`Running only ${category} tests\n`);
        await this.categories[category].run();
      } else if (category) {
        logWarning(`Unknown test category: ${category}`);
        this.showHelp();
        process.exit(1);
      } else {
        // Run all categories
        for (const [name, category] of Object.entries(this.categories)) {
          logInfo(`Running ${name} tests`);
          await category.run();
        }
      }
      
      // Print summary
      this.printSummary();
    } catch (error) {
      logError('Test runner encountered an error:', error);
      process.exit(1);
    }
  }

  private async runTest<T>(
    name: string, 
    testFn: () => Promise<T>
  ): Promise<T | undefined> {
    this.currentTest = name;
    this.startTime = Date.now();
    
    logTestStep(this.results.length + 1, name);
    
    try {
      const result = await testFn();
      const duration = (Date.now() - this.startTime) / 1000;
      
      this.results.push({
        name,
        passed: true,
        duration
      });
      
      logSuccess(`✓ Passed in ${duration.toFixed(2)}s`);
      return result;
    } catch (error) {
      const duration = (Date.now() - this.startTime) / 1000;
      
      this.results.push({
        name,
        passed: false,
        error: error.message,
        duration
      });
      
      logError(`✗ Failed in ${duration.toFixed(2)}s`, error);
      return undefined;
    }
  }

  private async runAuthTests() {
    logTestSection('Authentication Tests');
    
    await this.runTest('User registration', async () => {
      const username = generateTestUsername();
      const user = await createTestUser(username);
      
      if (!user || !user.id) {
        throw new Error('Failed to create test user');
      }
      
      return user;
    });
    
    // Add more auth tests here
  }

  private async runDatabaseTests() {
    logTestSection('Database Tests');
    
    await this.runTest('Database connection', async () => {
      return withDatabase(async (db) => {
        const result = await db.get("SELECT name FROM sqlite_master WHERE type='table'");
        if (!result) {
          throw new Error('Failed to query database');
        }
        return result;
      });
    });
    
    // Add more database tests here
  }

  private async runApiTests() {
    logTestSection('API Tests');
    
    // Example API test
    await this.runTest('Health check endpoint', async () => {
      const response = await fetchWithRetry<{ status: string }>('/api/health');
      
      if (response.status !== 'ok') {
        throw new Error('Health check failed');
      }
      
      return response;
    });
    
    // Add more API tests here
  }

  private printSummary() {
    logTestSection('Test Summary');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\n✅ ${passed} passed | ❌ ${failed} failed | ⏱️  ${totalDuration.toFixed(2)}s`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach((test, i) => {
          console.log(`\n${i + 1}. ${test.name}`);
          console.log(`   ${test.error}`);
        });
    }
    
    console.log('\nTest run completed!');
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run the test runner
async function main() {
  try {
    // Clear any existing test data
    await clearTestData();
    
    // Get category from command line args
    const categoryArg = process.argv[2];
    const category = categoryArg?.startsWith('--') ? undefined : categoryArg;
    
    // Run tests
    const runner = new TestRunner();
    await runner.run(category);
  } catch (error) {
    logError('Unhandled error in test runner:', error);
    process.exit(1);
  }
}

// Execute
main();
