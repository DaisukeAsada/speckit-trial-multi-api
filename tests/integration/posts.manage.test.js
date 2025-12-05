/**
 * 記事API統合テスト: 記事更新・削除
 * PUT /api/v1/posts/:id, DELETE /api/v1/posts/:id のテスト
 */
const request = require('supertest');
const app = require('../../src/app');
const { connect, reset } = require('../../src/config/database');
const { runMigrations } = require('../../migrations');

describe('PUT /api/v1/posts/:id', () => {
  let db;
  let accessToken;
  let createdPostId;
  let otherUserToken;

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
    
    // テストユーザーを作成
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'update-test@example.com',
        password: 'Password123',
        name: '更新テスト',
      });
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'update-test@example.com',
        password: 'Password123',
      });
    
    accessToken = loginResponse.body.accessToken;
    
    // 別のユーザーも作成
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other-user@example.com',
        password: 'Password123',
        name: '別のユーザー',
      });
    
    const otherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'other-user@example.com',
        password: 'Password123',
      });
    
    otherUserToken = otherLoginResponse.body.accessToken;
    
    // テスト用記事を作成
    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '元のタイトル',
        content: '元の本文',
        status: 'draft',
      });
    
    createdPostId = postResponse.body.id;
  });

  describe('正常系', () => {
    it('作成者が記事を更新できる', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '更新後のタイトル',
          content: '更新後の本文',
          status: 'published',
        })
        .expect(200);

      expect(response.body.title).toBe('更新後のタイトル');
      expect(response.body.content).toBe('更新後の本文');
      expect(response.body.status).toBe('published');
    });

    it('下書きから公開に変更できる', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '元のタイトル',
          content: '元の本文',
          status: 'published',
        })
        .expect(200);

      expect(response.body.status).toBe('published');
    });

    it('公開から下書きに戻せる', async () => {
      // まず公開
      await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '元のタイトル',
          content: '元の本文',
          status: 'published',
        });

      // 下書きに戻す
      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '元のタイトル',
          content: '元の本文',
          status: 'draft',
        })
        .expect(200);

      expect(response.body.status).toBe('draft');
    });
  });

  describe('異常系: 認証・認可エラー', () => {
    it('認証なしでリクエストすると401エラー', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .send({
          title: '更新',
          content: '本文',
        })
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });

    it('他のユーザーの記事を更新しようとすると403エラー', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: '更新',
          content: '本文',
        })
        .expect(403);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('権限');
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('タイトルが空の場合は400エラー', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          content: '本文',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('存在しない記事を更新しようとすると404エラー', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      
      const response = await request(app)
        .put(`/api/v1/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '更新',
          content: '本文',
        })
        .expect(404);

      expect(response.body.error).toBe('ApiError');
    });

    it('不正なID形式の場合は400エラー', async () => {
      const response = await request(app)
        .put('/api/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '更新',
          content: '本文',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});

describe('DELETE /api/v1/posts/:id', () => {
  let db;
  let accessToken;
  let createdPostId;
  let otherUserToken;

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
    
    // テストユーザーを作成
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'delete-test@example.com',
        password: 'Password123',
        name: '削除テスト',
      });
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'delete-test@example.com',
        password: 'Password123',
      });
    
    accessToken = loginResponse.body.accessToken;
    
    // 別のユーザーも作成
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other-delete@example.com',
        password: 'Password123',
        name: '別のユーザー',
      });
    
    const otherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'other-delete@example.com',
        password: 'Password123',
      });
    
    otherUserToken = otherLoginResponse.body.accessToken;
    
    // テスト用記事を作成
    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '削除テスト記事',
        content: '本文',
      });
    
    createdPostId = postResponse.body.id;
  });

  describe('正常系', () => {
    it('作成者が記事を削除できる', async () => {
      await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // 削除確認
      await request(app)
        .get(`/api/v1/posts/${createdPostId}`)
        .expect(404);
    });

    it('削除後は復元できない（物理削除）', async () => {
      await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // 再度削除しようとしても404
      await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('異常系: 認証・認可エラー', () => {
    it('認証なしでリクエストすると401エラー', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .expect(401);

      expect(response.body.error).toBe('ApiError');
    });

    it('他のユーザーの記事を削除しようとすると403エラー', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.error).toBe('ApiError');
      expect(response.body.message).toContain('権限');
    });
  });

  describe('異常系: 記事が見つからない', () => {
    it('存在しない記事を削除しようとすると404エラー', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      
      const response = await request(app)
        .delete(`/api/v1/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.error).toBe('ApiError');
    });

    it('不正なID形式の場合は400エラー', async () => {
      const response = await request(app)
        .delete('/api/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
