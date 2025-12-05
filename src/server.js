/**
 * サーバーエントリーポイント
 * アプリケーションの起動を担当
 */
const app = require('./app');
const config = require('./config');
const { connect } = require('./config/database');
const { runMigrations } = require('../migrations');
const logger = require('./utils/logger');

/**
 * サーバーを起動
 */
async function startServer() {
  try {
    // データベース接続
    logger.info('Connecting to database...');
    const db = connect();
    
    // マイグレーション実行
    logger.info('Running migrations...');
    runMigrations(db);
    
    // サーバー起動
    const server = app.listen(config.port, () => {
      logger.info(`Server started`, {
        port: config.port,
        environment: config.nodeEnv,
      });
    });
    
    // グレースフルシャットダウン
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// サーバー起動
startServer();
