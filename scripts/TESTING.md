# Testing Guide

This document provides an overview of the testing setup and how to run tests in the project.

## Test Runner

The project uses a custom test runner (`test-runner.ts`) that provides a unified way to run different types of tests. The test runner supports running specific test categories and provides detailed output.

## Available Test Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm test auth      # Run only authentication tests
npm test db        # Run only database tests
npm test api       # Run only API tests

# Show help
npm test --help
```

## Test Categories

### Authentication Tests (`auth`)
- User registration
- Login/logout
- Session management
- Password reset (if implemented)

### Database Tests (`db`)
- Database connection
- Schema validation
- Query performance
- Data integrity

### API Tests (`api`)
- Endpoint availability
- Request/response validation
- Error handling
- Authentication/authorization

## Writing Tests

1. **Test Utilities**
   - Located in `test-utils.ts`
   - Provides common functionality like test user creation, database helpers, etc.

2. **Adding a New Test**
   - Add a new test method to the appropriate test category in `test-runner.ts`
   - Use the `runTest` helper to run individual tests with proper error handling

3. **Best Practices**
   - Each test should be independent
   - Clean up test data after each test
   - Use descriptive test names
   - Include assertions for both success and error cases

## Debugging Tests

To debug tests, you can use the following approach:

1. Add `debugger` statements in your test code
2. Run tests with the Node.js debugger:
   ```bash
   node --inspect-brk -r ts-node/register scripts/test-runner.ts
   ```
3. Open Chrome DevTools and connect to the debugger

## Test Data

- Test data is automatically cleaned up after each test run
- Use the `clearTestData()` helper if you need to manually clean up
- Test users are created with random usernames to avoid conflicts

## CI/CD Integration

The test runner is designed to work with CI/CD pipelines. It returns proper exit codes:
- `0` - All tests passed
- `1` - One or more tests failed

## Troubleshooting

### Tests are failing
- Check if the development server is running for API tests
- Verify database connection settings
- Look for error messages in the test output

### Test Runner is Slow
- The test runner includes retry logic for flaky tests
- Check for long-running operations in tests
- Consider using `--bail` option to fail fast

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
