/**
 * RefreshTokenモデル
 * リフレッシュトークンエンティティのデータアクセスを担当
 */
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');

/**
 * リフレッシュトークンの有効期間（ミリ秒）
 * デフォルト: 7日
 */
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 新規リフレッシュトークンを作成
 * @param {Object} tokenData - トークンデータ
 * @param {string} tokenData.userId - ユーザーID
 * @param {string} tokenData.token - リフレッシュトークン値
 * @returns {Object} 作成されたトークン
 */
function create(tokenData) {
  const db = getDatabase();
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, tokenData.userId, tokenData.token, expiresAt);
  
  return findById(id);
}

/**
 * IDでトークンを検索
 * @param {string} id - トークンID
 * @returns {Object|null} トークンまたはnull
 */
function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, user_id as userId, token, expires_at as expiresAt,
           revoked, created_at as createdAt
    FROM refresh_tokens WHERE id = ?
  `);
  
  const result = stmt.get(id);
  if (!result) {
    return null;
  }
  
  // SQLiteのbooleanは0/1で保存されるため変換
  return {
    ...result,
    revoked: result.revoked === 1,
  };
}

/**
 * トークン値でトークンを検索
 * @param {string} token - リフレッシュトークン値
 * @returns {Object|null} トークンまたはnull
 */
function findByToken(token) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, user_id as userId, token, expires_at as expiresAt,
           revoked, created_at as createdAt
    FROM refresh_tokens WHERE token = ?
  `);
  
  const result = stmt.get(token);
  if (!result) {
    return null;
  }
  
  // SQLiteのbooleanは0/1で保存されるため変換
  return {
    ...result,
    revoked: result.revoked === 1,
  };
}

/**
 * トークンが有効かチェック
 * @param {Object} tokenRecord - トークンレコード
 * @returns {boolean} 有効な場合true
 */
function isValid(tokenRecord) {
  if (!tokenRecord) {
    return false;
  }
  
  // 無効化されている場合
  if (tokenRecord.revoked) {
    return false;
  }
  
  // 期限切れの場合
  const expiresAt = new Date(tokenRecord.expiresAt);
  if (expiresAt <= new Date()) {
    return false;
  }
  
  return true;
}

/**
 * トークンを無効化（ログアウト時）
 * @param {string} token - リフレッシュトークン値
 * @returns {boolean} 無効化成功の場合true
 */
function revoke(token) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE refresh_tokens SET revoked = 1 WHERE token = ?
  `);
  
  const result = stmt.run(token);
  return result.changes > 0;
}

/**
 * ユーザーの全トークンを無効化
 * @param {string} userId - ユーザーID
 * @returns {number} 無効化されたトークン数
 */
function revokeAllByUserId(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0
  `);
  
  const result = stmt.run(userId);
  return result.changes;
}

/**
 * 期限切れトークンを削除（クリーンアップ用）
 * @returns {number} 削除されたトークン数
 */
function deleteExpired() {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked = 1
  `);
  
  const result = stmt.run(new Date().toISOString());
  return result.changes;
}

/**
 * トークンを削除
 * @param {string} id - トークンID
 * @returns {boolean} 削除成功の場合true
 */
function remove(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM refresh_tokens WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

module.exports = {
  create,
  findById,
  findByToken,
  isValid,
  revoke,
  revokeAllByUserId,
  deleteExpired,
  remove,
  REFRESH_TOKEN_EXPIRY_MS,
};
