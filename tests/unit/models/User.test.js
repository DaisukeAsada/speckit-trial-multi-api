/**
 * Userモデルのユニットテスト
 */
const User = require('../../../src/models/User');
const { connect, reset } = require('../../../src/config/database');
const { runMigrations } = require('../../../migrations');
const { hashPassword } = require('../../../src/utils/password');

describe('User モデル', () => {
  let db;

  beforeAll(async () => {
    db = connect();
    runMigrations(db);
  });

  afterAll(() => {
    reset();
  });

  beforeEach(() => {
    db.exec('DELETE FROM refresh_tokens');
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM users');
  });

  describe('create', () => {
    it('新規ユーザーを作成', async () => {
      const hashedPassword = await hashPassword('Password123');
      const user = User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'テストユーザー',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('テストユーザー');
      expect(user.role).toBe('user');
    });

    it('adminロールで作成可能', async () => {
      const hashedPassword = await hashPassword('Password123');
      const user = User.create({
        email: 'admin@example.com',
        password: hashedPassword,
        name: '管理者',
        role: 'admin',
      });

      expect(user.role).toBe('admin');
    });
  });

  describe('findById', () => {
    it('IDでユーザーを取得', async () => {
      const hashedPassword = await hashPassword('Password123');
      const created = User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'テストユーザー',
      });

      const found = User.findById(created.id);
      expect(found).toBeDefined();
      expect(found.email).toBe('test@example.com');
    });

    it('存在しないIDはnull', () => {
      const found = User.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('メールアドレスでユーザーを取得', async () => {
      const hashedPassword = await hashPassword('Password123');
      User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'テストユーザー',
      });

      const found = User.findByEmail('test@example.com');
      expect(found).toBeDefined();
      expect(found.name).toBe('テストユーザー');
    });

    it('存在しないメールはnull', () => {
      const found = User.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('存在するメールはtrue', async () => {
      const hashedPassword = await hashPassword('Password123');
      User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'テストユーザー',
      });

      expect(User.emailExists('test@example.com')).toBe(true);
    });

    it('存在しないメールはfalse', () => {
      expect(User.emailExists('nonexistent@example.com')).toBe(false);
    });
  });

  describe('toSafeUser', () => {
    it('パスワードを除外', async () => {
      const hashedPassword = await hashPassword('Password123');
      const user = User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'テストユーザー',
      });

      const safe = User.toSafeUser(user);
      expect(safe.password).toBeUndefined();
      expect(safe.email).toBe('test@example.com');
    });
  });

  describe('update', () => {
    it('ユーザー情報を更新', async () => {
      const hashedPassword = await hashPassword('Password123');
      const user = User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'テストユーザー',
      });

      const updated = User.update(user.id, { name: '新しい名前' });
      expect(updated.name).toBe('新しい名前');
    });

    it('存在しないユーザーはnull', () => {
      const updated = User.update('00000000-0000-0000-0000-000000000000', { name: 'test' });
      expect(updated).toBeNull();
    });
  });
});
