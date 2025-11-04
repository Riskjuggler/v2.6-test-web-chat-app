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

**Sprint 1: Foundation Complete** ✅
- Project scaffolding (React + Express + TypeScript)
- Testing infrastructure (Jest + RTL + Supertest, 80% coverage)
- Environment configuration (dotenv, CORS, llm_call.py integration)
- Code quality tools (ESLint + Prettier)
- Comprehensive documentation (README, SETUP, ARCHITECTURE)

**Next: Sprint 2** - Backend API + Frontend Components

## License

MIT
