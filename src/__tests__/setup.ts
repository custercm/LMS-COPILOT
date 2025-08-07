import '@testing-library/jest-dom';

// Mock VS Code API
const mockVscode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
    registerWebviewViewProvider: jest.fn(),
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string) => {
        const defaults: Record<string, any> = {
          'endpoint': 'http://localhost:1234',
          'model': 'llama3'
        };
        return defaults[key];
      })
    })),
    workspaceFolders: [],
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  Uri: {
    file: jest.fn(),
    parse: jest.fn(),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
  Disposable: {
    from: jest.fn(),
  },
  WebviewViewProvider: jest.fn(),
};

// Mock vscode module
jest.mock('vscode', () => mockVscode, { virtual: true });

// Setup global test utilities
(global as any).mockVscode = mockVscode;

// Mock fetch for API tests
(global as any).fetch = jest.fn();

// Mock ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollIntoView for JSDOM
(global as any).HTMLElement.prototype.scrollIntoView = jest.fn();

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
