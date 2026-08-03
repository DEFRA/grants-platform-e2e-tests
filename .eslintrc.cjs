module.exports = {
  env: {
    es2022: true,
    node: true
  },
  extends: [
    'standard',
    'prettier',
    'eslint:recommended',
    'plugin:playwright/recommended'
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  plugins: ['prettier', 'playwright'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off',
    'playwright/no-wait-for-timeout': 'off',
    'playwright/no-skipped-test': 'off'
  }
}
