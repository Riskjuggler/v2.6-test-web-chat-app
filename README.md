# Web Chat App - MVP

A localhost web-based AI chat interface for querying LLMs via LMStudio.

## Features

- Simple chat interface (React + TypeScript)
- Express backend with LLM integration
- LMStudio integration via llm_caller_cli subprocess
- Real-time message flow
- Local-only (no cloud deployment)

## Prerequisites

- Node.js v18+
- Python 3.9+
- LMStudio running on localhost:1234 with model loaded
- llm_caller_cli module at `../forwork/modules/llm_caller_cli/`

## Installation

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
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

## Testing

```bash
# Frontend tests
cd client
npm test

# Backend tests
cd server
npm test
```

## License

MIT
