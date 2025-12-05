/**
 * 記事API統合テスト: 記事作成
 * POST /api/v1/posts のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('POST /api/v1/posts', () => {
  let db;
  let accessToken;
  const testUser = {
    email: 'post-test@example.com',
    password: 'Password123',
    name: 'テスト記事作成者',
  };

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
      .send(testUser);
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    
    accessToken = loginResponse.body.accessToken;
  });

  describe('正常系', () => {
    it('認証済みユーザーが記事を作成できる', async () => {
      const postData = {
        title: 'テスト記事タイトル',
        content: 'これはテスト記事の本文です。',
        status: 'draft',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(postData.title);
      expect(response.body.content).toBe(postData.content);
      expect(response.body.status).toBe('draft');
      expect(response.body.author).toBe(testUser.name); // 著者名は自動設定
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('ステータスを指定しない場合はデフォルトでdraftになる', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'デフォルトステータステスト',
          content: '本文',
        })
        .expect(201);

      expect(response.body.status).toBe('draft');
    });

    it('publishedステータスで記事を作成できる', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '公開記事',
          content: '公開する記事の本文',
          status: 'published',
        })
        .expect(201);

      expect(response.body.status).toBe('published');
    });

    it('日本語タイトルと本文で記事を作成できる', async () => {
      const postData = {
        title: '日本語のタイトル テスト',
        content: 'これは日本語の本文です。特殊文字（）「」も含みます。',
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.title).toBe(postData.title);
      expect(response.body.content).toBe(postData.content);
    });
  });

  describe('異常系: 認証エラー', () => {
    it('認証なしでリクエストすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .send({
          title: 'テスト',
          content: '本文',
        })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });

    it('無効なトークンでリクエストすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'テスト',
          content: '本文',
        })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('タイトルが空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          content: '本文',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('タイトルが200文字を超える場合は400エラー', async () => {
      const longTitle = 'あ'.repeat(201);
      
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: longTitle,
          content: '本文',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('本文が空の場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'タイトル',
          content: '',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('不正なステータスの場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'タイトル',
          content: '本文',
          status: 'invalid-status',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('タイトルが空白のみの場合は400エラー', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '   ',
          content: '本文',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
