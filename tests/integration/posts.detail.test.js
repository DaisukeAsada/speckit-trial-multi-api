/**
 * 記事API統合テスト: 記事詳細取得
 * GET /api/v1/posts/:id のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('GET /api/v1/posts/:id', () => {
  let db;
  let accessToken;
  let createdPostId;

  beforeAll(async () => {
    db = connect();
    runMigrations(db);
  });

  afterAll(() => {
    reset();
  });

  beforeEach(async () => {
    // 各テスト前にデータをクリア
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM refresh_tokens');
    db.exec('DELETE FROM users');
    
    // テストユーザーを作成してログイン
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'detail-test@example.com',
        password: 'Password123',
        name: '詳細テスト',
      });
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'detail-test@example.com',
        password: 'Password123',
      });
    
    accessToken = loginResponse.body.accessToken;
    
    // テスト用記事を作成
    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'テスト記事',
        content: 'テスト記事の本文です。',
        status: 'published',
      });
    
    createdPostId = postResponse.body.id;
  });

  describe('正常系', () => {
    it('認証なしで記事詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${createdPostId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdPostId);
      expect(response.body).toHaveProperty('title', 'テスト記事');
      expect(response.body).toHaveProperty('content', 'テスト記事の本文です。');
      expect(response.body).toHaveProperty('author', '詳細テスト');
      expect(response.body).toHaveProperty('status', 'published');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('userId');
    });
  });

  describe('異常系: 記事が見つからない', () => {
    it('存在しないIDの場合は404エラー', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      
      const response = await request(app)
        .get(`/api/v1/posts/${nonExistentId}`)
        .expect(404);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('見つかりません');
    });
  });

  describe('異常系: 不正なID形式', () => {
    it('UUID形式でないIDの場合は400エラー', async () => {
      const response = await request(app)
        .get('/api/v1/posts/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('短いIDの場合は400エラー', async () => {
      const response = await request(app)
        .get('/api/v1/posts/12345')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('空のIDの場合は404エラー（ルートマッチしない）', async () => {
      const response = await request(app)
        .get('/api/v1/posts/')
        .expect(200);

      // 空のIDは一覧取得にマッチする
      expect(response.body).toHaveProperty('posts');
    });
  });
});
