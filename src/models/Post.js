/**
 * Postモデル
 * 記事エンティティのデータアクセスを担当
 */
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');

/**
 * 新規記事を作成
 * @param {Object} postData - 記事データ
 * @param {string} postData.userId - 作成者のユーザーID
 * @param {string} postData.title - 記事タイトル
 * @param {string} postData.content - 記事本文
 * @param {string} postData.author - 著者名
 * @param {string} postData.status - ステータス（オプション、デフォルト: 'draft'）
 * @returns {Object} 作成された記事
 */
function create(postData) {
  const db = getDatabase();
  const id = uuidv4();
  const status = postData.status || 'draft';
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO posts (id, user_id, title, content, author, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, postData.userId, postData.title, postData.content, postData.author, status, now, now);
  
  return findById(id);
}

/**
 * IDで記事を検索
 * @param {string} id - 記事ID
 * @returns {Object|null} 記事またはnull
 */
function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, user_id as userId, title, content, author, status,
           created_at as createdAt, updated_at as updatedAt
    FROM posts WHERE id = ?
  `);
  
  return stmt.get(id) || null;
}

/**
 * 記事一覧を取得
 * @param {Object} options - 取得オプション
 * @param {number} options.page - ページ番号（1から開始）
 * @param {number} options.limit - 1ページあたりの件数
 * @param {string} options.status - ステータスフィルター（オプション）
 * @param {string} options.sort - ソート（フィールド:方向）
 * @returns {Object} 記事一覧と総件数
 */
function findAll(options = {}) {
  const db = getDatabase();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;
  
  // WHERE句の構築
  const conditions = [];
  const params = [];
  
  if (options.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // ソート順の解析
  let orderClause = 'ORDER BY created_at DESC';
  if (options.sort) {
    const [field, direction] = options.sort.split(':');
    const fieldMap = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      title: 'title',
    };
    const sortField = fieldMap[field] || 'created_at';
    const sortDirection = direction === 'asc' ? 'ASC' : 'DESC';
    orderClause = `ORDER BY ${sortField} ${sortDirection}`;
  }
  
  // 総件数を取得
  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM posts ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;
  
  // 記事を取得
  const stmt = db.prepare(`
    SELECT id, user_id as userId, title, content, author, status,
           created_at as createdAt, updated_at as updatedAt
    FROM posts
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `);
  
  const posts = stmt.all(...params, limit, offset);
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * ユーザーの記事一覧を取得
 * @param {string} userId - ユーザーID
 * @param {Object} options - 取得オプション
 * @returns {Object} 記事一覧と総件数
 */
function findByUserId(userId, options = {}) {
  const db = getDatabase();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;
  
  // 総件数を取得
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM posts WHERE user_id = ?');
  const countResult = countStmt.get(userId);
  const total = countResult.total;
  
  // 記事を取得
  const stmt = db.prepare(`
    SELECT id, user_id as userId, title, content, author, status,
           created_at as createdAt, updated_at as updatedAt
    FROM posts
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const posts = stmt.all(userId, limit, offset);
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 記事を更新
 * @param {string} id - 記事ID
 * @param {Object} updates - 更新データ
 * @returns {Object|null} 更新された記事またはnull
 */
function update(id, updates) {
  const db = getDatabase();
  const fields = ['updated_at = ?'];
  const values = [new Date().toISOString()];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE posts SET ${fields.join(', ')} WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  
  if (result.changes === 0) {
    return null;
  }
  
  return findById(id);
}

/**
 * 記事を削除（物理削除）
 * @param {string} id - 記事ID
 * @returns {boolean} 削除成功の場合true
 */
function remove(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

module.exports = {
  create,
  findById,
  findAll,
  findByUserId,
  update,
  remove,
};
