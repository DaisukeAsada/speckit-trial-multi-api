/**
 * ESLint 設定ファイル
 * プロジェクト全体のコーディング規約を定義
 */
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // Prettierとの競合を回避
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // エラー系
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // ログ出力のためconsoleを許可
    
    // 警告系
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // スタイル系
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
  },
};
