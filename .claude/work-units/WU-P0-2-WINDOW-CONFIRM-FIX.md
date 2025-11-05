# Work Unit: WU-P0-2 - Replace window.confirm with Custom Modal

**ID**: WU-P0-2
**Priority**: P0 CRITICAL - Production UX Blocker
**Sprint**: P0 Remediation Sprint
**Estimated Effort**: 2 hours
**Dependencies**: None

---

## Objective

Replace native `window.confirm()` dialog with custom branded modal component that provides professional UX, full accessibility support, and testability.

---

## Background

**Discovery**: Post-hoc review Batch 3 (Frontend)
**Current Issue**: `client/src/components/Header.tsx` uses `window.confirm()` which blocks UI thread, can't be styled, and has poor accessibility.

**Problems**:
- Synchronous blocking (freezes entire app)
- Not customizable (generic browser chrome)
- No ARIA labels or keyboard focus management
- Impossible to test properly (global window method)

**Risk Level**: 🟠 HIGH - Production UX blocker

---

## Success Criteria

1. ✅ Create reusable ConfirmModal component with proper accessibility
2. ✅ Update Header to use custom modal instead of window.confirm
3. ✅ All existing Header tests still pass (9 tests)
4. ✅ Add 8 new tests for ConfirmModal component
5. ✅ Manual test: Clear chat button triggers modal, both buttons work
6. ✅ Accessibility test: Keyboard navigation and screen reader support

---

## Implementation Approach

### Step 1: Create ConfirmModal component

New file: `client/src/components/ConfirmModal.tsx`

Features:
- Backdrop overlay with click-outside support
- Customizable title, message, button labels
- Proper ARIA attributes (role="dialog", aria-modal, aria-labelledby)
- Keyboard navigation (Tab, Enter, Escape)
- Focus management (auto-focus confirm button)
- Tailwind CSS styling (consistent with app design)

### Step 2: Update Header component

Location: `client/src/components/Header.tsx`

Changes:
- Add state: `const [showConfirmModal, setShowConfirmModal] = useState(false)`
- Replace `window.confirm()` with `setShowConfirmModal(true)`
- Add modal handlers: `handleConfirm()` and `handleCancel()`
- Render `<ConfirmModal>` component

### Step 3: Create comprehensive tests

New file: `client/src/components/ConfirmModal.test.tsx`

Test cases:
1. Renders when isOpen is true
2. Does not render when isOpen is false
3. Calls onConfirm when Confirm button clicked
4. Calls onCancel when Cancel button clicked
5. Has proper ARIA attributes
6. Custom button labels work
7. Backdrop click triggers onCancel
8. Escape key triggers onCancel

### Step 4: Update Header tests

File: `client/src/components/Header.test.tsx`

Changes:
- Remove window.confirm mock
- Add modal visibility assertions
- Test modal button interactions

---

## Files to Create

1. **client/src/components/ConfirmModal.tsx** (NEW - 60 lines)
   - Reusable modal component
   - Full accessibility support
   - Tailwind CSS styling

2. **client/src/components/ConfirmModal.test.tsx** (NEW - 120 lines)
   - 8 comprehensive test cases
   - Accessibility validation
   - User interaction testing

---

## Files to Modify

1. **client/src/components/Header.tsx** (MODIFY - 25 lines)
   - Add useState for modal visibility
   - Replace window.confirm with modal
   - Add modal event handlers

2. **client/src/components/Header.test.tsx** (MODIFY - 15 lines)
   - Update tests for modal interaction
   - Remove window.confirm mock

---

## Implementation Details

### ConfirmModal.tsx Structure

```typescript
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         role="dialog"
         aria-modal="true"
         aria-labelledby="modal-title">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 id="modal-title" className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Header.tsx Changes

```typescript
const [showConfirmModal, setShowConfirmModal] = useState(false);

const handleClearClick = () => {
  setShowConfirmModal(true);
};

const handleConfirm = () => {
  setShowConfirmModal(false);
  onClearChat();
};

const handleCancel = () => {
  setShowConfirmModal(false);
};

// In JSX:
<ConfirmModal
  isOpen={showConfirmModal}
  title="Clear Chat History"
  message="Are you sure you want to clear all messages? This action cannot be undone."
  confirmLabel="Clear"
  cancelLabel="Cancel"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

---

## Testing Plan

### Unit Tests
- Run ConfirmModal tests: `npm test ConfirmModal.test.tsx`
- Expected: 8/8 tests pass
- Run Header tests: `npm test Header.test.tsx`
- Expected: 9/9 tests pass (updated)

### Integration Tests
- Run all frontend tests: `cd client && npm test`
- Expected: 92/92 tests pass (84 existing + 8 new)

### Manual Testing
1. Start app: `cd client && npm start`
2. Click "Clear Chat" button
3. Verify: Modal appears with proper styling
4. Click "Cancel" - Modal closes, chat not cleared
5. Click "Clear Chat" again
6. Click "Clear" - Modal closes, chat cleared
7. Test keyboard: Tab between buttons, Enter to confirm, Escape to cancel

### Accessibility Testing
1. Use screen reader (VoiceOver on Mac, NVDA on Windows)
2. Verify: Modal announced as dialog
3. Verify: Title and message read correctly
4. Verify: Button labels clear
5. Test keyboard navigation (Tab, Shift+Tab, Enter, Escape)

---

## Validation Commands

```bash
# Run tests
cd client
npm test -- ConfirmModal.test.tsx
npm test -- Header.test.tsx

# Run all frontend tests
npm test

# Start dev server for manual testing
npm start
```

---

## Acceptance Criteria

- [ ] ConfirmModal component created with full accessibility
- [ ] 8 ConfirmModal tests added and passing
- [ ] Header component updated to use ConfirmModal
- [ ] Header tests updated and passing
- [ ] All 92 frontend tests pass
- [ ] Manual test: Modal appears and functions correctly
- [ ] Accessibility test: Keyboard navigation works
- [ ] No window.confirm() usage remains in codebase

---

## Rollback Plan

If issues occur:
1. Revert commit: `git revert HEAD`
2. Original window.confirm() code restored
3. Document blocking issue in KNOWN-LIMITATIONS.md
4. Create simpler modal approach if needed

---

## Definition of Done

1. Code changes committed with message: `[P0-2] Replace window.confirm with custom ConfirmModal component`
2. All tests passing (92/92 frontend tests)
3. Manual test confirms professional UX
4. Accessibility validation complete
5. Code review by define-and-deploy agent output reviews
6. Ready for P0-3 documentation update (depends on this fix)

---

## References

- Detailed implementation: `.claude/analysis/summaries/P0-REMEDIATION-PLAN.md` Section P0-2
- Original issue: `.claude/analysis/summaries/BATCH-3-FRONTEND-CONSOLIDATED.md` WU-023
- Accessibility guidelines: ARIA dialog pattern (W3C WAI-ARIA Authoring Practices)
- React patterns: React docs - Modal components and portals
