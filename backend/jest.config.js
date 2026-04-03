export default {
  testEnvironment: 'node',
  injectGlobals: true,
  collectCoverageFrom: [
    'src/**/*.js'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: [],
  resetMocks: false,
  clearMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
