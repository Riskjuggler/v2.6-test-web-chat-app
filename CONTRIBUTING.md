# Contributing to Web Chat App

Thank you for your interest in contributing to Web Chat App! This document provides guidelines for contributing to this project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.9+
- LMStudio (for local LLM integration)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/v2.6-test-web-chat-app.git
   cd v2.6-test-web-chat-app
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install
   ```

3. **Configure Environment**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run Tests**
   ```bash
   # Backend tests
   cd server
   npm test

   # Frontend tests
   cd ../client
   npm test -- --watchAll=false
   ```

## Development Workflow

### Creating a Branch

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Making Changes

1. **Write Code**
   - Follow the existing code style
   - Use TypeScript strictly
   - Add JSDoc comments for public APIs

2. **Write Tests**
   - Add unit tests for new functionality
   - Ensure 80%+ code coverage
   - Test edge cases and error conditions

3. **Run Quality Checks**
   ```bash
   # Lint
   npm run lint

   # Format
   npm run format

   # Tests with coverage
   npm run test:coverage
   ```

### Commit Guidelines

We follow conventional commit format:

```
type(scope): brief description

Detailed explanation if needed

Fixes #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependency updates

**Examples:**
```bash
git commit -m "feat(chat): add message editing capability"
git commit -m "fix(api): handle empty LLM responses gracefully"
git commit -m "docs(readme): update setup instructions"
```

### Pull Request Process

1. **Update Documentation**
   - Update README.md if adding features
   - Add JSDoc comments to new functions
   - Update ARCHITECTURE.md if changing design

2. **Ensure Quality**
   - All tests pass: `npm test`
   - Coverage meets 80% threshold: `npm run test:coverage`
   - No lint errors: `npm run lint`
   - Code is formatted: `npm run format`

3. **Create Pull Request**
   - Push your branch to GitHub
   - Open a PR against `main`
   - Fill out the PR template
   - Link related issues

4. **Code Review**
   - Address reviewer feedback
   - Keep commits clean and logical
   - Be responsive to comments

5. **Merge**
   - Maintainers will merge once approved
   - Delete your branch after merge

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types (use `unknown` if needed)
- Define interfaces for all data structures
- Use async/await over promises

### Formatting

- 2-space indentation
- Single quotes for strings
- Semicolons required
- 100-character line width
- Prettier handles most formatting

### Testing

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test full user workflows

**Test Structure:**
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = ...;

      // Act
      const result = method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Error Handling

- Throw typed errors
- Include context in error messages
- Log errors with appropriate severity
- Handle errors gracefully in UI

## What to Contribute

### Good First Issues

Look for issues labeled `good first issue` - these are well-scoped and beginner-friendly.

### Areas for Contribution

- **Features**: New chat capabilities, UI improvements
- **Tests**: Increase coverage, add edge cases
- **Documentation**: Improve setup guides, add examples
- **Bug Fixes**: Fix reported issues
- **Performance**: Optimize rendering, API calls
- **Accessibility**: ARIA labels, keyboard navigation

### Not Accepting

- Breaking changes without discussion
- Features without tests
- Code style changes without Prettier
- Dependencies without justification

## Security

**Do not open public issues for security vulnerabilities.**

Instead, report security issues to the maintainers directly via GitHub Security Advisories or contact information in the repository.

## Testing Your Changes

### Backend Testing

```bash
cd server

# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode (during development)
npm run test:watch
```

### Frontend Testing

```bash
cd client

# Interactive mode
npm test

# CI mode (all tests once)
npm test -- --watchAll=false

# With coverage
npm run test:coverage

# E2E tests (requires app running)
npm run test:e2e
```

### Manual Testing

1. Start the backend: `cd server && npm run dev`
2. Start the frontend: `cd client && npm start`
3. Test the feature in browser at http://localhost:3000
4. Check browser console for errors
5. Verify backend logs show expected behavior

## Documentation

When adding features, update:

- **README.md**: User-facing features
- **ARCHITECTURE.md**: Technical design changes
- **API.md**: New or changed endpoints
- **TESTING.md**: New test types or strategies
- **SETUP.md**: Setup or configuration changes

## Questions?

- Check [SETUP.md](SETUP.md) for setup issues
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for design questions
- Open a GitHub Discussion for general questions
- Comment on existing issues for clarification

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Acknowledgments

Thank you for contributing to Web Chat App! Every contribution, no matter how small, helps make this project better.
