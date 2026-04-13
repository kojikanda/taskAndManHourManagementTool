# タスク＋工数管理ツール開発

## 目的

Next.js（フロントエンド）＋ Spring Boot（バックエンド）構成で、「タスク＋工数管理ツール」を開発する。<br>
UIはReactのMUIを利用する。

具体的には、以下の機能を実装する。

## 機能概要

以下の機能を持つアプリを作成する。

1. ユーザー管理

- ユーザー登録
- ログイン（JWT認証）

2. プロジェクト管理

- プロジェクト作成
- プロジェクト一覧取得

3. タスク管理

- タスクCRUD
- ステータス管理（TODO / DOING / DONE）
- 優先度（HIGH / MEDIUM / LOW）
- 締切日（due_date）
- 見積工数（estimated_hours）

4. 工数管理（重要）

- タスクに紐づく作業ログ（work_logs）
- 作業時間（hours）を記録
- 作業日（work_date）を保持（※実際に作業した日）
- 合計工数を集計可能にする

5. 見積 vs 実績

- estimated_hours（tasks）と
- work_logsの合計hoursで比較

## DB設計

以下のテーブル構成で設計する。

### users

- id (PK)
- name
- email (unique)
- password_hash
- created_at
- updated_at

### projects

- id (PK)
- name
- description
- owner_id (FK → users.id)
- created_at
- updated_at

### tasks

- id (PK)
- project_id (FK → projects.id)
- title
- description
- status（TODO / DOING / DONE）
- priority（HIGH / MEDIUM / LOW）
- due_date（タスクの期限）
- estimated_hours（見積工数）
- created_at
- updated_at

### work_logs

- id (PK)
- task_id (FK → tasks.id)
- user_id (FK → users.id)
- work_date（実際に作業した日）
- hours（作業時間）
- memo
- created_at

### task_assignments（追加）

- id (PK)
- task_id (FK → tasks.id)
- user_id (FK → users.id)
- ※ task_id + user_id に UNIQUE 制約あり

### リレーション

- users 1 : N projects
- projects 1 : N tasks
- tasks 1 : N work_logs
- users 1 : N work_logs
- tasks N : M users（task_assignments 経由）

## 使用する言語、フレームワーク、DBなど

- Backend: Java / Spring Boot
- DB: PostgreSQL（Renderで利用）
- ORM: Spring Data JPA
- 認証: JWT（シンプルな実装でOK）

## 要件

### ① Entityクラス

- JPAアノテーションを使用
- リレーションを適切に設定（@ManyToOne, @OneToMany）
- created_at / updated_at を適切に管理
- Lombok使用OK

### ② Repository

- 各Entityに対応するRepository作成

### ③ Service層（簡易でOK）

- tasks
- work_logs
  の基本操作

### ④ Controller

最低限以下のAPIを実装。

#### Task

- GET /projects/{projectId}/tasks
- POST /tasks
- PUT /tasks/{id}

#### WorkLog

- POST /work-logs
- GET /tasks/{taskId}/work-logs

### ⑤工数集計API

以下を実装。

- タスクごとの実績工数（SUM）
- 見積 vs 実績の差分を返すAPI

## API設計方針

- work_logsで工数を管理し、tasksには実績工数を持たせない
- 集計はDB or Service層で行う
- 正規化を意識する

## UI設計

- ログインしていない場合はログイン画面を表示する。
- ログイン画面にユーザ登録画面のリンクを置いておき、ユーザ登録画面に遷移できる。
- ログインしたら、プロジェクト一覧画面を表示する。
  - プロジェクトはカードで表示する。
- プロジェクト一連画面から、プロジェクトを追加するためのプロジェクト作成フォームが表示できる。
- プロジェクト作成フォームからプロジェクトを登録することができる。
- プロジェクト一覧画面からプロジェクトのカードをクリックすると、タスク一覧画面が表示される。
  - タスク一覧はテーブルで表示する。
  - タスク一覧は以下のカラムを表示し、それぞれでソート可能。
    - タスクタイトル
    - プロジェクト名
    - アサインされたユーザ
    - ステータス(バッジ表示)
    - 優先度(バッジ表示)
    - 期限
    - 見積時間
    - 更新日時
  - ソートしているカラムのタイトル行は「期限 ↑」という漢字の表示にして、ソートしていることが分かるようにする。
  - タスク一覧の優先度は、値に応じてバッジの背景色を変える。
    - HIGH→薄い赤背景 + 赤文字
    - MEDIUM→薄いオレンジ
    - LOW→薄いグレー
  - タスク一覧のステータスは、値に応じてバッジの背景色を変える
    - TODO→少し青みがかったグレー
    - DOING→青
    - DONE→緑
  - タスク一覧は以下のフィルタリングが可能。(複数のフィルタリングを同時に指定可能)
    - アサインされたユーザ(複数指定可能)
    - ステータス(複数指定可能)
    - 優先度(複数指定可能)
    - 期限(From~Toで指定。Fromのみ、Toのみの指定も可能。)
  - フィルタ状態をUI上に表示する。
    - 例えば、自分がアサインされているタスクで、且つ、 ステータスがTODOまたはDOINGでフィルタリングしている場合は、「自分 TODO/DOING」という感じでバッジ表示する。
  - フィルタリングを全て解除する「クリア」ボタンがあり、クリアをクリックすると、全てのフィルタリングが解除される。
  - 初期表示はログインしているユーザがアサインされている、且つ、ステータスが完了以外のタスクのみを表示し、期限でソートした状態とする。
  - タスク一覧画面のステータス、優先度のバッジ表示をクリックすると、ドロップダウンが表示され、インライン編集が可能。
  - タスク一覧に1件もないときは、テーブルの位置に「タスクがありません」の表示を行う。
- タスク一覧からタスクの行をクリックすると、タスク詳細画面が表示される。
  - タスク詳細画面は、ステータス、優先度、期限、見積時間、実績時間、見積時間と実績時間の差分、及び、ワークログ一覧を表示する。
  - 見積時間と実績時間の差分は、値がプラスの場合は赤色で、値がマイナスの場合は緑色で表示する。
  - タスク詳細画面で、ステータス、優先度の変更が可能。
  - ワークログ一覧は日付の新しい方から順番に(DESC)表示する。
- タスク一覧画面から、タスクを追加するためのタスク作成フォームが表示できる。
- タスク作成フォームからタスクを登録することができる。
- タスク詳細画面から実績を入力するためのワーク実績入力フォームが表示できる。
- ワーク実績入力フォームからワークの実績(ワークログ)を登録することができる。
- プロジェクト作成フォーム、タスク作成フォーム、ワーク実績入力フォームはモーダルで表示する。
- プロジェクト一連画面、タスク一覧画面、タスク詳細画面では左側にサイドバーを表示する。
  - サイドバーには、プロジェクト一覧画面とタスク一覧画面(自担当)へのリンク、及び、ログアウトを実行するリンクが置いてある。
  - タスク一覧画面(自担当)を選択したときは、タスク一覧画面を表示するが、全てのプロジェクトの自分がアサインされたタスクを表示する。
- 以下でトースト表示を行う。
  - ログインした→ログインしました
  - ログアウトした→ログアウトしました
  - プロジェクトを登録した→プロジェクトを登録しました
  - タスクを登録した→タスクを登録しました
  - ワーク実績を登録した→ワーク実績を登録しました
- ローディング中は、ローディングスピナーの表示 or スケルトンUIでローディングしていることが分かるようにする。
  (基本的にローディングスピナーの表示で問題ないが、スケルトンUIの方がユーザの視認性が良い場合は、スケルトンUIの方が良いと提案すること。)
- できる限り、モダンな表示となるようにする。(比較的軽微な変更で対応できる、より良い案があれば、逐一提案すること。)
- レスポンスデザインを意識する。(もし画面サイズが小さい場合に表示に問題が出そうな場合は、逐一通知すること。)
- 日付フォーマットは、2026年4月13日なら「2026/04/13」の形式とすること。

## その他

- バリデーションは最低限でOK
- 実装はシンプルで読みやすさ重視
- ディレクトリ構成も提案してほしい

## ディレクトリ構成

### 現在の構成

```
taskAndManHourManagementTool/
├── CLAUDE.md
├── README.md
├── docs/                          # 学習メモなど
│   └── learn.md
├── .vscode/
│   └── launch.json                # VSCode デバッグ設定
├── backend/
│   └── task-management/           # Spring Boot プロジェクト
│       ├── pom.xml
│       ├── mvnw / mvnw.cmd
│       └── src/
│           ├── main/
│           │   ├── java/com/example/taskmanagement/
│           │   │   ├── TaskManagementApplication.java
│           │   │   ├── config/
│           │   │   │   └── SecurityConfig.java
│           │   │   ├── entity/
│           │   │   │   ├── User.java
│           │   │   │   ├── Project.java
│           │   │   │   ├── Task.java
│           │   │   │   ├── WorkLog.java
│           │   │   │   ├── TaskStatus.java   # enum
│           │   │   │   └── TaskPriority.java # enum
│           │   │   ├── repository/
│           │   │   │   ├── UserRepository.java
│           │   │   │   ├── ProjectRepository.java
│           │   │   │   ├── TaskRepository.java
│           │   │   │   └── WorkLogRepository.java
│           │   │   ├── service/
│           │   │   │   ├── UserService.java
│           │   │   │   ├── ProjectService.java
│           │   │   │   ├── TaskService.java
│           │   │   │   └── WorkLogService.java
│           │   │   ├── controller/
│           │   │   │   ├── TaskController.java
│           │   │   │   └── WorkLogController.java
│           │   │   └── dto/
│           │   │       ├── TaskRequest.java
│           │   │       ├── TaskResponse.java
│           │   │       ├── WorkLogRequest.java
│           │   │       ├── WorkLogResponse.java
│           │   │       └── HoursSummaryResponse.java
│           │   └── resources/
│           │       ├── application.properties         # 共通設定（プロファイル指定）
│           │       ├── application-dev.properties     # 開発環境設定（ローカルDB）
│           │       └── application-prod.properties    # 本番環境設定（Neon DB）
│           └── test/
│               └── java/com/example/taskmanagement/
│                   └── TaskManagementApplicationTests.java
└── frontend/                      # Next.js プロジェクト
    ├── package.json
    ├── tsconfig.json
    ├── eslint.config.mjs
    ├── public/
    └── src/
        └── app/                   # App Router
            ├── layout.tsx
            ├── page.tsx
            ├── globals.css
            └── page.module.css
```

### バックエンド 追加済みの構成（security パッケージ）

```
src/main/java/com/example/taskmanagement/
├── entity/
│   └── TaskAssignment.java          # 追加（task_assignments 中間テーブル）
├── repository/
│   └── TaskAssignmentRepository.java # 追加
├── security/                         # 追加（JWT認証関連）
│   ├── JwtUtil.java
│   ├── JwtProperties.java
│   ├── JwtAuthenticationFilter.java
│   └── UserDetailsServiceImpl.java
├── controller/
│   └── AuthController.java           # 追加（/auth/register, /auth/login）
└── dto/
    ├── RegisterRequest.java          # 追加
    ├── LoginRequest.java             # 追加
    └── LoginResponse.java            # 追加
```

また、`src/main/resources/META-INF/additional-spring-configuration-metadata.json` を追加し、カスタムプロパティ（`jwt.*`, `cors.*`）の警告を解消済み。

### フロントエンド 実装済みの構成

```
frontend/
├── .env.local                        # 追加（NEXT_PUBLIC_API_BASE_URL）
└── src/
    ├── app/
    │   ├── layout.tsx                # 更新（AppRouterCacheProvider / Providers 組み込み）
    │   ├── page.tsx                  # 更新（ログイン画面）
    │   ├── globals.css
    │   └── register/
    │       └── page.tsx              # 追加（ユーザ登録画面）
    ├── components/
    │   └── Providers.tsx             # 追加（AuthProvider + SnackbarProvider をまとめたクライアントコンポーネント）
    ├── contexts/
    │   └── AuthContext.tsx           # 追加（JWT認証状態のグローバル管理）
    ├── lib/
    │   └── api.ts                    # 追加（axiosインスタンス・JWTインターセプター）
    └── types/
        └── index.ts                  # 追加（TypeScript型定義）
```

### フロントエンド 実装予定の残構成

```
src/
├── app/
│   └── projects/
│       ├── page.tsx                  # プロジェクト一覧画面
│       └── [id]/
│           └── tasks/
│               ├── page.tsx          # タスク一覧画面
│               └── [taskId]/
│                   └── page.tsx      # タスク詳細画面
├── components/
│   ├── AppLayout.tsx                 # サイドバー付きレイアウト
│   ├── Sidebar.tsx                   # サイドバー
│   └── modals/
│       ├── CreateProjectModal.tsx    # プロジェクト作成モーダル
│       ├── CreateTaskModal.tsx       # タスク作成モーダル
│       └── CreateWorkLogModal.tsx    # ワーク実績入力モーダル
├── hooks/
│   ├── useProjects.ts
│   ├── useTasks.ts
│   └── useWorkLogs.ts
└── (projects/, register/ は実装済み)
```

## 進捗状況

### 環境構築（完了）

- Java 17.0.18 インストール済み
- Maven 3.9.14 インストール済み
- PostgreSQL 16.13 インストール済み
  - 開発用DB: `task_management_dev`
  - 接続ユーザー: 自PCのユーザ
- Spring Boot 3.5.13 プロジェクト生成済み
  - 場所: `backend/task-management/`
  - プロファイル切り替え設定済み（dev/prod）
  - 起動確認済み（port 8080）
- Next.js（App Router + TypeScript）プロジェクト生成済み
  - 場所: `frontend/`
  - MUI v9 インストール済み
  - 起動確認済み（port 3000）

### 本番環境構成（予定）

- Frontend: Vercel（Next.js）
- Backend: Render（Spring Boot）
- DB: Neon（PostgreSQL）

### バックエンド実装（完了）

全体の進捗：① → ⑥ 完了。フロントエンド実装対応で一部追加修正あり。

- ① Entity（完了）
  - `entity/` パッケージに User, Project, Task, WorkLog を作成
  - JPA Auditing で `created_at` / `updated_at` を自動設定
  - TaskStatus / TaskPriority を enum で管理
  - `TaskAssignment` エンティティを追加（tasks と users の中間テーブル）
- ② Repository（完了）
  - `repository/` パッケージに5つのRepositoryを作成（TaskAssignmentRepository 追加）
  - メソッド名によるクエリ自動生成・`@Query` による工数集計クエリを実装
- ③ Service（完了）
  - `service/` パッケージに4つのServiceを作成
  - TaskService にアサイン操作（追加・削除・一覧取得）を追加
  - `UserService.login` の戻り値を `String` → `LoginResponse` に変更（userId, name, email も返すように）
- ④ Controller / API（完了）
  - `controller/` パッケージに TaskController, WorkLogController, AuthController を作成
  - レスポンスはDTO（TaskResponse, WorkLogResponse）で返す設計
  - 循環参照対策としてEntityを直接返さずDTOに変換
  - タスクアサイン用API（POST/DELETE/GET `/tasks/{taskId}/assignments`）を追加
- ⑤ 動作確認（完了）
  - 全APIエンドポイントの動作確認済み
- ⑥ JWT認証（完了）
  - JJWT ライブラリを導入
  - `security/` パッケージに JwtUtil, JwtProperties, JwtAuthenticationFilter, UserDetailsServiceImpl を作成
  - SecurityConfig を更新（JWTフィルター組み込み・`/auth/**` のみ認証不要）
  - `/auth/register`・`/auth/login` エンドポイントを実装
  - `application-dev.properties` に `jwt.secret`・`jwt.expiration` を追加
  - 本番環境（`application-prod.properties`）では `${JWT_SECRET}` 環境変数から取得する設計
  - ログアウトはステートレスなJWTの性質上、フロントエンドでトークンを削除するだけで対応
  - JWTのペイロードに `userId` をカスタムクレームとして追加（`JwtUtil.generateToken` の引数に userId 追加）

- フロントエンド実装に伴うバックエンド追加修正（完了）
  - `TaskResponse` に `projectName`・`assignedUsers`（id + name）を追加
  - `LoginResponse` に `userId`・`name`・`email` を追加
  - `SecurityConfig` に CORS設定を追加
    - 許可オリジンは `application-dev.properties` の `cors.allowed-origins` で管理
    - 本番環境は `${CORS_ALLOWED_ORIGINS}` 環境変数から取得する設計

### フロントエンド実装（進行中）

- 追加パッケージ: `axios`, `react-hook-form`, `notistack`, `@mui/material-nextjs`, `@emotion/cache`
- VSCode デバッグ設定（`launch.json`）に Next.js 起動設定を追加
- 実装済み画面・コンポーネント
  - `types/index.ts` → TypeScript型定義（全エンティティ・リクエスト・レスポンス型）
  - `lib/api.ts` → axiosインスタンス（JWTインターセプター付き）
  - `contexts/AuthContext.tsx` → 認証状態のグローバル管理（localStorage連携）
  - `components/Providers.tsx` → AuthProvider + SnackbarProvider のまとめ
  - `app/layout.tsx` → AppRouterCacheProvider・CssBaseline・Providers を組み込み
  - `app/page.tsx` → ログイン画面（react-hook-form・トースト通知）
  - `app/register/page.tsx` → ユーザ登録画面（青系デザインでログイン画面と差別化）
  - ログイン・ログアウト・ユーザ登録の動作確認済み

### 次のステップ

⑦ Next.js実装（続き）
  - `components/Sidebar.tsx` → サイドバー
  - `components/AppLayout.tsx` → サイドバー付きレイアウト
  - `app/projects/page.tsx` → プロジェクト一覧画面
  - `components/modals/CreateProjectModal.tsx` → プロジェクト作成モーダル
  - `app/projects/[id]/tasks/page.tsx` → タスク一覧画面
  - `components/modals/CreateTaskModal.tsx` → タスク作成モーダル
  - `app/projects/[id]/tasks/[taskId]/page.tsx` → タスク詳細画面
  - `components/modals/CreateWorkLogModal.tsx` → ワーク実績入力モーダル

---

## 作業の進め方

このプロジェクトは、Next.js, Spring Bootなどの学習を兼ねています。<br>
そのため、**あなたはコードを教えるだけで実装はしないでください。**

以下の流れで作業を進めます。

1. まず最初に環境構築を行いますが、環境構築手順を整理して示してください。また、環境構築に関しては、こちらで許可を出せば、あなたが環境構築を実行してください。
1. 環境構築が完了したら、コーディングを進めます。こちらから何の機能を実装するかを指示しますが、段階的にコードを示してください。<br>
   その際、どのファイルにどのような変更をするのかを示してください。<br>
   また、なぜそのような変更をするのかを示してください。
1. 作業の区切りで、進捗状況をCLAUDE.mdに記載し、次回は続きから作業ができるようにしてください。
