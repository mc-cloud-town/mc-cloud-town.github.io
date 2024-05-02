module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier', 'react'],
  rules: {
    'prettier/prettier': 'warn',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'linebreak-style': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/self-closing-comp': ['error', { component: true, html: true }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
