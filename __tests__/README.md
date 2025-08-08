# Test Organization

This directory contains all tests for the LMS Copilot VS Code extension, organized in a professional manner following industry best practices.

## Directory Structure

```
__tests__/
├── README.md                 # This file - explains test organization
├── setup.ts                  # Global test setup and configuration
├── jest-dom.d.ts            # TypeScript definitions for jest-dom
├── mocks/                   # Shared mock files and utilities
│   ├── fileMock.js          # Mock for static file imports
│   └── vscode.ts            # VS Code API mocks
├── fixtures/                # Test data and fixtures
├── utils/                   # Test utilities and helpers
├── unit/                    # Unit tests
│   ├── agent/               # Agent module tests
│   ├── chat/                # Chat module tests
│   ├── completion/          # Completion module tests
│   ├── lmstudio/            # LM Studio client tests
│   ├── security/            # Security module tests
│   ├── ui/                  # UI module tests
│   └── webview/             # Webview component tests
│       ├── components/      # React component tests
│       └── utils/           # Webview utility tests
├── integration/             # Integration tests
│   └── webview-communication.test.ts
└── e2e/                     # End-to-end tests
    └── user-workflows.test.ts
```

## Test Categories

### Unit Tests (`/unit/`)
- Test individual components, functions, and modules in isolation
- Fast execution, focused on single units of functionality
- Located in `__tests__/unit/` with subdirectories mirroring the source structure

### Integration Tests (`/integration/`)
- Test how multiple components work together
- Focus on component interactions and data flow
- Located in `__tests__/integration/`

### End-to-End Tests (`/e2e/`)
- Test complete user workflows and scenarios
- Simulate real user interactions with the extension
- Located in `__tests__/e2e/`

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm test -- __tests__/unit

# Run only integration tests
npm test -- __tests__/integration

# Run only e2e tests
npm test -- __tests__/e2e

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Naming Convention

- Test files end with `.test.ts` or `.test.tsx`
- Test files are co-located with their test type (unit/integration/e2e)
- Component tests mirror the source directory structure
- Test descriptions are descriptive and follow the pattern: "should [expected behavior] when [condition]"

## Mocks and Utilities

### Global Mocks (`/mocks/`)
- `fileMock.js`: Handles CSS and static file imports
- `vscode.ts`: Provides VS Code API mocks for testing

### Test Setup (`setup.ts`)
- Configures jest-dom matchers
- Sets up global test environment
- Imports necessary polyfills and configurations

## Best Practices

1. **Test Organization**: Tests are organized by type and mirror source structure
2. **Naming**: Clear, descriptive test names that explain what is being tested
3. **Isolation**: Each test is independent and can run in any order
4. **Mocking**: External dependencies are properly mocked
5. **Coverage**: Aim for high test coverage while focusing on critical paths
6. **Performance**: Unit tests should be fast, integration tests moderate, e2e tests comprehensive

## VS Code Extension Testing

This project includes specific considerations for VS Code extension testing:

- VS Code API is mocked for unit tests
- Webview communication is tested in integration tests
- Extension activation and commands are tested in e2e tests
- React components are tested with appropriate testing utilities

## Coverage Reports

Coverage reports are generated in the `/coverage` directory and include:
- HTML reports for visual coverage inspection
- LCOV format for CI/CD integration
- Console summaries for quick overview

---

For questions about the testing structure or adding new tests, refer to this documentation or the existing test examples.
