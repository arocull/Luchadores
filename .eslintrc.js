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
  ],
  rules: {
    'class-methods-use-this': 'off',
    'eol-last': 'off',
    'lines-between-class-members': 'off',
    'max-len': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'object-property-newline': 'error',
    'no-param-reassign': 'off',
  }
};
