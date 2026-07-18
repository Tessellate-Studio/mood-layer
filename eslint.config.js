// https://docs.expo.dev/guides/using-eslint/
//
// Advisory-first lint setup: `npm run lint` is expected to exit 0 so it can run
// in CI without blocking, while substantive findings still surface as warnings.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/*',
      '.expo/*',
      'dist/*',
      'android/*',
      'ios/*',
      'coverage/*',
      'assets/*',
    ],
  },
  expoConfig,
  {
    // Jest globals (`jest`, `describe`, `beforeEach`, ...) plus Node's `global`
    // are undefined to ESLint's browser-ish default env, which made every line
    // of jest.setup.js a `no-undef` error. Declare them instead of demoting the
    // rule, so real undefined-variable bugs in app code still get caught.
    files: ['**/*.test.{ts,tsx,js,jsx}', 'jest.setup.js', 'jest.config.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        global: 'writable',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  {
    rules: {
      // Demoted to warn: fires 54x across the codebase purely because the
      // component files export both a default and a matching named export.
      // Stylistic, not a defect — churning every import site would bury the
      // real findings.
      'import/no-named-as-default': 'warn',
    },
  },
  {
    // Off (not just warn) in test files: jest.mock() calls are deliberately
    // placed above the imports they mock. Left enabled, `--fix` hoists the
    // imports above the mocks and changes what the tests actually exercise.
    files: ['**/__tests__/**', '**/*.test.{ts,tsx,js,jsx}'],
    rules: {
      'import/first': 'off',
    },
  },
]);
