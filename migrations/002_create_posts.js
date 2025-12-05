/**
 * マイグレーション: 記事テーブル作成
 * Postエンティティのスキーマを定義
 */

/**
 * マイグレーションを実行
 * @param {Object} db - better-sqlite3 データベースインスタンス
 */
function up(db) {
  // 記事テーブル作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // ユーザー別記事検索用インデックス
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
  
  // 一覧取得最適化用インデックス
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts(status, created_at DESC)');
}

/**
 * マイグレーションをロールバック
 * @param {Object} db - better-sqlite3 データベースインスタンス
 */
function down(db) {
  db.exec('DROP INDEX IF EXISTS idx_posts_status_created_at');
  db.exec('DROP INDEX IF EXISTS idx_posts_user_id');
  db.exec('DROP TABLE IF EXISTS posts');
}

module.exports = { up, down };
