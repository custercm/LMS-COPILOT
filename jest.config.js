module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Handle CSS and asset imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__tests__/mocks/fileMock.js'
  },
  
  // Transform TypeScript and JavaScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Only test source files, not compiled files
  testMatch: [
    '**/src/**/__tests__/**/*.(ts|tsx|js)',
    '**/src/**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Ignore compiled files, node_modules, TypeScript declaration files, and mock files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.d\\.ts$',
    'src/__tests__/mocks/'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/webview/dist/**'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Don't clear mocks automatically
  clearMocks: true,
  restoreMocks: true
};
