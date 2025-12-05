/**
 * ロガーユーティリティのユニットテスト
 * 注: テスト環境ではエラーレベルのみが出力されるため、
 * 他のレベルのテストはconsoleメソッドの呼び出しのみ確認
 */
const logger = require('../../../src/utils/logger');

describe('logger', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info', () => {
    it('info関数が正常に実行される', () => {
      // テスト環境ではログレベルが制限されているため、関数が例外を投げないことを確認
      expect(() => logger.info('テストメッセージ')).not.toThrow();
    });

    it('メタデータ付きで呼び出し可能', () => {
      expect(() => logger.info('テストメッセージ', { key: 'value' })).not.toThrow();
    });
  });

  describe('warn', () => {
    it('warn関数が正常に実行される', () => {
      expect(() => logger.warn('警告メッセージ')).not.toThrow();
    });
  });

  describe('error', () => {
    it('errorレベルでログ出力', () => {
      logger.error('エラーメッセージ');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('Errorオブジェクト付きでログ出力', () => {
      const error = new Error('テストエラー');
      logger.error('エラー発生', { error });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('debug関数が正常に実行される', () => {
      expect(() => logger.debug('デバッグメッセージ')).not.toThrow();
    });
  });

  describe('authEvent', () => {
    it('認証イベントを正常に処理', () => {
      // テスト環境ではinfoレベルは出力されないが、関数は正常に動作する
      expect(() => logger.authEvent('login', { userId: '123', email: 'test@example.com' })).not.toThrow();
    });
  });
});
