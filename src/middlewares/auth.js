/**
 * 認証ミドルウェア
 * JWTトークンの検証とユーザー認証を担当
 */
const { verifyToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('./errorHandler');
const User = require('../models/User');

/**
 * 認証必須ミドルウェア
 * Authorization: Bearer <token> ヘッダーからトークンを検証
 * @param {Object} req - リクエスト
 * @param {Object} res - レスポンス
 * @param {Function} next - 次のミドルウェア
 */
async function authenticate(req, res, next) {
  try {
    // Authorization ヘッダーを取得
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw unauthorized('認証トークンが必要です');
    }
    
    // Bearer トークンを抽出
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw unauthorized('トークン形式が不正です');
    }
    
    const token = parts[1];
    
    // トークンを検証
    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw unauthorized('無効なトークンです');
    }
    
    // トークンタイプを確認
    if (decoded.type !== 'access') {
      throw unauthorized('アクセストークンが必要です');
    }
    
    // ユーザーを取得
    const user = User.findById(decoded.userId);
    
    if (!user) {
      throw unauthorized('ユーザーが見つかりません');
    }
    
    // リクエストにユーザー情報を付加
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 認証オプショナルミドルウェア
 * トークンがあれば検証、なければスキップ
 * @param {Object} req - リクエスト
 * @param {Object} res - レスポンス
 * @param {Function} next - 次のミドルウェア
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }
    
    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (decoded && decoded.type === 'access') {
      const user = User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }
    
    next();
  } catch (error) {
    // オプショナル認証ではエラーをスキップ
    next();
  }
}

/**
 * ロールベース認可ミドルウェア
 * 指定されたロールを持つユーザーのみ許可
 * @param  {...string} roles - 許可するロール
 * @returns {Function} ミドルウェア関数
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized('認証が必要です'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(forbidden('この操作を行う権限がありません'));
    }
    
    next();
  };
}

/**
 * リソース所有者チェックミドルウェア
 * ユーザーが自分のリソースにのみアクセスできることを確認
 * adminは全てのリソースにアクセス可能
 * @param {Function} getOwnerId - リクエストからオーナーIDを取得する関数
 * @returns {Function} ミドルウェア関数
 */
function ownerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(unauthorized('認証が必要です'));
      }
      
      // adminは全てのリソースにアクセス可能
      if (req.user.role === 'admin') {
        return next();
      }
      
      // オーナーIDを取得
      const ownerId = await getOwnerId(req);
      
      if (ownerId !== req.user.id) {
        return next(forbidden('この操作を行う権限がありません'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  ownerOrAdmin,
};
