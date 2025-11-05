# Web Chat App - MVP

A localhost web-based AI chat interface for querying LLMs via LMStudio.

## Features

- Simple chat interface (React + TypeScript)
- Express backend with LLM integration
- LMStudio integration via llm_caller_cli subprocess
- Real-time message flow
- Local-only (no cloud deployment)
- Comprehensive test coverage (80% threshold)
- ESLint + Prettier code quality tools

## Security & Production Status

**Current Version**: v1.0.0-stable
**Status**: ✅ Production Ready (all P0 blockers resolved)

### Recent Security Fixes (2025-11-04)

- ✅ **P0-1 FIXED**: Command injection vulnerability resolved (replaced exec with spawn)
- ✅ **P0-2 FIXED**: window.confirm blocker resolved (custom modal component)

### Known Limitations

See [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for complete list of:
- ✅ Resolved P0 issues (3 total)
- ⚠️ P1 improvements recommended (3 identified)
- 📝 P2 enhancements available (17+ ideas)

### Production Deployment

- **Localhost**: Ready for immediate deployment
- **Public Internet**: Requires additional hardening (rate limiting, monitoring, authentication)
- **Checklist**: See [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

## Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions, troubleshooting, and verification steps
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture, data flow, API contracts, and system design

## Prerequisites

- Node.js v18+
- Python 3.9+
- LMStudio running on localhost:1234 with model loaded
- llm_caller_cli module at `../forwork/modules/llm_caller_cli/`

## Quick Start

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install

# Configure environment (copy and edit if needed)
cd server
cp .env.example .env

# Verify environment setup
npm run verify-env
```

## Running the App

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm start

# Terminal 3: Ensure LMStudio is running with model loaded
```

The app will open at `http://localhost:3000` with backend at `http://localhost:3001`.

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Project Structure

```
web-chat-app/
├── client/          # React frontend (TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── server/          # Express backend (TypeScript)
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   └── package.json
└── README.md
```

## Development

- Frontend runs on `localhost:3000`
- Backend runs on `localhost:3001`
- Hot reload enabled for both

### Code Quality

This project uses ESLint and Prettier for code quality and consistency.

```bash
# Lint code (check for errors)
cd client && npm run lint
cd server && npm run lint

# Format code (auto-fix formatting)
cd client && npm run format
cd server && npm run format

# Check formatting without changes
cd client && npm run format:check
cd server && npm run format:check
```

**Formatting Standards:**
- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100-character line width
- ES5 trailing commas

## Testing

This project uses Jest with React Testing Library (frontend) and Supertest (backend) for comprehensive testing.

### Frontend Tests

```bash
cd client

# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm test -- --watchAll=false

# Generate coverage report (80% threshold)
npm run test:coverage
```

### Backend Tests

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report (80% threshold)
npm run test:coverage
```

### Coverage Requirements

Both frontend and backend enforce coverage thresholds:
- Statements: 80%
- Functions: 80%
- Lines: 80%
- Branches: 75%

## Quick Reference

```bash
# Development
cd server && npm run dev        # Start backend server
cd client && npm start          # Start frontend server

# Testing
cd server && npm test           # Run backend tests
cd client && npm test           # Run frontend tests (interactive)
cd server && npm run test:coverage  # Backend coverage report
cd client && npm run test:coverage  # Frontend coverage report

# Code Quality
cd server && npm run lint       # Check backend code
cd client && npm run lint       # Check frontend code
cd server && npm run format     # Format backend code
cd client && npm run format     # Format frontend code

# Environment
cd server && npm run verify-env # Verify configuration

# Health Check
curl http://localhost:3001/health  # Backend health endpoint
```

## Development Status

**Project Status**: Sprint 4 Complete - MVP Production Ready ✅

**Sprint 1: Foundation** ✅
- Project scaffolding (React + Express + TypeScript)
- Testing infrastructure (Jest + RTL + Supertest)
- Environment configuration (dotenv, CORS, llm_call.py)
- Code quality tools (ESLint + Prettier)

**Sprint 2: Core Implementation** ✅
- Backend /api/chat endpoint with LLM integration
- Frontend components (ChatWindow, Message, InputBox, Header)
- Full message flow implementation
- Comprehensive test suite (169 tests)

**Sprint 3: Integration & E2E Testing** ✅
- Frontend-backend integration verification
- E2E testing with Playwright (7 tests)
- Edge case testing and validation
- Known limitations documented

**Sprint 4: Polish & Release** ✅
- Complete documentation suite
- Production deployment guide
- Known limitations documented
- MVP ready for deployment

**Test Coverage**: 169 tests (85 backend + 84 frontend + 7 E2E)
**Code Quality**: 80%+ coverage on all metrics
**Documentation**: Complete (README, SETUP, ARCHITECTURE, TESTING, API, DEPLOYMENT, KNOWN-LIMITATIONS)

## Comprehensive Documentation

This project includes extensive documentation for developers and operators:

- **[README.md](README.md)** - Project overview and quick start (this file)
- **[SETUP.md](SETUP.md)** - Detailed setup instructions and troubleshooting
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and design decisions
- **[TESTING.md](TESTING.md)** - Complete testing guide (unit, integration, E2E)
- **[API.md](API.md)** - API documentation with examples
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md)** - Known issues and future enhancements
- **[client/E2E-TESTING.md](client/E2E-TESTING.md)** - Playwright E2E testing guide

## Troubleshooting

### Common Development Issues

#### Backend Won't Start

**Symptom**: Error when running `npm run dev` in server directory

**Solutions**:
```bash
# Check if port 3001 is in use
lsof -i :3001
kill -9 <PID>  # If needed

# Verify environment variables
cd server
cat .env
npm run verify-env

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Frontend Won't Start

**Symptom**: Error when running `npm start` in client directory

**Solutions**:
```bash
# Check if port 3000 is in use
lsof -i :3000
kill -9 <PID>  # If needed

# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json node_modules/.cache
npm install
```

#### LMStudio Connection Errors

**Symptom**: "LMStudio service is currently unavailable" in application

**Solutions**:
1. Verify LMStudio is running
2. Check a model is loaded in LMStudio
3. Verify LMStudio server is on port 1234:
   ```bash
   curl http://localhost:1234/v1/models
   ```
4. Check `LLM_CLI_PATH` in `server/.env` points to correct `llm_call.py` location
5. Verify Python 3 is in PATH: `python3 --version`

#### Tests Failing

**Backend Tests**:
```bash
cd server
npm test
# If failing, check:
# 1. All dependencies installed
# 2. TypeScript compiled: npm run build
# 3. No services running on test ports
```

**Frontend Tests**:
```bash
cd client
npm test -- --watchAll=false
# If failing, check:
# 1. All dependencies installed
# 2. No syntax errors in test files
# 3. Mock setup is correct
```

**E2E Tests**:
```bash
cd client
npm run test:e2e
# If failing, check:
# 1. Backend is running: curl http://localhost:3001/health
# 2. LMStudio is running (for some tests)
# 3. Port 3000 is available
```

See [TESTING.md](TESTING.md) for detailed troubleshooting.

#### CORS Errors in Browser

**Symptom**: "Access-Control-Allow-Origin" error in browser console

**Solutions**:
1. Verify backend is running on port 3001
2. Verify frontend is running on port 3000
3. Check `CORS_ORIGIN` in `server/.env` is set to `http://localhost:3000`
4. Restart backend after changing `.env`

#### npm install Fails

**Symptom**: Errors during `npm install`

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Remove existing files
rm -rf node_modules package-lock.json

# Update npm
npm install -g npm@latest

# Try install again
npm install

# If still failing, check Node.js version
node --version  # Should be 18+
```

### Performance Issues

#### Slow LLM Responses

**Expected Behavior**: LLM responses can take 1-30 seconds depending on:
- Model size (7B models faster than 13B+)
- Hardware (GPU much faster than CPU)
- Message complexity

**If consistently slow (>30s)**:
1. Try a smaller/faster model in LMStudio
2. Check system resources (CPU/RAM usage)
3. Verify LMStudio is using GPU if available

#### Application Freezing

**Symptom**: UI becomes unresponsive

**Solutions**:
1. Check browser console for JavaScript errors
2. Check backend logs for errors
3. Verify backend is responding: `curl http://localhost:3001/health`
4. Clear browser cache and reload
5. Try in incognito/private browsing mode

## Known Limitations

The MVP has some intentional limitations and known issues:

1. **Axios mocking issues** in frontend integration tests (documented, workaround exists)
2. **No persistent conversation history** (messages lost on page refresh)
3. **No streaming responses** (wait for complete response)
4. **Single conversation only** (no multi-conversation support)
5. **Localhost only** (no authentication, not production-ready without hardening)

See [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for complete list and recommended solutions.

## Getting Help

**Documentation**:
1. Read [SETUP.md](SETUP.md) for setup issues
2. Read [TESTING.md](TESTING.md) for test issues
3. Read [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for known issues
4. Check git commit history for examples

**Debugging**:
1. Check browser console for frontend errors
2. Check terminal output for backend errors
3. Use browser DevTools Network tab for API issues
4. Run health check: `curl http://localhost:3001/health`

## Contributing

**Development Workflow**:
1. Create a feature branch
2. Make changes and add tests
3. Run linting: `npm run lint`
4. Run tests: `npm test`
5. Run formatting: `npm run format`
6. Commit changes
7. Create pull request

**Code Quality Standards**:
- 80% test coverage required
- ESLint and Prettier configured
- TypeScript strict mode enabled
- All tests must pass before merging

## License

MIT
