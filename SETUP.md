# Web Chat App - Detailed Setup Guide

This guide provides step-by-step instructions for setting up and running the Web Chat App MVP.

## Prerequisites

### Required Software

1. **Node.js** v18.0.0 or higher
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** v9.0.0 or higher (comes with Node.js)
   - Verify: `npm --version`

3. **Python 3** (3.9 or higher)
   - Verify: `python3 --version`

4. **LMStudio** with a loaded model
   - Download: https://lmstudio.ai/
   - Must be running on `localhost:1234`

5. **llm_caller_cli** module
   - Location: `../forwork/modules/llm_caller_cli/`
   - Verify: File exists at `../forwork/modules/llm_caller_cli/llm_call.py`

## Installation Steps

### 1. Clone/Navigate to Project

```bash
cd /path/to/web-chat-app
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

Expected output: ~1345 packages installed

### 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

Expected output: ~130 packages installed

### 4. Configure Environment

```bash
cd server

# Copy example environment file
cp .env.example .env

# Edit .env if needed (default values work for standard setup)
# PORT=3001
# CORS_ORIGIN=http://localhost:3000
# LLM_CLI_PATH=../../../forwork/modules/llm_caller_cli/llm_call.py
# PYTHON_PATH=python3
# LLM_TIMEOUT_MS=30000
```

### 5. Verify Environment Configuration

```bash
cd server
npm run verify-env
```

Expected output:
```
🔍 Environment Configuration Verification
✅ All verification checks passed!
```

If verification fails:
- Check LMStudio is installed
- Verify llm_call.py path is correct
- Ensure Python 3 is in PATH

## Running the Application

### Terminal Setup

You'll need **3 terminal windows**:

**Terminal 1: LMStudio**
1. Open LMStudio application
2. Load a chat model (e.g., Llama 2, Mistral)
3. Start server (should show: Running on localhost:1234)

**Terminal 2: Backend Server**
```bash
cd /path/to/web-chat-app/server
npm run dev
```

Expected output:
```
Server running on http://localhost:3001
```

Verify health endpoint:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

**Terminal 3: Frontend Development Server**
```bash
cd /path/to/web-chat-app/client
npm start
```

Expected output:
```
webpack compiled successfully
```

Browser should automatically open to `http://localhost:3000`

## Verification Checklist

After starting all services, verify:

- [ ] LMStudio shows server running on port 1234
- [ ] Backend responds to health check: `curl http://localhost:3001/health`
- [ ] Frontend loads in browser at http://localhost:3000
- [ ] No console errors in terminal or browser
- [ ] React app displays default UI

## Development Workflow

### Running Tests

**Frontend Tests**:
```bash
cd client
npm test                 # Run tests in watch mode
npm test:coverage        # Run with coverage report
```

**Backend Tests**:
```bash
cd server
npm test                 # Run all tests
npm run test:watch       # Run in watch mode
npm run test:coverage    # Run with coverage
```

### Code Quality

**Linting**:
```bash
# Frontend
cd client
npm run lint

# Backend
cd server
npm run lint
```

**Formatting**:
```bash
# Frontend
cd client
npm run format           # Auto-format all files
npm run format:check     # Check formatting without modifying

# Backend
cd server
npm run format
npm run format:check
```

### Building for Production

**Frontend**:
```bash
cd client
npm run build
# Creates optimized build in client/build/
```

**Backend**:
```bash
cd server
npm run build
# Compiles TypeScript to JavaScript in server/dist/
```

## Troubleshooting

### Port Already in Use

**Frontend (port 3000)**:
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

**Backend (port 3001)**:
```bash
lsof -i :3001
kill -9 <PID>
```

### LMStudio Connection Failed

1. Verify LMStudio is running
2. Check model is loaded in LMStudio
3. Confirm server is on port 1234
4. Test manually: `curl http://localhost:1234/v1/models`

### Environment Variables Not Loading

1. Verify `.env` file exists in `server/` directory
2. Check file has correct format (no spaces around `=`)
3. Restart backend server after changing `.env`
4. Run: `npm run verify-env`

### Python Not Found

1. Verify Python 3 installed: `python3 --version`
2. Check PATH includes Python: `which python3`
3. Update `PYTHON_PATH` in `.env` if using different Python executable

### llm_call.py Not Found

1. Verify path in `.env` is correct
2. Check file exists: `ls ../../../forwork/modules/llm_caller_cli/llm_call.py`
3. Use absolute path if needed: `/full/path/to/llm_call.py`

### npm install Fails

1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and package-lock.json
3. Run `npm install` again
4. Check Node.js version compatibility

## Next Steps

After successful setup:

1. **Read Architecture**: See `ARCHITECTURE.md` for technical details
2. **Run Tests**: Verify everything works with test suites
3. **Start Development**: Begin implementing features per work units
4. **Refer to README**: For general project information

## Support

For issues:
1. Check this SETUP guide first
2. Review ARCHITECTURE.md for technical details
3. Check git commit history for examples
4. Review work unit documents in `.claude/work-units/`

## Quick Reference

```bash
# Start everything (3 terminals)
Terminal 1: Open LMStudio, load model, start server
Terminal 2: cd server && npm run dev
Terminal 3: cd client && npm start

# Run tests
cd client && npm test
cd server && npm test

# Verify setup
cd server && npm run verify-env
curl http://localhost:3001/health
```

---

**Setup complete!** You should now have a fully functional development environment.
