/**
 * 認証API統合テスト: ログアウト
 * POST /api/v1/auth/logout のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('POST /api/v1/auth/logout', () => {
  let db;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    db = connect();
    runMigrations(db);
  });

  afterAll(() => {
    reset();
  });

  beforeEach(async () => {
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM refresh_tokens');
    db.exec('DELETE FROM users');
    
    // テストユーザーを作成してログイン
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'logout-test@example.com',
        password: 'Password123',
        name: 'ログアウトテスト',
      });
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'logout-test@example.com',
        password: 'Password123',
      });
    
    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;
  });

  describe('正常系', () => {
    it('認証済みユーザーがログアウトできる', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toContain('ログアウト');
    });

    it('ログアウト後、リフレッシュトークンは無効化される', async () => {
      // ログアウト
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // 無効化されたトークンでリフレッシュしようとすると失敗
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });
  });

  describe('異常系: 認証エラー', () => {
    it('認証なしでリクエストすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });

    it('無効なアクセストークンでリクエストすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('リフレッシュトークンが空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: '' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('リフレッシュトークンフィールドがない場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
