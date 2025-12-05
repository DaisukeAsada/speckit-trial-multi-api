/**
 * JWTユーティリティのユニットテスト
 */
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  getAccessTokenExpiresInSeconds,
} = require('../../../src/utils/jwt');

describe('JWTユーティリティ', () => {
  const testPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  };

  describe('generateAccessToken', () => {
    it('有効なアクセストークンを生成', () => {
      const token = generateAccessToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('ペイロードにtypeが含まれる', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      expect(decoded.type).toBe('access');
      expect(decoded.userId).toBe(testPayload.userId);
    });
  });

  describe('generateRefreshToken', () => {
    it('有効なリフレッシュトークンを生成', () => {
      const token = generateRefreshToken({ userId: testPayload.userId });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('ペイロードにtypeとjtiが含まれる', () => {
      const token = generateRefreshToken({ userId: testPayload.userId });
      const decoded = decodeToken(token);
      expect(decoded.type).toBe('refresh');
      expect(decoded.jti).toBeDefined();
    });

    it('同じuserIdでも異なるトークンを生成', () => {
      const token1 = generateRefreshToken({ userId: testPayload.userId });
      const token2 = generateRefreshToken({ userId: testPayload.userId });
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('有効なトークンを検証できる', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('無効なトークンはnullを返す', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('改ざんされたトークンはnullを返す', () => {
      const token = generateAccessToken(testPayload);
      const tamperedToken = token.slice(0, -1) + 'x';
      const decoded = verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('トークンをデコードできる', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('検証なしでデコードする', () => {
      const token = generateAccessToken(testPayload);
      const tamperedToken = token.slice(0, -1) + 'x';
      // 改ざんされていてもデコードできる（検証はしない）
      const decoded = decodeToken(tamperedToken);
      expect(decoded).toBeDefined();
    });
  });

  describe('getAccessTokenExpiresInSeconds', () => {
    it('秒数を返す', () => {
      const seconds = getAccessTokenExpiresInSeconds();
      expect(typeof seconds).toBe('number');
      expect(seconds).toBeGreaterThan(0);
    });
  });
});
