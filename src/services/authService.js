/**
 * 認証サービス
 * ユーザー登録、ログイン、トークン管理のビジネスロジック
 */
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyToken, getAccessTokenExpiresInSeconds } = require('../utils/jwt');
const { unauthorized, conflict } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * 新規ユーザーを登録
 * @param {Object} userData - ユーザーデータ
 * @param {string} userData.email - メールアドレス
 * @param {string} userData.password - パスワード
 * @param {string} userData.name - ユーザー名
 * @returns {Promise<Object>} 作成されたユーザー（パスワード除く）
 */
async function register(userData) {
  // メールアドレスの重複チェック
  if (User.emailExists(userData.email)) {
    throw conflict('このメールアドレスは既に登録されています');
  }
  
  // パスワードをハッシュ化
  const hashedPassword = await hashPassword(userData.password);
  
  // ユーザーを作成
  const user = User.create({
    email: userData.email,
    password: hashedPassword,
    name: userData.name,
  });
  
  // 認証イベントをログ出力（FR-024）
  logger.authEvent('register', {
    userId: user.id,
    email: user.email,
  });
  
  return User.toSafeUser(user);
}

/**
 * ユーザーをログイン
 * @param {Object} credentials - ログイン情報
 * @param {string} credentials.email - メールアドレス
 * @param {string} credentials.password - パスワード
 * @returns {Promise<Object>} トークン情報
 */
async function login(credentials) {
  // ユーザーを検索
  const user = User.findByEmail(credentials.email);
  
  if (!user) {
    // セキュリティ: ユーザーが存在しない場合も同じエラーを返す
    logger.authEvent('login_failed', {
      email: credentials.email,
      reason: 'user_not_found',
    });
    throw unauthorized('メールアドレスまたはパスワードが正しくありません');
  }
  
  // パスワードを検証
  const isValidPassword = await verifyPassword(credentials.password, user.password);
  
  if (!isValidPassword) {
    logger.authEvent('login_failed', {
      userId: user.id,
      email: credentials.email,
      reason: 'invalid_password',
    });
    throw unauthorized('メールアドレスまたはパスワードが正しくありません');
  }
  
  // アクセストークンを生成
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  // リフレッシュトークンを生成
  const refreshToken = generateRefreshToken({
    userId: user.id,
  });
  
  // リフレッシュトークンをデータベースに保存
  RefreshToken.create({
    userId: user.id,
    token: refreshToken,
  });
  
  // 認証イベントをログ出力（FR-024）
  logger.authEvent('login', {
    userId: user.id,
    email: user.email,
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
}

/**
 * トークンを更新
 * @param {string} refreshTokenValue - リフレッシュトークン
 * @returns {Promise<Object>} 新しいトークン情報
 */
async function refresh(refreshTokenValue) {
  // トークンをデータベースから検索
  const tokenRecord = RefreshToken.findByToken(refreshTokenValue);
  
  if (!tokenRecord) {
    logger.authEvent('refresh_failed', {
      reason: 'token_not_found',
    });
    throw unauthorized('無効なリフレッシュトークンです');
  }
  
  // トークンの有効性をチェック
  if (!RefreshToken.isValid(tokenRecord)) {
    logger.authEvent('refresh_failed', {
      userId: tokenRecord.userId,
      reason: tokenRecord.revoked ? 'token_revoked' : 'token_expired',
    });
    throw unauthorized('リフレッシュトークンが無効または期限切れです');
  }
  
  // JWTとしてもトークンを検証
  const decoded = verifyToken(refreshTokenValue);
  
  if (!decoded || decoded.type !== 'refresh') {
    logger.authEvent('refresh_failed', {
      userId: tokenRecord.userId,
      reason: 'invalid_jwt',
    });
    throw unauthorized('無効なリフレッシュトークンです');
  }
  
  // ユーザー情報を取得
  const user = User.findById(tokenRecord.userId);
  
  if (!user) {
    logger.authEvent('refresh_failed', {
      userId: tokenRecord.userId,
      reason: 'user_not_found',
    });
    throw unauthorized('ユーザーが見つかりません');
  }
  
  // 古いリフレッシュトークンを無効化
  RefreshToken.revoke(refreshTokenValue);
  
  // 新しいトークンを生成
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  const newRefreshToken = generateRefreshToken({
    userId: user.id,
  });
  
  // 新しいリフレッシュトークンを保存
  RefreshToken.create({
    userId: user.id,
    token: newRefreshToken,
  });
  
  // 認証イベントをログ出力（FR-024）
  logger.authEvent('refresh', {
    userId: user.id,
    email: user.email,
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
}

/**
 * ログアウト
 * @param {string} refreshTokenValue - リフレッシュトークン
 * @param {string} userId - ユーザーID
 * @returns {Promise<void>}
 */
async function logout(refreshTokenValue, userId) {
  // トークンを無効化
  const revoked = RefreshToken.revoke(refreshTokenValue);
  
  // 認証イベントをログ出力（FR-024）
  logger.authEvent('logout', {
    userId,
    tokenRevoked: revoked,
  });
  
  return { message: 'ログアウトしました' };
}

/**
 * ユーザーの全トークンを無効化（セキュリティ用）
 * @param {string} userId - ユーザーID
 * @returns {Promise<number>} 無効化されたトークン数
 */
async function revokeAllTokens(userId) {
  const count = RefreshToken.revokeAllByUserId(userId);
  
  logger.authEvent('revoke_all_tokens', {
    userId,
    revokedCount: count,
  });
  
  return count;
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  revokeAllTokens,
};
