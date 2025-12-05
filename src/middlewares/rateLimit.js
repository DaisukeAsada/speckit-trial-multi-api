/**
 * レート制限ミドルウェア
 * APIリクエストの頻度を制限
 */
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { tooManyRequests } = require('./errorHandler');

/**
 * 認証エンドポイント用レート制限
 * 1分あたり5リクエストに制限（ブルートフォース対策）
 */
const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'リクエスト制限を超えました。しばらく待ってから再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // テスト環境ではレート制限を無効化
  skip: () => config.isTest,
  handler: (_req, res, _next, _options) => {
    const err = tooManyRequests();
    res.status(err.statusCode).json({
      error: 'Too Many Requests',
      message: err.message,
    });
  },
});

/**
 * 一般API用レート制限（より緩い設定）
 * 1分あたり100リクエストに制限
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 100,
  message: {
    error: 'Too Many Requests',
    message: 'リクエスト制限を超えました。しばらく待ってから再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
});

module.exports = {
  authRateLimiter,
  generalRateLimiter,
};
