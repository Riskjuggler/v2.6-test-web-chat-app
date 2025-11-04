# End-to-End Testing Guide

This document explains how to run and maintain the E2E test suite for the AI Chat application.

## Overview

The E2E test suite uses [Playwright](https://playwright.dev/) to test complete user journeys from frontend through backend to LMStudio integration. Tests verify the full application stack working together.

## Test Coverage

The suite includes 7 comprehensive tests covering:

1. **Complete Message Flow** - User types message → sends → loading state → receives response
2. **Multiple Message Conversation** - Conversation history persists across multiple exchanges
3. **Clear Chat Functionality** - Clear button removes all messages and allows new conversation
4. **Backend Unavailable Error** - Graceful error handling when backend is not reachable
5. **Loading States** - UI feedback during message sending (button text, disabled states)
6. **Empty Message Validation** - Prevents sending empty or whitespace-only messages
7. **Error Recovery on Retry** - Previous errors clear when sending new message

## Prerequisites

Before running E2E tests, ensure the following services are running:

### Required Services

1. **Backend Server** (http://localhost:3001)
   ```bash
   cd server
   npm start
   ```

2. **Frontend Dev Server** (http://localhost:3000)
   - **Automatically started by Playwright** via `webServer` configuration
   - No manual start needed

### Optional Services

3. **LMStudio** (for tests requiring actual LLM responses)
   - Tests 1, 2, 3, and 7 send real messages and expect LLM responses
   - If LMStudio is not running, these tests will timeout (30s) with clear error messages
   - Tests 4, 5, and 6 use network mocking and don't require LMStudio

## Running Tests

### Headless Mode (CI-ready)

Run all tests in headless mode (no browser UI):

```bash
cd client
npm run test:e2e
```

This mode:
- Runs tests in Chromium browser without UI
- Captures screenshots on failure
- Generates HTML report in `playwright-report/`
- Suitable for CI/CD pipelines

### Headed Mode (Local Development)

Run tests with visible browser for debugging:

```bash
cd client
npm run test:e2e:headed
```

This mode:
- Shows browser window during test execution
- Useful for debugging test failures
- Allows you to see exactly what the test is doing

### Running Specific Tests

Run a single test file:

```bash
npx playwright test e2e/chat.spec.ts
```

Run tests matching a pattern:

```bash
npx playwright test --grep "message flow"
```

Run a single test by line number:

```bash
npx playwright test e2e/chat.spec.ts:29
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test pass/fail status
- Screenshots of failures
- Traces for failed tests (if configured)
- Detailed error messages

## CI Configuration

The Playwright configuration is CI-ready with these settings:

- **Timeout**: 30 seconds per test (accommodates LLM response time)
- **Retries**: 2 retries on CI (configured via `process.env.CI`)
- **Workers**: 1 worker on CI (prevents resource contention)
- **Reporter**: HTML report (can be changed to `github` for GitHub Actions)
- **Screenshots**: Captured on failure only
- **Trace**: Captured on first retry

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Install dependencies
      - run: cd server && npm ci
      - run: cd client && npm ci

      # Install Playwright browsers
      - run: cd client && npx playwright install --with-deps chromium

      # Start backend (in background)
      - run: cd server && npm start &

      # Run E2E tests
      - run: cd client && npm run test:e2e

      # Upload test report on failure
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: client/playwright-report/
```

## Troubleshooting

### Backend Connection Refused

**Error**: `Failed to fetch` or `ECONNREFUSED`

**Solution**: Ensure backend server is running:
```bash
cd server
npm start
```

Verify backend is responding:
```bash
curl http://localhost:3001/health
```

### Frontend Not Starting

**Error**: `webServer did not start`

**Solution**:
1. Check if port 3000 is already in use:
   ```bash
   lsof -i :3000
   ```
2. Kill any process using port 3000:
   ```bash
   kill -9 <PID>
   ```
3. Try running tests again

### LMStudio Timeouts

**Error**: `Timeout 30000ms exceeded` on message tests

**Solution**:
- This is expected if LMStudio is not running
- Tests 1, 2, 3, and 7 require LMStudio for full success
- Tests 4, 5, and 6 will pass without LMStudio

To run with LMStudio:
1. Start LMStudio with a model loaded
2. Verify it's accessible at `http://localhost:1234`
3. Ensure backend can connect to LMStudio
4. Run tests again

### Flaky Tests

**Symptoms**: Tests pass sometimes but fail other times

**Solutions**:
1. **Increase timeout** for slow LLM responses:
   ```typescript
   await expect(element).toBeVisible({ timeout: 60000 });
   ```

2. **Check network conditions**: Slow network can cause timeouts

3. **Review Playwright auto-wait**: Ensure selectors are stable

4. **Run with trace** for debugging:
   ```bash
   npx playwright test --trace on
   ```

## Test Maintenance

### Adding New Tests

1. Add test to `e2e/chat.spec.ts`
2. Follow existing test structure:
   - Clear test name describing behavior
   - JSDoc comment explaining what's being tested
   - Use accessible selectors (roles, labels)
   - Include assertions for visible user feedback
   - Add appropriate timeout for async operations

Example:
```typescript
/**
 * Test 8: Your Feature Description
 * Verifies that [specific behavior works as expected]
 */
test('should demonstrate new feature', async ({ page }) => {
  // Setup
  await page.goto('/');

  // Action
  await page.getByRole('button', { name: 'Your Button' }).click();

  // Assertion
  await expect(page.getByText('Expected Result')).toBeVisible();
});
```

### Updating Selectors

If UI changes break tests, update selectors in `e2e/chat.spec.ts`:

**Prefer** (in order of stability):
1. `getByRole()` - Most stable, accessibility-friendly
2. `getByLabel()` - Good for form inputs
3. `getByText()` - Okay for unique text
4. `getByTestId()` - Requires adding `data-testid` attributes
5. `.locator('.class')` - Last resort, brittle

### Performance Considerations

E2E tests are slower than unit tests:
- **Average test**: 5-10 seconds (with real services)
- **Full suite**: 2-5 minutes (7 tests)
- **With LLM**: Add 10-30s per LLM response

Optimize by:
- Running in parallel (configured in `playwright.config.ts`)
- Using network mocking for error scenarios (no real backend needed)
- Skipping tests that require LMStudio in CI (if unavailable)

## Configuration Reference

Key settings in `playwright.config.ts`:

- `testDir: './e2e'` - Test files location
- `timeout: 30000` - Per-test timeout (30s)
- `fullyParallel: true` - Run tests in parallel
- `retries: 2` (on CI) - Retry flaky tests
- `baseURL: 'http://localhost:3000'` - Frontend URL
- `webServer.command: 'npm start'` - Auto-start frontend

## Best Practices

1. **Test user journeys**, not implementation details
2. **Use accessible selectors** (roles, labels) for stability
3. **Test error states** with network mocking
4. **Keep tests independent** - each test should work alone
5. **Use generous timeouts** for LLM responses (30s+)
6. **Add comments** explaining what each test verifies
7. **Verify visible feedback** - test what users see
8. **Clean up state** - use `beforeEach` for fresh start

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## Support

If you encounter issues not covered in this guide:
1. Check Playwright documentation
2. Review test logs and screenshots in `playwright-report/`
3. Run tests with `--headed` mode to see browser behavior
4. Use `--debug` flag for step-by-step debugging
5. Consult the team for project-specific issues
