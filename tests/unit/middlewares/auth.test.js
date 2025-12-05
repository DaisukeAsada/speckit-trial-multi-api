/**
 * 認証ミドルウェアのユニットテスト
 */
const { authenticate, optionalAuthenticate, authorize, ownerOrAdmin } = require('../../../src/middlewares/auth');
const { connect, reset } = require('../../../src/config/database');
const { runMigrations } = require('../../../migrations');
const User = require('../../../src/models/User');
const { generateAccessToken, generateRefreshToken } = require('../../../src/utils/jwt');
const { hashPassword } = require('../../../src/utils/password');

describe('認証ミドルウェア', () => {
  let db;
  let testUser;
  let accessToken;

  beforeAll(async () => {
    db = connect();
    runMigrations(db);
  });

  afterAll(() => {
    reset();
  });

  beforeEach(async () => {
    db.exec('DELETE FROM refresh_tokens');
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM users');
    
    const hashedPassword = await hashPassword('Password123');
    testUser = User.create({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    });
    
    accessToken = generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });
  });

  describe('authenticate', () => {
    it('有効なトークンで認証成功', async () => {
      const req = { headers: { authorization: `Bearer ${accessToken}` } };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
    });

    it('トークンなしで認証失敗', async () => {
      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('不正なトークン形式で認証失敗', async () => {
      const req = { headers: { authorization: 'InvalidFormat' } };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('無効なトークンで認証失敗', async () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('リフレッシュトークンで認証失敗', async () => {
      const refreshToken = generateRefreshToken({ userId: testUser.id });
      const req = { headers: { authorization: `Bearer ${refreshToken}` } };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });

    it('存在しないユーザーで認証失敗', async () => {
      const token = generateAccessToken({
        userId: '00000000-0000-0000-0000-000000000000',
        email: 'nonexistent@example.com',
        role: 'user',
      });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });
  });

  describe('optionalAuthenticate', () => {
    it('トークンなしでもパス', async () => {
      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('有効なトークンでユーザー情報取得', async () => {
      const req = { headers: { authorization: `Bearer ${accessToken}` } };
      const res = {};
      const next = jest.fn();

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
    });

    it('不正なトークン形式でもパス', async () => {
      const req = { headers: { authorization: 'InvalidFormat' } };
      const res = {};
      const next = jest.fn();

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('無効なトークンでもパス', async () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } };
      const res = {};
      const next = jest.fn();

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });
  });

  describe('authorize', () => {
    it('許可されたロールで通過', () => {
      const middleware = authorize('user', 'admin');
      const req = { user: { id: '1', role: 'user' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('許可されていないロールで拒否', () => {
      const middleware = authorize('admin');
      const req = { user: { id: '1', role: 'user' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
      }));
    });

    it('未認証で拒否', () => {
      const middleware = authorize('user');
      const req = {};
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });
  });

  describe('ownerOrAdmin', () => {
    it('オーナーで通過', async () => {
      const getOwnerId = jest.fn().mockResolvedValue('user-123');
      const middleware = ownerOrAdmin(getOwnerId);
      const req = { user: { id: 'user-123', role: 'user' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('adminで通過', async () => {
      const getOwnerId = jest.fn().mockResolvedValue('different-user');
      const middleware = ownerOrAdmin(getOwnerId);
      const req = { user: { id: 'admin-id', role: 'admin' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(getOwnerId).not.toHaveBeenCalled();
    });

    it('オーナーでもadminでもない場合拒否', async () => {
      const getOwnerId = jest.fn().mockResolvedValue('different-user');
      const middleware = ownerOrAdmin(getOwnerId);
      const req = { user: { id: 'user-123', role: 'user' } };
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
      }));
    });

    it('未認証で拒否', async () => {
      const getOwnerId = jest.fn();
      const middleware = ownerOrAdmin(getOwnerId);
      const req = {};
      const res = {};
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
      }));
    });
  });
});
