import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      'src/common/events/',
      'eslint.config.mjs',
    ],
  },
  {
    files: ['**/*.{js,jsx,cjs,mjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'class-methods-use-this': 'off',
      'eol-last': 'off',
      'lines-between-class-members': 'off',
      'max-len': 'off',
      'no-plusplus': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off',
    },
  },
];
