/**
 * マイグレーション: リフレッシュトークンテーブル作成
 * RefreshTokenエンティティのスキーマを定義
 */

/**
 * マイグレーションを実行
 * @param {Object} db - better-sqlite3 データベースインスタンス
 */
function up(db) {
  // リフレッシュトークンテーブル作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // トークン検証用インデックス
  db.exec('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)');
  
  // ユーザー別トークン管理用インデックス
  db.exec('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
}

/**
 * マイグレーションをロールバック
 * @param {Object} db - better-sqlite3 データベースインスタンス
 */
function down(db) {
  db.exec('DROP INDEX IF EXISTS idx_refresh_tokens_user_id');
  db.exec('DROP INDEX IF EXISTS idx_refresh_tokens_token');
  db.exec('DROP TABLE IF EXISTS refresh_tokens');
}

module.exports = { up, down };
