/**
 * 認証API統合テスト: ログイン
 * POST /api/v1/auth/login のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('POST /api/v1/auth/login', () => {
  let db;
  const testUser = {
    email: 'login-test@example.com',
    password: 'Password123',
    name: 'ログインテストユーザー',
  };

  beforeAll(async () => {
    // テスト用データベースに接続
    db = connect();
    runMigrations(db);
  });

  afterAll(() => {
    reset();
  });

  beforeEach(async () => {
    // 各テスト前にデータをクリア
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM refresh_tokens');
    
    // テストユーザーを作成
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
  });

  describe('正常系', () => {
    it('正しい認証情報でログインできる', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(typeof response.body.expiresIn).toBe('number');
    });

    it('取得したアクセストークンで認証済みエンドポイントにアクセスできる', async () => {
      // ログイン
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body;

      // ログアウト（認証必須エンドポイント）
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(logoutResponse.body.message).toContain('ログアウト');
    });
  });

  describe('異常系: 認証失敗', () => {
    it('存在しないメールアドレスでログインすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('メールアドレスまたはパスワード');
    });

    it('間違ったパスワードでログインすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('メールアドレスまたはパスワード');
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('メールアドレスが不正な形式の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('パスワードが短すぎる場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'short',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('メールアドレスが空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: 'Password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('パスワードが空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: '',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('セキュリティ', () => {
    it('レスポンスにパスワード情報が含まれない', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('password');
    });

    it('存在しないユーザーと間違ったパスワードで同じエラーメッセージを返す', async () => {
      // 存在しないユーザー
      const response1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
        .expect(401);

      // 間違ったパスワード
      const response2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      // 同じエラーメッセージを返すことでユーザーの存在を推測されにくくする
      expect(response1.body.message).toBe(response2.body.message);
    });
  });
});
