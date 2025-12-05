/**
 * データベース接続モジュール
 * SQLiteおよびPostgreSQL接続を管理
 */
const config = require('./index');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * SQLiteデータベースに接続する
 * @returns {Object} better-sqlite3 データベースインスタンス
 */
function connectSqlite() {
  const Database = require('better-sqlite3');
  
  // インメモリデータベース（テスト用）
  if (config.database.path === ':memory:') {
    return new Database(':memory:');
  }
  
  // ファイルベースのデータベース
  const dbPath = path.resolve(config.database.path);
  const dbDir = path.dirname(dbPath);
  
  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const database = new Database(dbPath);
  
  // 外部キー制約を有効化
  database.pragma('foreign_keys = ON');
  
  return database;
}

/**
 * データベースに接続する
 * @returns {Object} データベースインスタンス
 */
function connect() {
  if (db) {
    return db;
  }
  
  if (config.database.type === 'sqlite') {
    db = connectSqlite();
  } else if (config.database.type === 'postgres') {
    // PostgreSQL対応は将来の拡張用
    const { Pool } = require('pg');
    db = new Pool({ connectionString: config.database.url });
  } else {
    throw new Error(`Unsupported database type: ${config.database.type}`);
  }
  
  return db;
}

/**
 * データベース接続を取得する
 * @returns {Object} データベースインスタンス
 */
function getDatabase() {
  if (!db) {
    return connect();
  }
  return db;
}

/**
 * データベース接続を閉じる
 */
function close() {
  if (db) {
    if (config.database.type === 'sqlite') {
      db.close();
    } else if (config.database.type === 'postgres') {
      db.end();
    }
    db = null;
  }
}

/**
 * データベースをリセットする（テスト用）
 */
function reset() {
  close();
  db = null;
}

module.exports = {
  connect,
  getDatabase,
  close,
  reset,
};
