# Work Unit: WU-P0-1 - Fix Command Injection Vulnerability

**ID**: WU-P0-1
**Priority**: P0 CRITICAL - Security Blocker
**Sprint**: P0 Remediation Sprint
**Estimated Effort**: 30 minutes
**Dependencies**: None

---

## Objective

Fix critical command injection vulnerability in LLM service subprocess invocation that allows remote code execution via malicious environment variables.

---

## Background

**Discovery**: Post-hoc review Batch 2 (Backend)
**Current Issue**: `server/src/services/llm.ts` uses `execAsync()` with string interpolation, spawning a shell that interprets metacharacters in environment variables.

**Attack Vector**:
```bash
export PYTHON_PATH="python3; rm -rf /"
export LLM_CLI_PATH="script.py && cat /etc/passwd"
```

**Risk Level**: 🔴 CRITICAL - Remote code execution

---

## Success Criteria

1. ✅ Replace `execAsync()` with `spawn()` (no shell invocation)
2. ✅ Pass arguments as array (no string concatenation)
3. ✅ All 22 existing LLM service tests still pass
4. ✅ Add security test validating injection prevention
5. ✅ Manual test: Send message via UI, receive response

---

## Implementation Approach

### Step 1: Create spawn-based helper function

Replace promisified `exec()` with `spawn()` wrapper:
- No shell spawning (direct process execution)
- Arguments passed as array (not template string)
- Maintain timeout functionality
- Maintain error handling (exit codes 0-4)

### Step 2: Update callLLM function

Location: `server/src/services/llm.ts` lines 60-80

Current vulnerable code:
```typescript
const requestJson = JSON.stringify(request).replace(/'/g, "'\\''");
const command = `${PYTHON_PATH} "${LLM_CLI_PATH}" --request-json '${requestJson}'`;
const { stdout, stderr } = await execAsync(command, { timeout: LLM_TIMEOUT_MS });
```

Secure replacement:
```typescript
const requestJson = JSON.stringify(request);
const args = [LLM_CLI_PATH, '--request-json', requestJson];
const { stdout, stderr } = await spawnAsync(PYTHON_PATH, args, { timeout: LLM_TIMEOUT_MS });
```

### Step 3: Add security test

Create test in `server/src/__tests__/llm.test.ts`:
```typescript
describe('Security', () => {
  it('should prevent command injection via PYTHON_PATH', async () => {
    const original = process.env.PYTHON_PATH;
    process.env.PYTHON_PATH = 'python3; echo "INJECTED" > /tmp/test-injection';

    // Should fail gracefully, not execute injection
    await expect(callLLM('test')).rejects.toThrow();

    // Verify injection didn't execute
    expect(fs.existsSync('/tmp/test-injection')).toBe(false);

    process.env.PYTHON_PATH = original;
  });
});
```

---

## Files to Modify

1. **server/src/services/llm.ts** (MODIFY - 30 lines)
   - Add `spawnAsync()` helper function
   - Replace `execAsync()` invocation with `spawn()`
   - Update imports (add `spawn` from child_process)

2. **server/src/__tests__/llm.test.ts** (ADD - 15 lines)
   - Add security test for command injection prevention

---

## Testing Plan

### Unit Tests
- Run existing 22 LLM service tests: `npm test llm.test.ts`
- Expected: All 22 tests still pass
- Run new security test
- Expected: Security test passes (injection prevented)

### Integration Tests
- Run all backend tests: `cd server && npm test`
- Expected: 85/85 tests pass

### Manual Testing
1. Start LMStudio with model loaded
2. Start backend: `cd server && npm run dev`
3. Send test message via curl:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello, test message"}'
   ```
4. Expected: Receive valid LLM response

---

## Validation Commands

```bash
# Run tests
cd server
npm test -- llm.test.ts

# Run all backend tests
npm test

# Manual API test
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test after security fix"}'
```

---

## Acceptance Criteria

- [ ] `spawn()` implementation complete in llm.ts
- [ ] No shell invocation (verified by code inspection)
- [ ] Arguments passed as array (no string interpolation)
- [ ] All 22 existing tests pass
- [ ] New security test added and passing
- [ ] Manual curl test successful
- [ ] No regressions in error handling
- [ ] Timeout functionality preserved

---

## Rollback Plan

If issues occur:
1. Revert commit: `git revert HEAD`
2. Original `execAsync()` code restored
3. Document blocking issue in KNOWN-LIMITATIONS.md
4. Create new remediation approach

---

## Definition of Done

1. Code changes committed with message: `[P0-1] Fix command injection vulnerability in LLM service`
2. All tests passing (85/85 backend tests)
3. Security test validates injection prevention
4. Manual test confirms functionality preserved
5. Code review by define-and-deploy agent output reviews
6. Ready for P0-3 documentation update (depends on this fix)

---

## References

- Detailed fix implementation: `.claude/analysis/summaries/P0-REMEDIATION-PLAN.md` Section P0-1
- Original vulnerability: `.claude/analysis/summaries/BATCH-2-BACKEND-CONSOLIDATED.md` WU-010
- Security best practices: Node.js docs - `child_process.spawn()` vs `exec()`
