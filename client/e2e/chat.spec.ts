import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Chat Application
 *
 * These tests verify the complete user journey from frontend through backend
 * to LMStudio integration. Tests are designed to run against real services
 * when available, with network mocking for error scenarios.
 *
 * Prerequisites:
 * - React dev server running on http://localhost:3000
 * - Backend server running on http://localhost:3001
 * - LMStudio running with configured model (for successful message tests)
 */

test.describe('Chat Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');

    // Wait for app to be fully loaded
    await expect(page.locator('h1')).toContainText('AI Chat');
  });

  /**
   * Test 1: Complete Message Flow
   * Verifies the full user journey: type → send → loading → receive response
   */
  test('should send a message and receive a response', async ({ page }) => {
    // Type a message in the input box
    const textarea = page.getByRole('textbox', { name: 'Message input' });
    await textarea.fill('Hello, how are you?');

    // Verify input has the text
    await expect(textarea).toHaveValue('Hello, how are you?');

    // Click send button
    const sendButton = page.getByRole('button', { name: 'Send message' });
    await sendButton.click();

    // Verify user message appears in chat
    await expect(page.locator('.message-user')).toContainText(
      'Hello, how are you?'
    );

    // Wait for loading state (button text changes to "Sending...")
    await expect(sendButton).toContainText('Sending...');
    await expect(sendButton).toBeDisabled();

    // Wait for response (with longer timeout for LLM)
    // This will timeout if backend/LMStudio are not running
    await expect(page.locator('.message-assistant')).toBeVisible({
      timeout: 30000,
    });

    // Verify response is not empty
    const responseText = await page
      .locator('.message-assistant')
      .last()
      .textContent();
    expect(responseText?.length).toBeGreaterThan(0);

    // Verify loading state cleared
    await expect(sendButton).toContainText('Send');
    await expect(sendButton).toBeDisabled(); // Should be disabled because input is empty

    // Verify input was cleared
    await expect(textarea).toHaveValue('');
  });

  /**
   * Test 2: Multiple Message Conversation
   * Verifies conversation history persists and multiple exchanges work
   */
  test('should handle multiple message exchanges', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'Message input' });
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Send first message
    await textarea.fill('What is 2+2?');
    await sendButton.click();

    // Wait for first response
    await expect(page.locator('.message-assistant').first()).toBeVisible({
      timeout: 30000,
    });

    // Verify we have 2 messages (user + assistant)
    await expect(page.locator('.message-user')).toHaveCount(1);
    await expect(page.locator('.message-assistant')).toHaveCount(1);

    // Send second message
    await textarea.fill('And what is 3+3?');
    await sendButton.click();

    // Wait for second response
    await expect(
      page.locator('.message-assistant').nth(1)
    ).toBeVisible({
      timeout: 30000,
    });

    // Verify we have 4 messages total (2 user + 2 assistant)
    await expect(page.locator('.message-user')).toHaveCount(2);
    await expect(page.locator('.message-assistant')).toHaveCount(2);

    // Verify messages persist in correct order
    const messages = await page.locator('.message-user, .message-assistant').all();
    expect(messages.length).toBe(4);
  });

  /**
   * Test 3: Clear Chat Functionality
   * Verifies clear chat removes all messages and allows new conversation
   */
  test('should clear chat history when clear button clicked', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Message input' });
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Send a message first
    await textarea.fill('Test message');
    await sendButton.click();

    // Wait for response
    await expect(page.locator('.message-assistant')).toBeVisible({
      timeout: 30000,
    });

    // Verify messages exist
    await expect(page.locator('.message-user')).toHaveCount(1);
    await expect(page.locator('.message-assistant')).toHaveCount(1);

    // Click clear chat button (this shows a confirmation dialog)
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      dialog.accept();
    });

    await page.getByRole('button', { name: 'Clear chat history' }).click();

    // Verify all messages cleared
    await expect(page.locator('.message-user')).toHaveCount(0);
    await expect(page.locator('.message-assistant')).toHaveCount(0);

    // Verify can send new message after clearing
    await textarea.fill('New message after clear');
    await sendButton.click();

    // Should see new message
    await expect(page.locator('.message-user')).toContainText(
      'New message after clear'
    );
  });

  /**
   * Test 4: Backend Unavailable Error Handling
   * Verifies graceful error handling when backend is not reachable
   */
  test('should display error when backend is unavailable', async ({
    page,
    context,
  }) => {
    // Mock network failure for API endpoint
    await context.route('**/api/chat', (route) => {
      route.abort('failed');
    });

    const textarea = page.getByRole('textbox', { name: 'Message input' });
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Try to send a message
    await textarea.fill('This should fail');
    await sendButton.click();

    // Verify error message displayed
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText(/network|failed|error/i);

    // Verify app didn't crash (header still visible)
    await expect(page.locator('h1')).toContainText('AI Chat');

    // Verify can still interact with input
    await expect(textarea).toBeEnabled();
  });

  /**
   * Test 5: Loading States During API Call
   * Verifies UI feedback during message sending
   */
  test('should show loading indicators during message send', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Message input' });
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Fill and send message
    await textarea.fill('Testing loading state');
    await sendButton.click();

    // Immediately verify loading state
    await expect(sendButton).toContainText('Sending...', { timeout: 1000 });
    await expect(sendButton).toBeDisabled();

    // Verify input is disabled during loading
    await expect(textarea).toBeDisabled();

    // Wait for loading to complete
    await expect(sendButton).toContainText('Send', { timeout: 30000 });

    // Verify input enabled after completion
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveValue(''); // Input should be cleared
  });

  /**
   * Test 6: Empty Message Validation
   * Verifies that empty/whitespace messages cannot be sent
   */
  test('should prevent sending empty messages', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'Message input' });
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Button should be disabled when empty
    await expect(sendButton).toBeDisabled();

    // Type only whitespace
    await textarea.fill('   ');

    // Button should still be disabled
    await expect(sendButton).toBeDisabled();

    // Verify clicking does nothing
    await sendButton.click({ force: true }); // force because it's disabled
    await expect(page.locator('.message-user')).toHaveCount(0);

    // Type actual content
    await textarea.fill('Real message');

    // Now button should be enabled
    await expect(sendButton).toBeEnabled();
  });

  /**
   * Test 7: Error Message Clearing on Retry
   * Verifies that previous errors are cleared when sending a new message
   */
  test('should clear previous error on new message attempt', async ({
    page,
    context,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Message input' });
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Mock first request to fail
    let requestCount = 0;
    await context.route('**/api/chat', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        // Let subsequent requests through
        route.continue();
      }
    });

    // Send first message (will fail)
    await textarea.fill('First message');
    await sendButton.click();

    // Verify error appears
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Send second message (will succeed)
    await textarea.fill('Second message');
    await sendButton.click();

    // Error should disappear immediately when new message sent
    await expect(errorAlert).not.toBeVisible();

    // Should eventually get response (if backend available)
    // If backend not available, this will timeout but that's expected
  });
});
