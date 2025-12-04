# Quickstart: ブログ記事管理・JWT認証APIサービス

**Date**: 2025-12-04  
**Feature**: 001-blog-api-auth

## 前提条件

- Node.js 20.x LTS以上
- npm 10.x以上

## プロジェクト初期化

```bash
# リポジトリのルートで実行
npm init -y

# 本番用依存関係のインストール
npm install express jsonwebtoken bcrypt express-validator express-rate-limit uuid better-sqlite3 pg cors helmet

# 開発用依存関係のインストール
npm install -D jest supertest eslint eslint-config-prettier prettier nodemon
```

## 環境変数設定

`.env` ファイルを作成:

```bash
# サーバー設定
PORT=3000
NODE_ENV=development

# JWT設定
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# データベース設定（開発環境はSQLite）
DB_TYPE=sqlite
DB_PATH=./data/blog.db

# 本番環境用PostgreSQL設定（本番時に使用）
# DB_TYPE=postgres
# DATABASE_URL=postgresql://user:password@localhost:5432/blog

# CORS設定
CORS_ORIGIN=*
```

## 開発サーバー起動

```bash
# 開発モード（ホットリロード）
npm run dev

# 本番モード
npm start
```

## APIエンドポイント一覧

### 認証 (Auth)

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|------|
| POST | /api/v1/auth/register | 新規ユーザー登録 | 不要 |
| POST | /api/v1/auth/login | ログイン | 不要 |
| POST | /api/v1/auth/refresh | トークン更新 | 不要 |
| POST | /api/v1/auth/logout | ログアウト | 必要 |

### 記事 (Posts)

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|------|
| GET | /api/v1/posts | 記事一覧取得 | 不要 |
| GET | /api/v1/posts/:id | 記事詳細取得 | 不要 |
| POST | /api/v1/posts | 記事作成 | 必要 |
| PUT | /api/v1/posts/:id | 記事更新 | 必要 |
| DELETE | /api/v1/posts/:id | 記事削除 | 必要 |

## 動作確認（curl examples）

### 1. ユーザー登録

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "name": "テストユーザー"
  }'
```

### 2. ログイン

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

レスポンス例:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

### 3. 記事作成（認証必要）

```bash
# ACCESS_TOKENは上記ログインレスポンスから取得
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "title": "はじめてのブログ記事",
    "content": "これは記事の本文です。",
    "status": "published"
  }'
```

### 4. 記事一覧取得

```bash
# ページネーション・フィルタリング付き
curl "http://localhost:3000/api/v1/posts?page=1&limit=10&status=published&sort=createdAt:desc"
```

### 5. トークン更新

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN"
  }'
```

## テスト実行

```bash
# 全テスト実行
npm test

# カバレッジレポート付き
npm run test:coverage

# ウォッチモード
npm run test:watch
```

## package.json scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

## ディレクトリ構造

```
.
├── src/
│   ├── config/           # 環境設定
│   ├── models/           # データモデル
│   ├── services/         # ビジネスロジック
│   ├── routes/           # ルート定義
│   ├── middlewares/      # ミドルウェア
│   ├── utils/            # ユーティリティ
│   ├── app.js            # Expressアプリ設定
│   └── server.js         # サーバー起動
├── tests/
│   ├── unit/             # ユニットテスト
│   ├── integration/      # 統合テスト
│   └── setup.js          # テスト共通設定
├── migrations/           # DBマイグレーション
├── data/                 # SQLiteデータファイル
├── .env                  # 環境変数
├── .eslintrc.js          # ESLint設定
├── jest.config.js        # Jest設定
└── package.json
```

## 次のステップ

1. `/speckit.tasks` で詳細タスク一覧を生成
2. テストファーストで実装開始（Constitution原則III準拠）
3. カバレッジ80%以上を維持（Constitution原則IV準拠）
