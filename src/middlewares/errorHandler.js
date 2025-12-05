/**
 * エラーハンドラーミドルウェア
 * アプリケーション全体のエラー処理を担当
 */
const logger = require('../utils/logger');

/**
 * カスタムエラークラス: APIエラー
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTPステータスコード
   * @param {string} message - エラーメッセージ
   * @param {Object} details - 追加詳細情報（オプション）
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * 400 Bad Request エラーを生成
 * @param {string} message - エラーメッセージ
 * @param {Object} details - 追加詳細情報
 * @returns {ApiError} APIエラー
 */
function badRequest(message = 'Bad Request', details = null) {
  return new ApiError(400, message, details);
}

/**
 * 401 Unauthorized エラーを生成
 * @param {string} message - エラーメッセージ
 * @returns {ApiError} APIエラー
 */
function unauthorized(message = '認証が必要です') {
  return new ApiError(401, message);
}

/**
 * 403 Forbidden エラーを生成
 * @param {string} message - エラーメッセージ
 * @returns {ApiError} APIエラー
 */
function forbidden(message = 'アクセス権限がありません') {
  return new ApiError(403, message);
}

/**
 * 404 Not Found エラーを生成
 * @param {string} message - エラーメッセージ
 * @returns {ApiError} APIエラー
 */
function notFound(message = 'リソースが見つかりません') {
  return new ApiError(404, message);
}

/**
 * 409 Conflict エラーを生成
 * @param {string} message - エラーメッセージ
 * @returns {ApiError} APIエラー
 */
function conflict(message = 'リソースが既に存在します') {
  return new ApiError(409, message);
}

/**
 * 429 Too Many Requests エラーを生成
 * @param {string} message - エラーメッセージ
 * @returns {ApiError} APIエラー
 */
function tooManyRequests(message = 'リクエスト制限を超えました。しばらく待ってから再試行してください') {
  return new ApiError(429, message);
}

/**
 * 500 Internal Server Error エラーを生成
 * @param {string} message - エラーメッセージ
 * @returns {ApiError} APIエラー
 */
function internalError(message = 'サーバー内部エラーが発生しました') {
  return new ApiError(500, message);
}

/**
 * エラーハンドラーミドルウェア
 * @param {Error} err - エラーオブジェクト
 * @param {Object} req - リクエスト
 * @param {Object} res - レスポンス
 * @param {Function} _next - 次のミドルウェア（未使用）
 */
function errorHandler(err, req, res, _next) {
  // エラーログ出力
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // APIエラーの場合
  if (err instanceof ApiError) {
    const response = {
      error: err.name,
      message: err.message,
    };
    
    if (err.details) {
      response.details = err.details;
    }
    
    return res.status(err.statusCode).json(response);
  }
  
  // JWT関連エラー
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '無効なトークンです',
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'トークンの有効期限が切れています',
    });
  }
  
  // SQLiteエラー（重複など）
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'データが既に存在します',
    });
  }
  
  // その他の予期しないエラー
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'サーバー内部エラーが発生しました',
  });
}

/**
 * 404エラーハンドラー
 * @param {Object} req - リクエスト
 * @param {Object} res - レスポンス
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} は存在しません`,
  });
}

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  errorHandler,
  notFoundHandler,
};
