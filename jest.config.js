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
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
};
