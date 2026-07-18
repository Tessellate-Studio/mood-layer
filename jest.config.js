module.exports = {
  // jest-expo/ios, not /android: with the /android preset RN's jest Text mock
  // crashes ("reading 'constructor'") on this RN 0.83 + react-test-renderer
  // 19.2 combo; alate ships the same stack on /ios and it's known-good.
  preset: 'jest-expo/ios',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-svg|zustand)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  // Session worktrees checked out under the repo root carry their own copies of
  // the test suite; without these ignores jest runs them too (stale duplicates).
  // MUST be <rootDir>-anchored: a bare '/\.claude/worktrees/' also matches the
  // path of a worktree running its OWN suite, so jest silently discovers ZERO
  // tests in every worktree session — a green run that tested nothing
  // (regression 2026-07-18). Anchoring scopes the ignore to worktrees nested
  // BELOW the current root, which is the actual intent.
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/\\.claude/worktrees/',
    '<rootDir>/\\.worktrees/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/\\.claude/worktrees/', '<rootDir>/\\.worktrees/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
};
