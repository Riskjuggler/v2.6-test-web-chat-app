# Web Chat App - Technical Architecture

## Overview

The Web Chat App is a localhost web application that provides a chat interface for interacting with Large Language Models (LLMs) via LMStudio. The architecture follows a clean client-server pattern with TypeScript throughout.

## System Architecture

```
┌─────────────────────────────────────────┐
│   Browser (localhost:3000)              │
│  ┌──────────────────────────────────┐   │
│  │   React Frontend                 │   │
│  │   - TypeScript                   │   │
│  │   - Components (Chat UI)         │   │
│  │   - State Management             │   │
│  │   - API Client (Axios)           │   │
│  └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTP POST /api/chat
                   │ {message: "..."}
                   ▼
┌─────────────────────────────────────────┐
│   Express Backend (localhost:3001)      │
│  ┌──────────────────────────────────┐   │
│  │   TypeScript Server              │   │
│  │   - Express + CORS               │   │
│  │   - Chat API Routes              │   │
│  │   - LLM Service                  │   │
│  └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
                   │ subprocess.exec()
                   │ python3 llm_call.py
                   ▼
┌─────────────────────────────────────────┐
│   llm_caller_cli (subprocess)           │
│   ../forwork/modules/llm_caller_cli/    │
│  ┌──────────────────────────────────┐   │
│  │   llm_call.py                    │   │
│  │   - JSON request/response        │   │
│  │   - Provider routing             │   │
│  └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTP to localhost:1234
                   ▼
┌─────────────────────────────────────────┐
│   LMStudio (localhost:1234)             │
│   - Local LLM server                    │
│   - Model loaded in memory              │
│   - OpenAI-compatible API               │
└─────────────────────────────────────────┘
```

## Technology Stack

### Frontend (client/)
- **React** 18+ - UI framework
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Create React App** - Build tooling
- **Jest + React Testing Library** - Testing

### Backend (server/)
- **Node.js** 18+ - Runtime
- **Express** 5.x - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin support
- **dotenv** - Environment configuration
- **Jest + Supertest** - Testing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **ts-node** - TypeScript execution
- **nodemon** - Hot reload

### External Dependencies
- **LMStudio** - Local LLM server
- **llm_caller_cli** - LLM integration module
- **Python 3** - For llm_call.py subprocess

## Component Architecture

### Frontend Components (Future)

```
src/
├── components/
│   ├── ChatWindow.tsx      # Message display container
│   ├── Message.tsx         # Individual message component
│   ├── InputBox.tsx        # User input with send button
│   └── Header.tsx          # App header with clear button
├── services/
│   └── api.ts              # Backend API client
├── types/
│   └── chat.ts             # TypeScript interfaces
└── App.tsx                 # Main application
```

### Backend Services

```
src/
├── routes/
│   └── chat.ts             # POST /api/chat endpoint
├── services/
│   └── llm.ts              # LLM subprocess wrapper
├── types/
│   └── api.ts              # Request/response types
└── index.ts                # Express server setup
```

## Data Flow

### Message Flow (User → LLM → User)

1. **User Input**
   - User types message in `InputBox` component
   - Click Send or press Enter

2. **Frontend Processing**
   - App.tsx adds user message to state
   - Displays in ChatWindow
   - Sets loading state
   - Calls API client: `api.sendMessage(message)`

3. **API Request**
   - Axios POST to `http://localhost:3001/api/chat`
   - Body: `{ message: "user's message" }`
   - Headers: `Content-Type: application/json`

4. **Backend Processing**
   - Express receives request at `/api/chat` route
   - Validates message field
   - Calls `llm.ts` service: `callLLM(message)`

5. **LLM Service (subprocess)**
   - Builds JSON request:
     ```json
     {
       "provider": "lmstudio",
       "messages": [{"role": "user", "content": "..."}]
     }
     ```
   - Executes subprocess:
     ```bash
     python3 llm_call.py --request-json '{...}'
     ```
   - Waits for response (max 30s timeout)

6. **llm_caller_cli Processing**
   - Parses JSON request
   - Routes to LMStudio provider
   - HTTP POST to `localhost:1234/v1/chat/completions`
   - Returns JSON response on stdout

7. **Backend Response**
   - Parses subprocess stdout
   - Extracts message content
   - Returns to frontend:
     ```json
     {
       "reply": "LLM response...",
       "model": "llama-2-7b",
       "provider": "lmstudio"
     }
     ```

8. **Frontend Display**
   - Receives API response
   - Adds assistant message to state
   - ChatWindow displays new message
   - Clears loading state
   - Auto-scrolls to bottom

## API Contracts

### POST /api/chat

**Request**:
```typescript
{
  message: string;  // Required, non-empty
}
```

**Response (Success - 200)**:
```typescript
{
  reply: string;      // LLM response content
  model: string;      // Model used (e.g., "llama-2-7b")
  provider: string;   // Always "lmstudio" for MVP
}
```

**Response (Error - 400)**:
```typescript
{
  error: string;  // "Message is required"
}
```

**Response (Error - 503)**:
```typescript
{
  error: string;  // "LMStudio unavailable"
}
```

**Response (Error - 500)**:
```typescript
{
  error: string;  // "LLM request failed"
}
```

## Data Models

### Frontend State

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AppState {
  messages: Message[];
  isLoading: boolean;
}
```

### Backend Types

```typescript
interface LLMRequest {
  provider: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  model: string;
  provider: string;
}
```

## Configuration

### Environment Variables (server/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Backend server port |
| CORS_ORIGIN | http://localhost:3000 | Allowed frontend origin |
| LLM_CLI_PATH | ../../../forwork/modules/llm_caller_cli/llm_call.py | Path to llm_call.py |
| PYTHON_PATH | python3 | Python executable |
| LLM_TIMEOUT_MS | 30000 | Subprocess timeout (30s) |

### Port Configuration

- **Frontend**: 3000 (React dev server)
- **Backend**: 3001 (Express server)
- **LMStudio**: 1234 (external, don't change)

## Error Handling

### Frontend Error States
- Network errors → Display "Cannot connect to server"
- Server errors → Display error message from backend
- Loading timeouts → Show retry button

### Backend Error Handling
- Missing message → 400 Bad Request
- LMStudio down → 503 Service Unavailable
- Subprocess timeout → 504 Gateway Timeout
- LLM failure → 500 Internal Server Error

### Subprocess Error Codes

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | Parse and return response |
| 1 | Invalid request | Return 400 error |
| 2 | Provider unavailable | Return 503 error |
| 3 | LLM request failed | Return 500 error |
| 4 | Unexpected error | Return 500 error |

## Security Considerations

### MVP Security
- ✅ CORS configured for localhost only
- ✅ No sensitive data in client code
- ✅ API calls server-side only (no direct LMStudio access from browser)
- ✅ Environment variables in .env (not committed)
- ✅ Input validation on backend

### Production TODO (Future)
- ⚠️ Add authentication
- ⚠️ Add rate limiting
- ⚠️ Add request size limits
- ⚠️ Add input sanitization (XSS prevention)
- ⚠️ Add HTTPS

## Performance Characteristics

### Expected Latency
- **Frontend → Backend**: <50ms
- **Backend → llm_call.py**: <100ms (subprocess overhead)
- **llm_call.py → LMStudio**: Variable (depends on model/hardware)
  - Small models: 1-3s
  - Large models: 5-15s
- **Total first response**: Target <5s

### Scalability Limitations
- **Single user**: MVP designed for localhost only
- **No concurrency**: One request at a time recommended
- **No persistence**: Messages lost on page refresh
- **No state management**: In-memory only

## Testing Strategy

### Frontend Tests
- Component rendering (React Testing Library)
- User interactions (send message, clear chat)
- API integration (mocked Axios)

### Backend Tests
- API endpoint validation (Supertest)
- LLM service (subprocess mocked)
- Error handling for all exit codes

### Integration Tests (Future)
- End-to-end message flow
- LMStudio integration (requires running instance)

## Future Enhancements

### Phase 2 (Persistence)
- Add database (SQLite/PostgreSQL)
- Save conversation history
- Multi-conversation support

### Phase 3 (Advanced Features)
- Streaming responses (SSE)
- Provider selection UI
- Model selection UI
- Conversation export

### Phase 4 (Production)
- Multi-user support
- Authentication
- Deployment guide
- Monitoring/logging

## Development Workflow

### Adding New Routes
1. Create route handler in `server/src/routes/`
2. Add route to `server/src/index.ts`
3. Create tests in `server/src/__tests__/`
4. Update this document

### Adding New Components
1. Create component in `client/src/components/`
2. Add TypeScript interfaces in `client/src/types/`
3. Create tests in `client/src/__tests__/`
4. Import in App.tsx

### Modifying LLM Integration
1. Update `server/src/services/llm.ts`
2. Update tests with new subprocess mocks
3. Test with real LMStudio
4. Document changes here

## Troubleshooting

### Common Issues

**CORS Errors**:
- Check CORS_ORIGIN in .env matches frontend URL
- Verify Express CORS middleware configured
- Check browser console for details

**Subprocess Failures**:
- Verify Python path in .env
- Check llm_call.py path is correct
- Test subprocess manually: `python3 llm_call.py --help`

**LMStudio Connection**:
- Ensure LMStudio running on port 1234
- Check model is loaded
- Test: `curl http://localhost:1234/v1/models`

## References

- **Vision Document**: `.claude/planning/WEB_CHAT_APP_VISION.md`
- **Test Plan**: `.claude/planning/TEST_PLAN.md`
- **Implementation Plan**: `.claude/planning/IMPLEMENTATION_PLAN.md`
- **llm_caller_cli README**: `../forwork/modules/llm_caller_cli/README.md`

---

**Last Updated**: 2025-11-03 (Sprint 1 - WU-005)
**Version**: 1.0.0-MVP
**Status**: Foundation Complete, Implementation Pending
