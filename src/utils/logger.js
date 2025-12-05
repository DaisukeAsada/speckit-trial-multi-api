/**
 * ロガーユーティリティ
 * アプリケーション全体のログ出力を管理
 */
const config = require('../config');

/**
 * ログレベルの定義
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * 現在のログレベルを取得
 */
function getCurrentLogLevel() {
  if (config.isTest) {
    return LOG_LEVELS.error; // テスト時はエラーのみ
  }
  if (config.isProduction) {
    return LOG_LEVELS.info; // 本番はinfo以上
  }
  return LOG_LEVELS.debug; // 開発時は全て
}

/**
 * タイムスタンプを取得
 * @returns {string} ISO 8601形式のタイムスタンプ
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * ログ出力の共通処理
 * @param {string} level - ログレベル
 * @param {string} message - ログメッセージ
 * @param {Object} meta - 追加メタデータ
 */
function log(level, message, meta = {}) {
  const currentLevel = getCurrentLogLevel();
  
  if (LOG_LEVELS[level] > currentLevel) {
    return;
  }
  
  const logEntry = {
    timestamp: getTimestamp(),
    level: level.toUpperCase(),
    message,
    ...meta,
  };
  
  const output = JSON.stringify(logEntry);
  
  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * ロガーオブジェクト
 */
const logger = {
  /**
   * エラーログ
   * @param {string} message - ログメッセージ
   * @param {Object} meta - 追加メタデータ
   */
  error(message, meta = {}) {
    log('error', message, meta);
  },
  
  /**
   * 警告ログ
   * @param {string} message - ログメッセージ
   * @param {Object} meta - 追加メタデータ
   */
  warn(message, meta = {}) {
    log('warn', message, meta);
  },
  
  /**
   * 情報ログ
   * @param {string} message - ログメッセージ
   * @param {Object} meta - 追加メタデータ
   */
  info(message, meta = {}) {
    log('info', message, meta);
  },
  
  /**
   * デバッグログ
   * @param {string} message - ログメッセージ
   * @param {Object} meta - 追加メタデータ
   */
  debug(message, meta = {}) {
    log('debug', message, meta);
  },
  
  /**
   * 認証イベントログ（FR-024対応）
   * @param {string} event - イベント種別（login, logout, register, refresh）
   * @param {Object} details - イベント詳細
   */
  authEvent(event, details = {}) {
    log('info', `Auth event: ${event}`, {
      type: 'auth_event',
      event,
      ...details,
    });
  },
};

module.exports = logger;
