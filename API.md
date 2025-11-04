# Web Chat App - API Documentation

**Last Updated**: 2025-11-04
**API Version**: 1.0.0 (MVP)
**Base URL**: `http://localhost:3001`

---

## Overview

The Web Chat App provides a simple REST API for sending messages to Large Language Models (LLMs) via LMStudio. The API handles message processing, LLM communication, and error handling.

**API Characteristics**:
- RESTful HTTP API
- JSON request/response format
- CORS enabled for `localhost:3000`
- No authentication (localhost only)
- Synchronous request/response (no streaming)

---

## Endpoints

### Health Check

Check if the backend server is running and healthy.

**Endpoint**: `GET /health`

**Request**: None

**Response**:
```json
{
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Server is healthy

**Example**:
```bash
curl http://localhost:3001/health
```

---

### Send Chat Message

Send a message to the LLM and receive a response.

**Endpoint**: `POST /api/chat`

**Content-Type**: `application/json`

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "message": "Your message here"
}
```

**Parameters**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `message` | `string` | Yes | User's message to send to LLM | Non-empty string, max ~15KB recommended |

**Example Request**:
```json
{
  "message": "What is the capital of France?"
}
```

#### Response (Success)

**Status Code**: `200 OK`

**Body**:
```json
{
  "reply": "The capital of France is Paris.",
  "model": "llama-2-7b-chat",
  "provider": "lmstudio"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `reply` | `string` | LLM's response to the user's message |
| `model` | `string` | Name of the LLM model used |
| `provider` | `string` | LLM provider (always "lmstudio" in MVP) |

#### Response (Errors)

**400 Bad Request** - Invalid request

```json
{
  "error": "Message is required"
}
```

**Causes**:
- Missing `message` field
- Empty `message` field
- Invalid JSON format

---

**503 Service Unavailable** - LMStudio not available

```json
{
  "error": "LMStudio service is currently unavailable. Please ensure LMStudio is running on localhost:1234."
}
```

**Causes**:
- LMStudio not running
- LMStudio not listening on port 1234
- LMStudio model not loaded

---

**500 Internal Server Error** - LLM request failed

```json
{
  "error": "Failed to get response from LLM. Please try again."
}
```

**Causes**:
- LLM service timeout
- LLM service error
- Unexpected error during processing

---

**504 Gateway Timeout** - Request timeout

```json
{
  "error": "Request timeout. The LLM took too long to respond."
}
```

**Causes**:
- Request exceeded 30-second timeout
- LLM model generating very long response
- LMStudio overloaded

---

## Examples

### Using curl

**Basic Request**:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

**Expected Response**:
```json
{
  "reply": "Hello! I'm functioning well, thank you for asking. How can I assist you today?",
  "model": "llama-2-7b-chat",
  "provider": "lmstudio"
}
```

**With Pretty Printing**:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}' | jq
```

### Using JavaScript (Fetch)

```javascript
async function sendMessage(message) {
  const response = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  return data.reply;
}

// Usage
sendMessage('Hello!')
  .then(reply => console.log('LLM Reply:', reply))
  .catch(error => console.error('Error:', error.message));
```

### Using Python (requests)

```python
import requests

def send_message(message):
    url = 'http://localhost:3001/api/chat'
    headers = {'Content-Type': 'application/json'}
    payload = {'message': message}

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        return data['reply']
    else:
        error = response.json()
        raise Exception(error.get('error', 'Request failed'))

# Usage
try:
    reply = send_message('What is the meaning of life?')
    print(f'LLM Reply: {reply}')
except Exception as e:
    print(f'Error: {e}')
```

### Using the Frontend API Service

The frontend provides a TypeScript API client:

```typescript
import { sendMessage } from './services/api';

try {
  const response = await sendMessage('Hello!');
  console.log('Reply:', response.reply);
  console.log('Model:', response.model);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof ServerError) {
    console.error('Server error:', error.message);
  }
}
```

---

## Error Handling

### Error Types

The API returns different HTTP status codes and error messages based on the failure type:

| Status Code | Error Type | User Action |
|-------------|------------|-------------|
| `400` | Bad Request | Fix request format or provide valid message |
| `500` | Internal Server Error | Retry request |
| `503` | Service Unavailable | Start LMStudio and try again |
| `504` | Gateway Timeout | Wait and retry with shorter message |

### Client-Side Error Handling

**Recommended approach**:
```javascript
async function handleChatRequest(message) {
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      // Parse error from response
      const errorData = await response.json();

      switch (response.status) {
        case 400:
          throw new Error('Invalid message format');
        case 503:
          throw new Error('LMStudio is not running. Please start it and try again.');
        case 504:
          throw new Error('Request timed out. Please try a shorter message.');
        default:
          throw new Error(errorData.error || 'Something went wrong');
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot connect to server. Is the backend running?');
    }
    throw error;
  }
}
```

---

## Request/Response Flow

### Complete Message Flow

1. **Client sends POST request** to `/api/chat` with message
2. **Backend validates request**:
   - Check for `message` field
   - Reject if empty or missing
3. **Backend calls LLM service**:
   - Build JSON request for `llm_call.py`
   - Execute Python subprocess with JSON
   - Wait for response (max 30s timeout)
4. **LLM service processes request**:
   - Route to LMStudio provider
   - Send HTTP request to `localhost:1234`
   - Parse response from LMStudio
5. **Backend returns response**:
   - Extract reply from LLM response
   - Return JSON with reply, model, provider
6. **Client receives response** and displays to user

### Timing Expectations

| Phase | Expected Duration | Notes |
|-------|-------------------|-------|
| Frontend → Backend | <50ms | Local HTTP request |
| Backend → Python subprocess | <100ms | Process spawn overhead |
| Python → LMStudio | 1-30s | Depends on model size and hardware |
| **Total End-to-End** | **1-30s** | Most responses in 2-5s |

---

## Rate Limiting

**Current Status**: No rate limiting implemented

**MVP Considerations**:
- Localhost only (single user)
- One request at a time recommended
- Frontend prevents concurrent requests

**Future Enhancement**:
- Add rate limiting for production deployment
- Implement request queuing for concurrent requests
- Add exponential backoff for retries

---

## CORS Configuration

**Allowed Origin**: `http://localhost:3000` (frontend)

**Allowed Methods**: `GET, POST, OPTIONS`

**Allowed Headers**: `Content-Type`

**Configuration** (in backend `src/index.ts`):
```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

---

## Data Models

### TypeScript Interfaces

**Backend Types** (`server/src/types/api.ts`):
```typescript
interface ChatRequest {
  message: string;
}

interface ChatResponse {
  reply: string;
  model: string;
  provider: string;
}

interface ErrorResponse {
  error: string;
}
```

**Frontend Types** (`client/src/types/api.ts`):
```typescript
interface ChatRequest {
  message: string;
}

interface ChatResponse {
  reply: string;
  model: string;
  provider: string;
}
```

---

## Authentication & Security

### Current State (MVP)

- **No authentication**: Localhost only, single user
- **No authorization**: All requests allowed
- **No API keys**: Not needed for localhost
- **No HTTPS**: HTTP only for local development

**Security Measures in Place**:
- CORS restricted to `localhost:3000`
- Input validation on backend
- Error messages don't expose internals
- Environment variables for configuration

### Production Recommendations

For production deployment, add:

1. **Authentication**:
   - JWT tokens or session-based auth
   - User registration/login system
   - Secure password storage

2. **Authorization**:
   - Role-based access control
   - Request rate limiting per user
   - Usage quotas

3. **Security Hardening**:
   - HTTPS/TLS encryption
   - API key authentication
   - Request signing
   - Input sanitization (XSS, SQL injection)
   - CSRF protection

4. **Monitoring**:
   - Request logging
   - Error tracking
   - Performance monitoring
   - Audit trails

---

## Testing the API

### Manual Testing

**1. Verify Backend is Running**:
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

**2. Test Valid Message**:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

**3. Test Invalid Request (Missing Message)**:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: {"error":"Message is required"}
```

**4. Test LMStudio Down**:
```bash
# Stop LMStudio first
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
# Expected: {"error":"LMStudio service is currently unavailable..."}
```

### Automated Testing

The API has comprehensive automated tests:

**Backend API Tests** (`server/src/__tests__/routes/chat.test.ts`):
- Valid message handling
- Empty message rejection
- LLM service errors
- Response format validation

**Integration Tests** (`server/src/__tests__/integration/chat-api.test.ts`):
- End-to-end API flow
- Error scenarios
- Response time validation

**Run Tests**:
```bash
cd /Users/user/v2.6-test/web-chat-app/server
npm test
```

---

## Troubleshooting

### Issue: "Cannot connect to server"

**Symptom**: `ECONNREFUSED` or `Network Error`

**Solutions**:
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check backend logs for errors
3. Verify port 3001 is not in use: `lsof -i :3001`
4. Restart backend: `cd server && npm run dev`

### Issue: "LMStudio service is currently unavailable"

**Symptom**: `503 Service Unavailable` response

**Solutions**:
1. Start LMStudio application
2. Load a chat model in LMStudio
3. Verify LMStudio is listening on port 1234: `curl http://localhost:1234/v1/models`
4. Check `llm_call.py` path in server `.env` file

### Issue: "Request timeout"

**Symptom**: `504 Gateway Timeout` after 30 seconds

**Solutions**:
1. Try a shorter message
2. Check LMStudio model is appropriate size for hardware
3. Verify LMStudio is not overloaded
4. Increase timeout in server `.env`: `LLM_TIMEOUT_MS=60000`

### Issue: "CORS error in browser"

**Symptom**: `Access-Control-Allow-Origin` error in browser console

**Solutions**:
1. Verify backend CORS is configured for frontend URL
2. Check frontend is running on `localhost:3000`
3. Restart backend after changing CORS configuration
4. Use browser DevTools Network tab to inspect headers

---

## Future API Enhancements

### Planned Features

1. **Streaming Responses** (SSE):
   ```
   POST /api/chat/stream
   Response: text/event-stream
   ```

2. **Conversation History**:
   ```
   POST /api/chat
   Body: {
     "message": "...",
     "conversationId": "uuid",
     "history": [...]
   }
   ```

3. **Model Selection**:
   ```
   POST /api/chat
   Body: {
     "message": "...",
     "model": "llama-2-7b-chat",
     "provider": "lmstudio"
   }
   ```

4. **Conversation Management**:
   ```
   GET /api/conversations
   GET /api/conversations/:id
   DELETE /api/conversations/:id
   ```

5. **User Authentication**:
   ```
   POST /api/auth/login
   POST /api/auth/register
   POST /api/auth/logout
   GET /api/auth/me
   ```

---

## Additional Resources

- **Architecture Guide**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Setup Instructions**: [SETUP.md](SETUP.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Known Limitations**: [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md)

---

**Last Updated**: 2025-11-04
**API Version**: 1.0.0 (MVP)
**Status**: Production Ready (localhost only)
