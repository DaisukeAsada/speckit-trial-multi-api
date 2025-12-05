/**
 * 記事API統合テスト: 記事一覧取得
 * GET /api/v1/posts のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('GET /api/v1/posts', () => {
  let db;
  let accessToken;

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
        email: 'list-test@example.com',
        password: 'Password123',
        name: '一覧テスト',
      });
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'list-test@example.com',
        password: 'Password123',
      });
    
    accessToken = loginResponse.body.accessToken;
    
    // テスト用記事を複数作成
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `テスト記事 ${i}`,
          content: `記事${i}の本文`,
          status: i <= 3 ? 'published' : 'draft',
        });
    }
  });

  describe('正常系', () => {
    it('認証なしで記事一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('ページネーション情報を含む', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('ステータスでフィルタリングできる', async () => {
      const response = await request(app)
        .get('/api/v1/posts?status=published')
        .expect(200);

      expect(response.body.posts.every(p => p.status === 'published')).toBe(true);
      expect(response.body.pagination.total).toBe(3);
    });

    it('下書き記事もフィルタリングできる', async () => {
      const response = await request(app)
        .get('/api/v1/posts?status=draft')
        .expect(200);

      expect(response.body.posts.every(p => p.status === 'draft')).toBe(true);
      expect(response.body.pagination.total).toBe(2);
    });

    it('ページ番号を指定できる', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=1&limit=2')
        .expect(200);

      expect(response.body.posts.length).toBe(2);
      expect(Number(response.body.pagination.page)).toBe(1);
      expect(Number(response.body.pagination.limit)).toBe(2);
    });

    it('ソート順を指定できる（createdAt:asc）', async () => {
      const response = await request(app)
        .get('/api/v1/posts?sort=createdAt:asc')
        .expect(200);

      const dates = response.body.posts.map(p => new Date(p.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true);
      }
    });

    it('デフォルトでは作成日時の降順でソートされる', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .expect(200);

      const dates = response.body.posts.map(p => new Date(p.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] <= dates[i - 1]).toBe(true);
      }
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('ページ番号が0以下の場合は400エラー', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=0')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('取得件数が100を超える場合は400エラー', async () => {
      const response = await request(app)
        .get('/api/v1/posts?limit=101')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('無効なステータスの場合は400エラー', async () => {
      const response = await request(app)
        .get('/api/v1/posts?status=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('無効なソート形式の場合は400エラー', async () => {
      const response = await request(app)
        .get('/api/v1/posts?sort=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('エッジケース', () => {
    it('記事がない場合は空配列を返す', async () => {
      db.exec('DELETE FROM posts');
      
      const response = await request(app)
        .get('/api/v1/posts')
        .expect(200);

      expect(response.body.posts).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('存在しないページを指定した場合は空配列を返す', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=100')
        .expect(200);

      expect(response.body.posts).toEqual([]);
    });
  });
});
