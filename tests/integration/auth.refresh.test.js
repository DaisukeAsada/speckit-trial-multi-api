/**
 * 認証API統合テスト: トークン更新
 * POST /api/v1/auth/refresh のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('POST /api/v1/auth/refresh', () => {
  let db;
  let testCounter = 0;

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
    testCounter++;
  });

  // ユニークなテストユーザーを作成するヘルパー
  async function createTestUser(suffix = '') {
    const email = `refresh-test-${testCounter}${suffix}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'Password123',
        name: 'リフレッシュテスト',
      });
    return email;
  }

  // ログインしてトークンを取得するヘルパー
  async function loginAndGetTokens(email) {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'Password123',
      });
    return {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
    };
  }

  describe('正常系', () => {
    it('有効なリフレッシュトークンで新しいトークンを取得できる', async () => {
      const email = await createTestUser();
      const { refreshToken } = await loginAndGetTokens(email);
      
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      // 新しいトークンは元のトークンと異なる
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it('新しいトークンで認証できる', async () => {
      const email = await createTestUser();
      const { refreshToken } = await loginAndGetTokens(email);

      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;
      const newRefreshToken = refreshResponse.body.refreshToken;

      // 新しいアクセストークンでログアウト
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken: newRefreshToken })
        .expect(200);

      expect(logoutResponse.body.message).toContain('ログアウト');
    });

    it('リフレッシュ後、古いトークンは無効化される', async () => {
      const email = await createTestUser();
      const { refreshToken } = await loginAndGetTokens(email);
      
      // リフレッシュ
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // 古いトークンでリフレッシュしようとすると失敗
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });
  });

  describe('異常系: 無効なトークン', () => {
    it('存在しないトークンの場合は401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('無効');
    });

    it('トークンが空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: '' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('トークンフィールドがない場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
