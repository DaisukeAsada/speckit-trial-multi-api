/**
 * エラーハンドラミドルウェアのユニットテスト
 */
const {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,
  errorHandler,
} = require('../../../src/middlewares/errorHandler');

describe('エラーハンドラ', () => {
  describe('ApiError', () => {
    it('ApiErrorインスタンスを作成', () => {
      const error = new ApiError(400, 'テストエラー');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('テストエラー');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('エラー生成関数', () => {
    it('badRequestで400エラー生成', () => {
      const error = badRequest('不正なリクエスト');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('不正なリクエスト');
    });

    it('unauthorizedで401エラー生成', () => {
      const error = unauthorized('認証エラー');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('認証エラー');
    });

    it('forbiddenで403エラー生成', () => {
      const error = forbidden('アクセス禁止');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('アクセス禁止');
    });

    it('notFoundで404エラー生成', () => {
      const error = notFound('見つかりません');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('見つかりません');
    });

    it('conflictで409エラー生成', () => {
      const error = conflict('競合');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('競合');
    });

    it('internalErrorで500エラー生成', () => {
      const error = internalError('内部エラー');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('内部エラー');
    });
  });

  describe('errorHandler ミドルウェア', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = { method: 'GET', path: '/test' };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('ApiErrorを適切に処理', () => {
      const error = badRequest('テストエラー');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'ApiError',
        message: 'テストエラー',
      }));
    });

    it('通常のErrorを500として処理', () => {
      const error = new Error('予期せぬエラー');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal Server Error',
      }));
    });

    it('SQLiteのUNIQUEエラーを409として処理', () => {
      const error = new Error('UNIQUE constraint failed: users.email');
      error.code = 'SQLITE_CONSTRAINT_UNIQUE';
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });
});
