/**
 * Userモデル
 * ユーザーエンティティのデータアクセスを担当
 */
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');

/**
 * 新規ユーザーを作成
 * @param {Object} userData - ユーザーデータ
 * @param {string} userData.email - メールアドレス
 * @param {string} userData.password - ハッシュ化済みパスワード
 * @param {string} userData.name - ユーザー名
 * @param {string} userData.role - ロール（オプション、デフォルト: 'user'）
 * @returns {Object} 作成されたユーザー
 */
function create(userData) {
  const db = getDatabase();
  const id = uuidv4();
  const role = userData.role || 'user';
  
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, userData.email, userData.password, userData.name, role);
  
  return findById(id);
}

/**
 * IDでユーザーを検索
 * @param {string} id - ユーザーID
 * @returns {Object|null} ユーザーまたはnull
 */
function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, email, password, name, role, created_at as createdAt
    FROM users WHERE id = ?
  `);
  
  return stmt.get(id) || null;
}

/**
 * メールアドレスでユーザーを検索
 * @param {string} email - メールアドレス
 * @returns {Object|null} ユーザーまたはnull
 */
function findByEmail(email) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, email, password, name, role, created_at as createdAt
    FROM users WHERE email = ?
  `);
  
  return stmt.get(email) || null;
}

/**
 * メールアドレスが既に使用されているかチェック
 * @param {string} email - メールアドレス
 * @returns {boolean} 使用されている場合true
 */
function emailExists(email) {
  const user = findByEmail(email);
  return user !== null;
}

/**
 * ユーザー情報を更新
 * @param {string} id - ユーザーID
 * @param {Object} updates - 更新データ
 * @returns {Object|null} 更新されたユーザーまたはnull
 */
function update(id, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];
  
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.password !== undefined) {
    fields.push('password = ?');
    values.push(updates.password);
  }
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.role !== undefined) {
    fields.push('role = ?');
    values.push(updates.role);
  }
  
  if (fields.length === 0) {
    return findById(id);
  }
  
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE users SET ${fields.join(', ')} WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  
  if (result.changes === 0) {
    return null;
  }
  
  return findById(id);
}

/**
 * ユーザーを削除
 * @param {string} id - ユーザーID
 * @returns {boolean} 削除成功の場合true
 */
function remove(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * パスワードを除いたユーザー情報を取得
 * @param {Object} user - ユーザーオブジェクト
 * @returns {Object} パスワードを除いたユーザー
 */
function toSafeUser(user) {
  if (!user) {
    return null;
  }
  
  const { password, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  create,
  findById,
  findByEmail,
  emailExists,
  update,
  remove,
  toSafeUser,
};
