/**
 * 認証API統合テスト: ユーザー登録
 * POST /api/v1/auth/register のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('POST /api/v1/auth/register', () => {
  let db;

  beforeAll(() => {
    // テスト用データベースに接続
    db = connect();
    runMigrations(db);
  });

  afterAll(() => {
    reset();
  });

  beforeEach(() => {
    // 各テスト前にデータをクリア
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM refresh_tokens');
  });

  describe('正常系', () => {
    it('有効なデータで新規ユーザーを登録できる', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'テストユーザー',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body.role).toBe('user');
      expect(response.body).not.toHaveProperty('password');
    });

    it('登録後にログインできる', async () => {
      const userData = {
        email: 'login-test@example.com',
        password: 'Password123',
        name: 'ログインテスト',
      };

      // まず登録
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // その後ログイン
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('メールアドレスが不正な形式の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          name: 'テスト',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('パスワードが8文字未満の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Pass1',
          name: 'テスト',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    it('パスワードに英字が含まれない場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345678',
          name: 'テスト',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('パスワードに数字が含まれない場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'PasswordOnly',
          name: 'テスト',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('名前が空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: '',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
        ])
      );
    });

    it('名前が100文字を超える場合は400エラー', async () => {
      const longName = 'あ'.repeat(101);
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: longName,
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('必須フィールドが欠けている場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('異常系: メールアドレス重複', () => {
    it('既存のメールアドレスで登録しようとすると409エラー', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123',
        name: 'テストユーザー',
      };

      // 最初の登録
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // 同じメールアドレスで再度登録
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'DifferentPass123',
          name: '別のユーザー',
        })
        .expect(409);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('メールアドレス');
    });
  });
});
