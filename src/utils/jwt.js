/**
 * JWTユーティリティ
 * JWTトークンの生成と検証を担当
 */
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * アクセストークンを生成
 * @param {Object} payload - トークンペイロード
 * @param {string} payload.userId - ユーザーID
 * @param {string} payload.email - メールアドレス
 * @param {string} payload.role - ユーザーロール
 * @returns {string} JWTアクセストークン
 */
function generateAccessToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: 'access',
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.accessExpiresIn,
    }
  );
}

/**
 * リフレッシュトークンを生成
 * jtiを追加してトークンのユニーク性を確保
 * @param {Object} payload - トークンペイロード
 * @param {string} payload.userId - ユーザーID
 * @returns {string} JWTリフレッシュトークン
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      type: 'refresh',
      jti: uuidv4(), // トークン毎にユニークなIDを付与
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    }
  );
}

/**
 * トークンを検証
 * @param {string} token - JWTトークン
 * @returns {Object|null} デコードされたペイロード、または無効な場合null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

/**
 * トークンをデコード（検証なし）
 * @param {string} token - JWTトークン
 * @returns {Object|null} デコードされたペイロード
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * アクセストークンの有効期限（秒）を取得
 * @returns {number} 有効期限（秒）
 */
function getAccessTokenExpiresInSeconds() {
  const expiresIn = config.jwt.accessExpiresIn;
  
  // 数値の場合はそのまま返す
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }
  
  // 文字列の場合は秒に変換
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // デフォルト1時間
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 3600;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  getAccessTokenExpiresInSeconds,
};
