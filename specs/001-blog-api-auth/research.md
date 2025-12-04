# Research: ブログ記事管理・JWT認証APIサービス

**Date**: 2025-12-04  
**Feature**: 001-blog-api-auth

## 技術選定

### Node.js + Express.js

**Decision**: Express.js 4.x をWebフレームワークとして採用

**Rationale**:
- 軽量で柔軟なミドルウェアアーキテクチャ
- 豊富なエコシステムとコミュニティサポート
- RESTful API構築に最適化された設計
- 学習コストが低く、開発速度が速い

**Alternatives considered**:
- Fastify: より高速だが、Express互換のミドルウェアが使えない場合がある
- Koa: よりモダンだが、エコシステムがExpressより小さい
- NestJS: 構造化されているが、小規模プロジェクトにはオーバーヘッドが大きい

### JWT認証実装

**Decision**: jsonwebtokenライブラリを使用し、access token + refresh tokenパターンを採用

**Rationale**:
- ステートレス認証でスケーラビリティが高い
- アクセストークン（1時間）とリフレッシュトークン（7日間）の分離でセキュリティと利便性を両立
- リフレッシュトークンはDBに保存し、無効化可能に

**Best practices**:
- アクセストークンはメモリ/ヘッダーのみで保持、Cookieに保存しない（XSS対策）
- リフレッシュトークンはHttpOnly Cookieまたはセキュアストレージに保存
- トークンにはユーザーID、ロール、有効期限を含める
- ログアウト時はリフレッシュトークンをDB上で無効化

### パスワードハッシュ

**Decision**: bcryptを使用（saltRounds: 12）

**Rationale**:
- 業界標準のパスワードハッシュアルゴリズム
- salt自動生成で安全性が高い
- Node.jsネイティブバインディングで高速

**Alternatives considered**:
- Argon2: より新しいが、ネイティブ依存関係が複雑
- scrypt: Node.js組み込みだが、bcryptほど広く使われていない

### データベース

**Decision**: 開発環境はbetter-sqlite3、本番環境はPostgreSQL（pg）

**Rationale**:
- SQLiteは開発・テストで高速、ファイルベースで環境構築が容易
- PostgreSQLは本番環境で信頼性・スケーラビリティが高い
- 両方SQLなのでクエリの互換性が高い

**Migration strategy**:
- 環境変数でDB種別を切り替え
- Knex.jsまたはカスタムマイグレーションスクリプトで互換性維持

### レート制限

**Decision**: express-rate-limitミドルウェアを使用

**Rationale**:
- Express統合が容易
- メモリベースで開発環境で動作
- Redis連携で本番環境スケール可能

**Configuration**:
- 認証エンドポイント: 5 requests/minute/IP
- 一般エンドポイント: 100 requests/minute/IP（将来拡張用）

### バリデーション

**Decision**: express-validatorを使用

**Rationale**:
- Expressミドルウェアとして統合
- 宣言的なバリデーションルール定義
- カスタムバリデーターの追加が容易

### UUID生成

**Decision**: uuidパッケージ（v4）を使用

**Rationale**:
- RFC4122準拠のUUID生成
- 暗号学的にランダムで衝突リスクが極めて低い

### テスティング

**Decision**: Jest + Supertest

**Rationale**:
- Jestは包括的なテストフレームワーク（アサーション、モック、カバレッジ）
- SupertestはExpressアプリのHTTPテストに最適
- カバレッジレポート生成でConstitution要件（80%）を満たせる

**Test structure**:
- ユニットテスト: サービス層のロジックテスト
- 統合テスト: APIエンドポイントのE2Eテスト

### ロギング

**Decision**: 標準console + 構造化ログフォーマット（将来的にwinston/pino移行可能）

**Rationale**:
- MVPではシンプルな実装を優先
- 認証イベントのみログ記録（FR-024）
- 構造化フォーマット（JSON）で将来の分析に対応

## セキュリティ考慮事項

### OWASP Top 10対策

| 脅威 | 対策 |
|------|------|
| Injection | express-validatorでの入力検証、パラメータ化クエリ |
| Broken Authentication | bcryptハッシュ、JWT有効期限、レート制限 |
| Sensitive Data Exposure | HTTPSを想定、パスワードはハッシュ化のみ保存 |
| Broken Access Control | JWT内のroleでロールベースアクセス制御 |

### CORS設定

- 開発: すべてのオリジンを許可
- 本番: 特定ドメインのみ許可（環境変数で設定）

## 依存関係リスト

### Production Dependencies

```json
{
  "express": "^4.18.x",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "express-validator": "^7.x",
  "express-rate-limit": "^7.x",
  "uuid": "^9.x",
  "better-sqlite3": "^9.x",
  "pg": "^8.x",
  "cors": "^2.x",
  "helmet": "^7.x"
}
```

### Development Dependencies

```json
{
  "jest": "^29.x",
  "supertest": "^6.x",
  "eslint": "^8.x",
  "eslint-config-prettier": "^9.x",
  "prettier": "^3.x",
  "nodemon": "^3.x"
}
```

## 解決済みの不明点

Technical Contextで特定された不明点はユーザー入力により解決済み:

- ✅ 言語: JavaScript (Node.js)
- ✅ フレームワーク: Express.js
- ✅ データベース: SQLite (開発) / PostgreSQL (本番)
- ✅ テスト: Jest + Supertest
