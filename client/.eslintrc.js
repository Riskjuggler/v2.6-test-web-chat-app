module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'prettier' // Disable ESLint rules that conflict with Prettier
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error', // Show Prettier issues as ESLint errors
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
