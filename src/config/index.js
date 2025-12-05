/**
 * 環境設定モジュール
 * アプリケーション全体の設定を管理
 */
require('dotenv').config();

const config = {
  // サーバー設定
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT設定
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // データベース設定
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    path: process.env.DB_PATH || './data/blog.db',
    url: process.env.DATABASE_URL || null,
  },
  
  // CORS設定
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  // レート制限設定（1分あたりのリクエスト数）
  rateLimit: {
    windowMs: 60 * 1000, // 1分
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5,
  },
  
  // テスト環境判定
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = config;
