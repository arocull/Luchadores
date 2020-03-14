module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Allow ESLint to understand TypeScript (not just JavaScript).
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-typescript/base'
  ],
  rules: {
    'max-len': 'off',
    'lines-between-class-members': 'off',
    'no-plusplus': 'off',
    'object-property-newline': 'error',
    'eol-last': 'off'
  }
};
