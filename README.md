# ブログ記事管理・JWT認証APIサービス

ブログ記事管理機能とJWT認証機能を持つRESTful APIサービスです。

## 技術スタック

- **言語**: JavaScript (Node.js 20.x LTS)
- **フレームワーク**: Express.js 4.x
- **データベース**: SQLite (開発用) / PostgreSQL (本番用)
- **認証**: JWT (jsonwebtoken) + bcrypt
- **テスト**: Jest + Supertest

## 機能

### 認証API
- ユーザー登録 (`POST /api/v1/auth/register`)
- ログイン (`POST /api/v1/auth/login`)
- トークン更新 (`POST /api/v1/auth/refresh`)
- ログアウト (`POST /api/v1/auth/logout`)

### 記事API
- 記事作成 (`POST /api/v1/posts`)
- 記事一覧取得 (`GET /api/v1/posts`)
- 記事詳細取得 (`GET /api/v1/posts/:id`)
- 記事更新 (`PUT /api/v1/posts/:id`)
- 記事削除 (`DELETE /api/v1/posts/:id`)

## セットアップ

### 前提条件

- Node.js 20.x以上
- npm 9.x以上

### インストール

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env

# .envファイルを編集して必要な値を設定
```

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NODE_ENV` | 環境名 (development/production) | development |
| `PORT` | サーバーポート | 3000 |
| `JWT_SECRET` | JWT署名用シークレット | (必須) |
| `JWT_ACCESS_EXPIRES_IN` | アクセストークン有効期限 | 1h |
| `JWT_REFRESH_EXPIRES_IN` | リフレッシュトークン有効期限 | 7d |
| `DATABASE_URL` | データベース接続URL | (SQLite使用時は不要) |

### 開発サーバー起動

```bash
# 開発モード（ホットリロード）
npm run dev

# 本番モード
npm start
```

サーバーは `http://localhost:3000` で起動します。

## テスト

```bash
# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch
```

## APIドキュメント

詳細なAPI仕様は `specs/001-blog-api-auth/contracts/openapi.yaml` を参照してください。

### 認証フロー

1. **ユーザー登録**: `POST /api/v1/auth/register` でアカウント作成
2. **ログイン**: `POST /api/v1/auth/login` でトークン取得
3. **APIアクセス**: `Authorization: Bearer <accessToken>` ヘッダーを付与
4. **トークン更新**: アクセストークン期限切れ前に `POST /api/v1/auth/refresh` で更新
5. **ログアウト**: `POST /api/v1/auth/logout` でリフレッシュトークン無効化

### リクエスト例

```bash
# ユーザー登録
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123", "name": "テストユーザー"}'

# ログイン
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'

# 記事作成（認証必須）
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"title": "記事タイトル", "content": "記事本文", "status": "published"}'

# 記事一覧取得
curl http://localhost:3000/api/v1/posts?page=1&limit=10&status=published
```

## プロジェクト構造

```
src/
├── config/              # 環境設定、DB接続設定
├── models/              # データモデル
├── services/            # ビジネスロジック
├── routes/              # ルート定義
├── middlewares/         # ミドルウェア
├── utils/               # ユーティリティ
├── app.js               # Expressアプリ設定
└── server.js            # サーバー起動

tests/
└── integration/         # 統合テスト

migrations/              # データベースマイグレーション

specs/
└── 001-blog-api-auth/   # 機能仕様書
    ├── plan.md          # 実装計画
    ├── data-model.md    # データモデル定義
    ├── quickstart.md    # クイックスタートガイド
    ├── contracts/       # OpenAPI仕様
    └── tasks.md         # タスク一覧
```

## セキュリティ

- **パスワード**: bcryptでハッシュ化（ソルトラウンド: 12）
- **JWT**: アクセストークン(1h) + リフレッシュトークン(7d)
- **レート制限**: 認証エンドポイントは5回/分
- **入力検証**: express-validatorによるバリデーション
- **CORS**: 設定可能なオリジン制限
- **Helmet**: セキュリティヘッダー設定

## ライセンス

MIT License
