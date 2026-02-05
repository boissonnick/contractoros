import nextConfig from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  ...nextConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // Allow any type (too many existing usages to fix now)
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow empty interfaces (used for extending)
      '@typescript-eslint/no-empty-interface': 'off',
    },
  },
  {
    rules: {
      // Allow img elements (we use next/image where needed, warn otherwise)
      '@next/next/no-img-element': 'warn',
      // Downgrade to warn — existing code has apostrophes in JSX text
      'react/no-unescaped-entities': 'warn',
      // Downgrade to warn — 2 instances using <a> instead of <Link>
      '@next/next/no-html-link-for-pages': 'warn',

      // React Compiler rules — downgraded to warn for migration.
      // These enforce patterns needed for the React Compiler (React 19).
      // Address incrementally as components are refactored.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'public/',
      'scripts/',
      'coverage/',
    ],
  },
];

export default eslintConfig;
