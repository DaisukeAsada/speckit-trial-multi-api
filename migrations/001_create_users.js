/**
 * マイグレーション: ユーザーテーブル作成
 * Userエンティティのスキーマを定義
 */

/**
 * マイグレーションを実行
 * @param {Object} db - better-sqlite3 データベースインスタンス
 */
function up(db) {
  // ユーザーテーブル作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // メールアドレス検索用インデックス
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
}

/**
 * マイグレーションをロールバック
 * @param {Object} db - better-sqlite3 データベースインスタンス
 */
function down(db) {
  db.exec('DROP INDEX IF EXISTS idx_users_email');
  db.exec('DROP TABLE IF EXISTS users');
}

module.exports = { up, down };
