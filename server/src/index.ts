/**
 * Web Chat App - Express Backend Server
 *
 * This server provides a REST API for the chat frontend, handling:
 * - CORS configuration for localhost:3000 frontend
 * - JSON request/response parsing
 * - Health check endpoint for monitoring
 * - Future: Chat API routes that call llm_call.py subprocess
 *
 * Environment Variables (see .env):
 * - PORT: Server port (default: 3001)
 * - CORS_ORIGIN: Allowed frontend origin (default: http://localhost:3000)
 * - LLM_CLI_PATH: Path to llm_call.py script
 * - PYTHON_PATH: Python executable (default: python3)
 * - LLM_TIMEOUT_MS: Subprocess timeout (default: 30000)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

/**
 * CORS Configuration
 * Allows frontend (localhost:3000) to make requests to backend (localhost:3001)
 * Enables credentials for potential future authentication
 * Supports standard HTTP methods for REST API
 */
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Parse JSON request bodies
app.use(express.json());

/**
 * Health Check Endpoint
 * Returns 200 OK if server is running
 * Used for monitoring and startup verification
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export app for testing
export { app };

/**
 * Start Server
 * Only starts HTTP server when not in test environment
 * Tests import app directly without starting server
 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`CORS enabled for: ${CORS_ORIGIN}`);
  });
}
