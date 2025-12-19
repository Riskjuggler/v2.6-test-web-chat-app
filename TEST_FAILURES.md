# Test Failures Report

**Date:** 2025-12-18
**Branch:** main (post Snyk upgrades)
**Related PRs:** #1, #2, #3 (Snyk dependency upgrades - not root cause)

---

## Summary

| Component | Passed | Failed | Total |
|-----------|--------|--------|-------|
| Server    | 48     | 9      | 57    |
| Client    | 93     | 21     | 114   |
| **Total** | 141    | 30     | 171   |

---

## Server Failures (9)

### `src/__tests__/unit/llm.service.test.ts` (3 failures)

| Test | Issue |
|------|-------|
| should construct message with system prompt and user message | Message format mismatch |
| should respect maxTokens configuration | Max tokens not applied correctly |
| should truncate conversation history when exceeding limit | Truncation logic not working as expected |

### `src/__tests__/integration/chat-api.test.ts` (6 failures)

| Test | Expected | Actual |
|------|----------|--------|
| should handle messages with special characters and quotes | 200 | 500 |
| should return 503 when subprocess exits with code 2 | 503 | 500 |
| should return 504 when subprocess times out | 504 | 500 |
| should execute complete request/response cycle | 200 | 500 |
| should include CORS headers in successful response | 200 | 500 |

**Root Cause:** Error handling not returning appropriate HTTP status codes; defaults to 500.

---

## Client Failures (21)

### `src/components/Header.test.tsx` (1 failure)

| Test | Issue |
|------|-------|
| header has proper styling classes | Test expects `p-5 shadow-lg`, component uses `p-2 shadow-md` |

**Root Cause:** Test not updated after styling changes.

### `src/App.test.tsx` (multiple failures)

- State updates not wrapped in `act()`
- Async operations completing after test assertions
- Mock responses not matching expected format

### `src/__tests__/edge-cases/frontend.test.tsx` (multiple failures)

| Test Category | Issue |
|---------------|-------|
| Message persistence | localStorage mock not persisting across unmount/remount |
| Error recovery | Error state not clearing as expected |
| Loading states | Timing issues with async operations |

### `src/__tests__/integration-flow.test.tsx` (multiple failures)

- Full integration flow tests failing due to mock setup issues
- API responses not matching expected structure

---

## Additional Warnings

### Duplicate Mock File
```
jest-haste-map: duplicate manual mock found: axios
  * <rootDir>/src/__mocks__/axios.ts
  * <rootDir>/src/services/__mocks__/axios.ts
```
**Action:** Remove one of the duplicate mock files.

### Node.js Engine Compatibility
```
npm warn EBADENGINE: Jest 30 packages require Node ^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0
Current: v23.10.0
```
**Action:** Consider using Node.js LTS version (v20 or v22).

---

## Conclusion

These failures are **pre-existing issues** unrelated to the Snyk dependency upgrades:
- `axios` 1.13.1 → 1.13.2 (patch version)
- `@types/react` 19.2.2 → 19.2.6 (type definitions only)
- `@types/react-dom` 19.2.2 → 19.2.3 (type definitions only)

The failures indicate:
1. Tests not updated after implementation changes
2. Async testing patterns need improvement
3. Error handling needs to return proper HTTP status codes
