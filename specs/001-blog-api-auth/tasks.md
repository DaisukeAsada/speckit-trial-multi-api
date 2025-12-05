# Tasks: ブログ記事管理・JWT認証APIサービス

**Input**: Design documents from `/specs/001-blog-api-auth/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 並列実行可能（別ファイル、依存関係なし）
- **[Story]**: ユーザーストーリーへのマッピング（US1, US2, US3...）
- 各タスクにはファイルパスを含める

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root（plan.md準拠）

---

## Phase 1: Setup（プロジェクト初期化）

**Purpose**: プロジェクト構造とツール設定の初期化

- [X] T001 Create project structure per implementation plan in plan.md
- [X] T002 Initialize Node.js project with package.json and npm dependencies
- [X] T003 [P] Configure ESLint and Prettier in .eslintrc.js and .prettierrc
- [X] T004 [P] Configure Jest in jest.config.js
- [X] T005 [P] Create .env.example with environment variables template
- [X] T006 [P] Create .gitignore for Node.js project

---

## Phase 2: Foundational（基盤インフラストラクチャ）

**Purpose**: すべてのユーザーストーリーに必要な共通基盤

**⚠️ CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装は開始できません

- [X] T007 Create environment configuration in src/config/index.js
- [X] T008 Create SQLite database connection in src/config/database.js
- [X] T009 [P] Create database migration runner in migrations/index.js
- [X] T010 [P] Create User model and migration in src/models/User.js and migrations/001_create_users.js
- [X] T011 [P] Create Post model and migration in src/models/Post.js and migrations/002_create_posts.js
- [X] T012 [P] Create RefreshToken model and migration in src/models/RefreshToken.js and migrations/003_create_refresh_tokens.js
- [X] T013 Create error handler middleware in src/middlewares/errorHandler.js
- [X] T014 [P] Create logger utility in src/utils/logger.js
- [X] T015 [P] Create common validators in src/utils/validators.js
- [X] T016 Create Express app setup in src/app.js
- [X] T017 Create server entry point in src/server.js
- [X] T018 Create test setup in tests/setup.js

**Checkpoint**: 基盤準備完了 - ユーザーストーリー実装開始可能

---

## Phase 3: User Story 1 - ユーザー登録・ログイン (Priority: P1) 🎯 MVP

**Goal**: 新規ユーザーが登録し、ログインしてJWTトークンを取得できる

**Independent Test**: 新規ユーザー登録 → ログイン → トークン取得 → 保護リソースアクセスの一連のフローを検証

### Implementation for User Story 1

- [X] T019 [US1] Implement password hashing utility in src/utils/password.js
- [X] T020 [US1] Implement JWT token utility in src/utils/jwt.js
- [X] T021 [US1] Implement rate limiting middleware in src/middlewares/rateLimit.js
- [X] T022 [US1] Implement authentication middleware in src/middlewares/auth.js
- [X] T023 [US1] Implement validation middleware in src/middlewares/validate.js
- [X] T024 [US1] Implement AuthService (register, login) with auth event logging (FR-024) in src/services/authService.js
- [X] T025 [US1] Implement auth routes (register, login) in src/routes/authRoutes.js
- [X] T026 [US1] Write integration tests for register endpoint in tests/integration/auth.register.test.js
- [X] T027 [US1] Write integration tests for login endpoint in tests/integration/auth.login.test.js

**Checkpoint**: ユーザー登録とログインが独立して動作・テスト可能

---

## Phase 4: User Story 2 - 記事の作成・公開 (Priority: P2)

**Goal**: 認証されたユーザーがブログ記事を作成し、下書き/公開状態を設定できる

**Independent Test**: 認証済みユーザーが記事作成 → 下書き保存 → 公開状態変更のフローを検証

### Implementation for User Story 2

- [X] T028 [US2] Implement PostService (create) in src/services/postService.js
- [X] T029 [US2] Implement post routes (create) in src/routes/postRoutes.js
- [X] T030 [US2] Add post validation rules in src/middlewares/validate.js
- [X] T031 [US2] Write integration tests for create post endpoint in tests/integration/posts.create.test.js

**Checkpoint**: 記事作成が独立して動作・テスト可能

---

## Phase 5: User Story 3 - 記事一覧の閲覧 (Priority: P3)

**Goal**: ユーザーが公開記事一覧をページネーション、フィルタ、ソート付きで閲覧できる

**Independent Test**: 記事一覧取得 → ページネーション → ステータスフィルター → ソートのフローを検証

### Implementation for User Story 3

- [X] T032 [US3] Implement PostService (list with pagination, filter, sort) in src/services/postService.js
- [X] T033 [US3] Implement post routes (list) in src/routes/postRoutes.js
- [X] T034 [US3] Write integration tests for list posts endpoint in tests/integration/posts.list.test.js

**Checkpoint**: 記事一覧取得が独立して動作・テスト可能

---

## Phase 6: User Story 4 - 記事の詳細閲覧 (Priority: P4)

**Goal**: ユーザーが特定記事の詳細情報を閲覧できる

**Independent Test**: 記事ID指定 → 詳細取得 → 存在しないIDでエラーのフローを検証

### Implementation for User Story 4

- [X] T035 [US4] Implement PostService (getById) in src/services/postService.js
- [X] T036 [US4] Implement post routes (get by id) in src/routes/postRoutes.js
- [X] T037 [US4] Write integration tests for get post endpoint in tests/integration/posts.get.test.js

**Checkpoint**: 記事詳細取得が独立して動作・テスト可能

---

## Phase 7: User Story 5 - 記事の編集・削除 (Priority: P5)

**Goal**: 認証されたユーザーが自分の記事を編集・削除できる（adminは全記事操作可能）

**Independent Test**: 記事更新 → 削除 → 権限チェック（自分の記事/他人の記事/admin）のフローを検証

### Implementation for User Story 5

- [X] T038 [US5] Implement authorization middleware in src/middlewares/authorize.js
- [X] T039 [US5] Implement PostService (update, delete) in src/services/postService.js
- [X] T040 [US5] Implement post routes (update, delete) in src/routes/postRoutes.js
- [X] T041 [US5] Write integration tests for update post endpoint in tests/integration/posts.update.test.js
- [X] T042 [US5] Write integration tests for delete post endpoint in tests/integration/posts.delete.test.js

**Checkpoint**: 記事編集・削除が独立して動作・テスト可能

---

## Phase 8: User Story 6 - トークン更新・ログアウト (Priority: P6)

**Goal**: ユーザーがトークンを更新し、ログアウトできる

**Independent Test**: リフレッシュトークン → 新アクセストークン取得 → ログアウト → トークン無効化のフローを検証

### Implementation for User Story 6

- [X] T043 [US6] Implement AuthService (refresh, logout) in src/services/authService.js
- [X] T044 [US6] Implement auth routes (refresh, logout) in src/routes/authRoutes.js
- [X] T045 [US6] Write integration tests for refresh endpoint in tests/integration/auth.refresh.test.js
- [X] T046 [US6] Write integration tests for logout endpoint in tests/integration/auth.logout.test.js

**Checkpoint**: トークン更新・ログアウトが独立して動作・テスト可能

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 複数ユーザーストーリーに影響する改善

- [X] T047 [P] Create README.md with project documentation
- [X] T048 [P] Add JSDoc comments to all service files
- [X] T049 [P] Add JSDoc comments to all middleware files
- [X] T050 Run all tests and ensure 80%+ coverage
- [X] T051 Run quickstart.md validation
- [X] T052 Security review and hardening

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← すべてのユーザーストーリーをブロック
    ↓
┌───────────────────────────────────────────────────────────────┐
│ Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → ...         │
│   P1: 認証    │   P2: 作成    │   P3: 一覧   │              │
│              │              │              │              │
│ 各ストーリーは独立してテスト可能                              │
└───────────────────────────────────────────────────────────────┘
    ↓
Phase 9 (Polish)
```

### User Story Dependencies

| User Story | 依存関係 | 並列実行 |
|-----------|---------|---------|
| US1 (P1) | Phase 2完了後開始可能 | - |
| US2 (P2) | US1完了後（認証が必要） | - |
| US3 (P3) | Phase 2完了後開始可能 | US1と並列可能 |
| US4 (P4) | Phase 2完了後開始可能 | US1/US3と並列可能 |
| US5 (P5) | US1完了後（認証・認可が必要） | US2と並列可能 |
| US6 (P6) | US1完了後（トークン基盤が必要） | US2/US5と並列可能 |

### Within Each User Story

1. サービス層の実装
2. ルート/コントローラーの実装
3. 統合テストの作成
4. ストーリー完了確認

---

## Parallel Execution Examples

### Phase 2: Foundational Tasks

```bash
# 並列実行可能なタスク:
T009: Create database migration runner
T010: Create User model and migration
T011: Create Post model and migration
T012: Create RefreshToken model and migration
T014: Create logger utility
T015: Create common validators
```

### After Phase 2: User Stories

```bash
# チームメンバー A: US1（認証）
T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027

# チームメンバー B: US3（一覧閲覧）とUS4（詳細閲覧）を並列で
T032 → T033 → T034  # US3
T035 → T036 → T037  # US4
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 完了
2. Phase 2: Foundational 完了（**CRITICAL**）
3. Phase 3: User Story 1 完了
4. **STOP and VALIDATE**: ユーザー登録・ログインの独立テスト
5. デプロイ/デモ準備完了

### Incremental Delivery

| 段階 | 内容 | 価値 |
|-----|------|-----|
| MVP | Setup + Foundational + US1 | 認証基盤完成 |
| +US2 | 記事作成機能 | コンテンツ作成可能 |
| +US3, US4 | 記事閲覧機能 | 読者がコンテンツ消費可能 |
| +US5 | 記事管理機能 | コンテンツ管理完成 |
| +US6 | トークン管理 | セキュリティ運用完成 |
| Polish | ドキュメント・最適化 | 本番運用準備完了 |

---

## Notes

- [P] タスク = 別ファイル、依存関係なし
- [Story] ラベル = 特定ユーザーストーリーへのトレーサビリティ
- 各ユーザーストーリーは独立して完了・テスト可能
- タスク完了後または論理グループ完了後にコミット
- チェックポイントで各ストーリーを独立検証可能
- 避けるべき: 曖昧なタスク、同一ファイルの競合、ストーリー間の独立性を損なう依存関係
