/**
 * マイグレーションランナー
 * データベースマイグレーションを順番に実行
 */
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * マイグレーションファイルのリストを取得
 * @returns {string[]} マイグレーションファイルのパス配列
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir);
  
  return files
    .filter((file) => file.endsWith('.js') && file !== 'index.js' && file !== 'runner.js')
    .sort()
    .map((file) => path.join(migrationsDir, file));
}

/**
 * マイグレーションテーブルを作成
 * @param {Object} db - データベースインスタンス
 */
function createMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * 実行済みマイグレーションを取得
 * @param {Object} db - データベースインスタンス
 * @returns {string[]} 実行済みマイグレーション名の配列
 */
function getExecutedMigrations(db) {
  const rows = db.prepare('SELECT name FROM migrations ORDER BY id').all();
  return rows.map((row) => row.name);
}

/**
 * マイグレーションを実行
 * @param {Object} db - データベースインスタンス
 * @param {string} filePath - マイグレーションファイルのパス
 */
function executeMigration(db, filePath) {
  const migration = require(filePath);
  const migrationName = path.basename(filePath);
  
  logger.info(`Executing migration: ${migrationName}`);
  
  // マイグレーションを実行
  if (typeof migration.up === 'function') {
    migration.up(db);
  } else if (typeof migration === 'string') {
    db.exec(migration);
  }
  
  // 実行記録を保存
  db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
  
  logger.info(`Migration completed: ${migrationName}`);
}

/**
 * 全てのマイグレーションを実行
 * @param {Object} db - データベースインスタンス（オプション）
 */
function runMigrations(db = null) {
  const database = db || getDatabase();
  
  // マイグレーションテーブルを作成
  createMigrationsTable(database);
  
  // 実行済みマイグレーションを取得
  const executed = getExecutedMigrations(database);
  
  // 未実行のマイグレーションを実行
  const migrationFiles = getMigrationFiles();
  
  for (const filePath of migrationFiles) {
    const migrationName = path.basename(filePath);
    
    if (!executed.includes(migrationName)) {
      executeMigration(database, filePath);
    } else {
      logger.debug(`Skipping already executed migration: ${migrationName}`);
    }
  }
  
  logger.info('All migrations completed');
}

/**
 * コマンドラインから実行された場合
 */
if (require.main === module) {
  try {
    runMigrations();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    process.exit(1);
  }
}

module.exports = {
  runMigrations,
  getMigrationFiles,
  getExecutedMigrations,
};
