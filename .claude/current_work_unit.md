# Work Unit: WU-002 - Testing Infrastructure Setup

**Work Unit ID**: WU-002
**Created**: 2025-11-03
**Status**: Planning

---

## Objective

Setup comprehensive testing infrastructure for both frontend (Jest + React Testing Library) and backend (Jest + Supertest) with coverage reporting at 80% threshold and working test execution scripts.

---

## Success Criteria

1. Frontend tests execute successfully with `cd client && npm test -- --watchAll=false`
2. Backend tests execute successfully with `cd server && npm test`
3. Coverage reports generate for both frontend and backend with `npm run test:coverage`
4. At least one sample component test passes in frontend
5. At least one sample API endpoint test passes in backend using Supertest
6. Coverage thresholds configured to 80% for statements, functions, and lines
7. Test commands documented in project README

---

## Approach

### Frontend Testing Setup (Already Partially Complete)
1. Verify existing testing dependencies (@testing-library/react, @testing-library/jest-dom are already installed)
2. Install additional dependency: jest-environment-jsdom (if not present)
3. Create `src/setupTests.ts` with test utilities and imports
4. Create sample component test file `src/App.test.tsx`
5. Configure coverage thresholds in package.json
6. Verify test execution with `npm test`

### Backend Testing Setup (New)
1. Install Jest and TypeScript support: jest, @types/jest, ts-jest
2. Install Supertest for API testing: supertest, @types/supertest
3. Create `jest.config.js` for TypeScript configuration
4. Create `src/__tests__/` directory structure
5. Create sample API test `src/__tests__/api.test.ts` testing health endpoint
6. Add test scripts to package.json (test, test:watch, test:coverage)
7. Configure coverage thresholds in jest.config.js

### Coverage Configuration
1. Set coverage thresholds to 80% for statements, functions, and lines
2. Add coverage directories to .gitignore (coverage/, .coverage)
3. Verify coverage reports generate properly

---

## Files Expected

1. **web-chat-app/client/src/setupTests.ts** - CREATE - Test setup with @testing-library/jest-dom imports
2. **web-chat-app/client/src/App.test.tsx** - CREATE - Sample React component test
3. **web-chat-app/client/package.json** - MODIFY - Add test:coverage script and coverage configuration
4. **web-chat-app/server/jest.config.js** - CREATE - Jest configuration for TypeScript
5. **web-chat-app/server/src/__tests__/api.test.ts** - CREATE - Sample API test using Supertest
6. **web-chat-app/server/package.json** - MODIFY - Add testing scripts and dependencies
7. **web-chat-app/.gitignore** - MODIFY - Add coverage directories
8. **web-chat-app/README.md** - MODIFY - Add testing documentation

**Total Files**: 8 (3 new, 5 modified)

---

## Validation Command

```bash
# Navigate to project root
cd /Users/user/v2.6-test/web-chat-app

# Install backend testing dependencies first
cd server && npm install -D jest @types/jest ts-jest supertest @types/supertest

# Test frontend
cd ../client && npm test -- --watchAll=false --passWithNoTests

# Generate frontend coverage
npm run test:coverage

# Test backend
cd ../server && npm test

# Generate backend coverage
npm run test:coverage

# Verify at least 1 test passes in each
echo "✅ Testing infrastructure validated"
```

---

## Implementation Notes

**Frontend Considerations**:
- Create React App already includes Jest configuration
- React Testing Library is already installed
- Just need to add setupTests.ts and sample test
- Coverage configuration goes in package.json under "jest" key

**Backend Considerations**:
- Need full Jest setup from scratch
- ts-jest required for TypeScript support
- Supertest enables HTTP endpoint testing without running server
- Coverage configuration goes in jest.config.js

**Coverage Thresholds**:
- Using 80% as target (industry standard)
- Applies to: statements, functions, lines
- Branches set to 75% (typically harder to achieve)

---

## Context

This is the second work unit in Sprint 1 (Foundation Setup). Testing infrastructure is critical before implementing any features (LLM service, frontend components) so we can develop test-first and maintain quality.

WU-001 established the project structure. This work unit enables test-driven development for all future work units.

---

## Dependencies

**Prerequisites**:
- WU-001 (Project Initialization) - COMPLETE

**Blocks**:
- WU-010 (LLM Service) - needs test mocks for API calls
- WU-020 (Frontend Components) - need testing framework

---

## Risk Assessment

**Low Risk Areas**:
- Frontend testing setup (most dependencies already installed)
- Coverage reporting configuration (standard Jest features)

**Medium Risk Areas**:
- Backend Jest configuration with TypeScript (common but can have config issues)
- Supertest setup (need to ensure proper Express app export for testing)

**Mitigation**:
- Use standard jest.config.js templates for TypeScript
- Export Express app separately from server.listen() to enable Supertest
- Verify configurations incrementally (install deps → configure → test)

---

## Success Metrics

**Quantitative**:
- 100% of test commands execute without errors
- At least 2 tests passing (1 frontend, 1 backend)
- Coverage reports generate successfully for both projects
- Zero npm installation errors

**Qualitative**:
- Test output is clear and readable
- Coverage reports are easy to interpret
- Test commands are simple to run (npm test)
- Documentation is clear for future developers

