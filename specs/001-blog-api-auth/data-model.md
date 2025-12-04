# Data Model: ブログ記事管理・JWT認証APIサービス

**Date**: 2025-12-04  
**Feature**: 001-blog-api-auth

## エンティティ関連図

```
┌─────────────────────┐       ┌─────────────────────┐
│        User         │       │        Post         │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID, PK)       │◄──────┤ userId (UUID, FK)   │
│ email (VARCHAR)     │  1:N  │ id (UUID, PK)       │
│ password (VARCHAR)  │       │ title (VARCHAR)     │
│ name (VARCHAR)      │       │ content (TEXT)      │
│ role (ENUM)         │       │ author (VARCHAR)    │
│ createdAt (DATETIME)│       │ status (ENUM)       │
└─────────────────────┘       │ createdAt (DATETIME)│
         │                    │ updatedAt (DATETIME)│
         │                    └─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│   RefreshToken      │
├─────────────────────┤
│ id (UUID, PK)       │
│ userId (UUID, FK)   │
│ token (VARCHAR)     │
│ expiresAt (DATETIME)│
│ revoked (BOOLEAN)   │
│ createdAt (DATETIME)│
└─────────────────────┘
```

## エンティティ定義

### User（ユーザー）

サービスの利用者を表すエンティティ。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | ユーザー識別子（UUID v4） |
| email | VARCHAR(255) | UNIQUE, NOT NULL | メールアドレス（RFC 5322準拠） |
| password | VARCHAR(255) | NOT NULL | bcryptハッシュ化パスワード |
| name | VARCHAR(100) | NOT NULL | 表示名（記事の著者名に使用） |
| role | ENUM('user', 'admin') | NOT NULL, DEFAULT 'user' | ユーザーロール |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | 登録日時 |

**バリデーションルール**:
- email: 有効なメールアドレス形式
- password: 8文字以上、英数字を含む（ハッシュ前）
- name: 1〜100文字

**インデックス**:
- `idx_users_email` (email) - ログイン時の検索最適化

### Post（記事）

ブログ記事を表すエンティティ。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | 記事識別子（UUID v4） |
| userId | UUID | FK (users.id), NOT NULL | 作成者への参照 |
| title | VARCHAR(200) | NOT NULL | 記事タイトル（1〜200文字） |
| content | TEXT | NOT NULL | 記事本文（最大64KB） |
| author | VARCHAR(100) | NOT NULL | 著者名（User.nameから自動設定） |
| status | ENUM('draft', 'published') | NOT NULL, DEFAULT 'draft' | 公開状態 |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | 作成日時 |
| updatedAt | DATETIME | NOT NULL, DEFAULT NOW | 更新日時 |

**バリデーションルール**:
- title: 1〜200文字、空白のみは不可
- content: 1バイト〜65,536バイト（64KB）
- status: 'draft' または 'published' のみ

**インデックス**:
- `idx_posts_userId` (userId) - ユーザー別記事検索
- `idx_posts_status_createdAt` (status, createdAt DESC) - 一覧取得の最適化

**リレーション**:
- `userId` → `users.id` (ON DELETE CASCADE)

### RefreshToken（リフレッシュトークン）

JWTリフレッシュトークンを管理するエンティティ。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | トークン識別子（UUID v4） |
| userId | UUID | FK (users.id), NOT NULL | ユーザーへの参照 |
| token | VARCHAR(512) | UNIQUE, NOT NULL | リフレッシュトークン値 |
| expiresAt | DATETIME | NOT NULL | 有効期限（発行から7日後） |
| revoked | BOOLEAN | NOT NULL, DEFAULT FALSE | 無効化フラグ |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | 発行日時 |

**インデックス**:
- `idx_refresh_tokens_token` (token) - トークン検証時の検索
- `idx_refresh_tokens_userId` (userId) - ユーザー別トークン管理

**リレーション**:
- `userId` → `users.id` (ON DELETE CASCADE)

## 状態遷移

### Post.status

```
┌─────────┐     publish      ┌───────────┐
│  draft  │ ───────────────► │ published │
└─────────┘                  └───────────┘
     ▲                            │
     │         unpublish          │
     └────────────────────────────┘
```

- 新規作成時はデフォルトで `draft`
- `draft` → `published`: ステータス更新APIで変更
- `published` → `draft`: ステータス更新APIで変更（非公開に戻す）

### RefreshToken ライフサイクル

```
┌──────────┐    7日経過    ┌─────────┐
│  active  │ ────────────► │ expired │
└──────────┘               └─────────┘
     │
     │ logout
     ▼
┌──────────┐
│ revoked  │
└──────────┘
```

- ログイン時に新規発行（active）
- 7日経過で期限切れ（expired）- expiresAtで判定
- ログアウト時に無効化（revoked）- revokedフラグをtrueに設定

## マイグレーションSQL

### 001_create_users.sql

```sql
-- ユーザーテーブル作成
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- メールアドレス検索用インデックス
CREATE INDEX idx_users_email ON users(email);
```

### 002_create_posts.sql

```sql
-- 記事テーブル作成
CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ユーザー別記事検索用インデックス
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 一覧取得最適化用インデックス
CREATE INDEX idx_posts_status_created_at ON posts(status, created_at DESC);
```

### 003_create_refresh_tokens.sql

```sql
-- リフレッシュトークンテーブル作成
CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- トークン検証用インデックス
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ユーザー別トークン管理用インデックス
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

## データ制約サマリー

| エンティティ | フィールド | 制約 |
|-------------|-----------|------|
| User | email | RFC 5322形式、一意 |
| User | password | 8文字以上、英数字含む |
| User | name | 1〜100文字 |
| Post | title | 1〜200文字 |
| Post | content | 1〜65,536バイト |
| Post | status | 'draft' \| 'published' |
| RefreshToken | expiresAt | 発行から7日後 |
