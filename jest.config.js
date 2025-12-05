/**
 * Jest 設定ファイル
 * テスト環境の設定を定義
 */
module.exports = {
  // テスト環境
  testEnvironment: 'node',
  
  // テストファイルのパターン
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  
  // ESMモジュールの変換
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  
  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // エントリーポイントは除外
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // テスト前のセットアップ
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // テストタイムアウト（ミリ秒）
  testTimeout: 10000,
  
  // 詳細出力
  verbose: true,
};
