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
    // Hub-module import guard (forge rfd-002; forge anti-patterns "A re-export
    // from a hub module turns 'one value' into 'the whole graph'").
    //
    // AppNavigator imports every screen plus native-stack and bottom-tabs, so a
    // single VALUE imported from it loads the whole app graph — into the
    // bundle's startup path and into every jest file that mounts the importer.
    // Measured on alate before its fix: 741→120 modules in HomeScreen.test,
    // 803→25 in navigator.avatarGate.test (alate#460). Types are free — babel
    // elides `import type` — and every screen here already imports that way.
    //
    // Scoped to src/ so App.tsx, the one legitimate default importer, is exempt
    // by placement. screenSmoke.test.tsx carries the one line-level exemption:
    // rendering the REAL navigator is that file's stated purpose.
    //
    // `warn` per this config's advisory-first convention; promote to 'error'
    // after a clean PR cycle, as alate did (alate#467 → #468).
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/navigation/AppNavigator'],
              allowTypeImports: true,
              message:
                'AppNavigator imports every screen — a value import from it loads the whole graph. ' +
                'Keep type imports as `import type`; move any shared value to a leaf module instead.',
            },
          ],
        },
      ],
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
