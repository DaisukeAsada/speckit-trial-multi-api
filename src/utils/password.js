/**
 * パスワードユーティリティ
 * パスワードのハッシュ化と検証を担当
 */
const bcrypt = require('bcrypt');

/**
 * ソルトラウンド数
 * 本番環境では12を推奨（パフォーマンスとセキュリティのバランス）
 */
const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 * @param {string} password - 平文パスワード
 * @returns {Promise<string>} ハッシュ化されたパスワード
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証
 * @param {string} password - 平文パスワード
 * @param {string} hashedPassword - ハッシュ化されたパスワード
 * @returns {Promise<boolean>} 一致する場合true
 */
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

module.exports = {
  hashPassword,
  verifyPassword,
  SALT_ROUNDS,
};
