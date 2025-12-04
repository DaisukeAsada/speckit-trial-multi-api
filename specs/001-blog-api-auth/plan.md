# Implementation Plan: ブログ記事管理・JWT認証APIサービス

**Branch**: `001-blog-api-auth` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-blog-api-auth/spec.md`

## Summary

ブログ記事管理機能とJWT認証機能を持つRESTful APIサービスを構築する。Node.js + Express.jsをバックエンドフレームワークとして使用し、SQLite（開発用）/PostgreSQL（本番用）でデータを永続化する。bcryptによるパスワードハッシュ化、JWTによるトークンベース認証、レート制限によるセキュリティ対策を実装する。

## Technical Context

**Language/Version**: JavaScript (Node.js 20.x LTS)  
**Primary Dependencies**: Express.js 4.x, jsonwebtoken, bcrypt, express-validator, express-rate-limit, uuid  
**Storage**: SQLite (better-sqlite3) 開発用、PostgreSQL (pg) 本番用  
**Testing**: Jest + Supertest（APIテスト）、カバレッジ80%以上  
**Target Platform**: Linux server (Docker対応)  
**Project Type**: single（APIサーバーのみ）  
**Performance Goals**: 100 req/s、レスポンス時間 2秒以内  
**Constraints**: レート制限 5 req/min（認証エンドポイント）、トークン有効期限（access: 1h、refresh: 7d）  
**Scale/Scope**: 100同時ユーザー、記事100件で1秒以内応答

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| 原則 | ステータス | 備考 |
|------|-----------|------|
| I. ユーザーインターフェース設計 | N/A | API専用プロジェクト、UIなし |
| II. AIエージェント動作規約 | ✅ Pass | 開発プロセスで遵守 |
| III. テスト駆動開発 (NON-NEGOTIABLE) | ✅ Pass | Jest + Supertestでテストファースト実装 |
| IV. テストカバレッジ基準 | ✅ Pass | 80%以上を目標、Jest coverage設定 |
| V. コメント規約 | ✅ Pass | 日本語コメント、JSDoc形式 |
| VI. ドキュメント規約 | ✅ Pass | README、API仕様を日本語で記載 |
| VII. コミット規約 | ✅ Pass | Conventional Commits準拠 |

**ゲート結果**: ✅ すべてパス - Phase 0に進行可能

### Post-Phase 1 Re-check

| 原則 | ステータス | 設計での対応 |
|------|-----------|-------------|
| I. ユーザーインターフェース設計 | N/A | API専用プロジェクト、UIなし |
| II. AIエージェント動作規約 | ✅ Pass | copilot-instructions.md更新済み |
| III. テスト駆動開発 (NON-NEGOTIABLE) | ✅ Pass | tests/構造定義、Jest設定計画済み |
| IV. テストカバレッジ基準 | ✅ Pass | jest --coverage設定、80%閾値 |
| V. コメント規約 | ✅ Pass | JSDoc形式で日本語コメント計画 |
| VI. ドキュメント規約 | ✅ Pass | quickstart.md、data-model.md、openapi.yaml作成済み |
| VII. コミット規約 | ✅ Pass | Conventional Commits準拠 |

**ゲート結果**: ✅ すべてパス - Phase 2 (tasks.md) に進行可能

## Project Structure

### Documentation (this feature)

```text
specs/001-blog-api-auth/
├── plan.md              # このファイル
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI仕様)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── config/              # 環境設定、DB接続設定
│   ├── database.js      # SQLite/PostgreSQL接続
│   └── index.js         # 環境変数管理
├── models/              # データモデル
│   ├── User.js          # ユーザーモデル
│   ├── Post.js          # 記事モデル
│   └── RefreshToken.js  # リフレッシュトークンモデル
├── services/            # ビジネスロジック
│   ├── authService.js   # 認証ロジック
│   └── postService.js   # 記事管理ロジック
├── routes/              # ルート定義
│   ├── authRoutes.js    # 認証エンドポイント
│   └── postRoutes.js    # 記事エンドポイント
├── middlewares/         # ミドルウェア
│   ├── auth.js          # JWT認証ミドルウェア
│   ├── rateLimit.js     # レート制限
│   ├── validate.js      # バリデーション
│   └── errorHandler.js  # エラーハンドリング
├── utils/               # ユーティリティ
│   ├── logger.js        # ロギング
│   └── validators.js    # 共通バリデーション
├── app.js               # Expressアプリ設定
└── server.js            # サーバー起動

tests/
├── unit/                # ユニットテスト
│   ├── services/
│   └── utils/
├── integration/         # 統合テスト
│   ├── auth.test.js
│   └── posts.test.js
└── setup.js             # テスト共通設定

migrations/              # DBマイグレーション
├── 001_create_users.js
├── 002_create_posts.js
└── 003_create_refresh_tokens.js
```

**Structure Decision**: Single project構成を採用。APIサーバーのみで、フロントエンドは別プロジェクトとして将来対応可能。Express.jsの標準的なMVC風レイヤー分離（routes → services → models）を採用。

## Complexity Tracking

> 違反なし - シンプルな構成で実装可能
