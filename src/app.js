/**
 * Express アプリケーション設定
 * ミドルウェアとルーティングの設定を担当
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// アプリケーション作成
const app = express();

// セキュリティミドルウェア
app.use(helmet());

// CORS設定
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// JSONボディパーサー（64KB制限）
app.use(express.json({ limit: '64kb' }));

// URLエンコードボディパーサー
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// APIバージョニング用のプレフィックス
const API_PREFIX = '/api/v1';

// ルートの登録
app.use(`${API_PREFIX}/auth`, require('./routes/authRoutes'));
app.use(`${API_PREFIX}/posts`, require('./routes/postRoutes'));

// 404ハンドラー
app.use(notFoundHandler);

// エラーハンドラー
app.use(errorHandler);

module.exports = app;
