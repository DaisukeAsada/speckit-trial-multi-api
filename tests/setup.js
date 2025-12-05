/**
 * Jest テストセットアップファイル
 * 全テストで共通の初期化処理を定義
 */

// テスト環境の設定
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DB_TYPE = 'sqlite';
process.env.DB_PATH = ':memory:';

// テスト終了時のクリーンアップ
afterAll(async () => {
  // データベース接続のクローズなど
  // 必要に応じて実装
});
