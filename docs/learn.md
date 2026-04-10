# 環境構築について

## ■本番環境

本番環境では以下の構成で進める。

- Vercel: Next.js用
- Render: Spring Boot用
- Neon: DB, ただしローカル環境ではローカルでインストールしたPostgreSQLを使う

VercelはNext.jsに特化した環境であるため、VercelでSpring Bootを動かすことができない。<br>
そのため、Spring Bootが動かせるRenderを使う。

RenderにはDB(PostgreSQL)も使えるが、無料版では30日でデータが消えてしまう。<br>
これを防ぐため、Neonを使う。<br>
Neonは無料でも3GBまで使え、またデータが消えることも無いため、個人利用なら問題なし。

ただし、Renderは15分、Neonは5分利用が無いとき、スリープに入る。<br>
スリープに入ると、次使えるようになるまで30秒から60秒かかるので、初回は時間がかかる。<br>
今回は個人利用であるため、この制約を受け入れて使う。(ReadMeにはスリープで遅くなることを書いておく。)

## ■インストール

- Java 17.0.18: homebrewでOpenJDKをインストール
- Maven 3.9.14: homebrewでインストール
- PostgreSQL 16.13: homebrewでインストール
  - 開発用DB: `task_management_dev`
  - 接続ユーザー: 自PCのユーザ
- Spring Boot 3.5.13: https://start.spring.io/ から希望のものを設定してダウンロード。解答したものをbackend以下に置く。
  - 場所: `backend/task-management/`
  -
- Next.js（App Router + TypeScript）プロジェクト生成済み
  - 場所: `frontend/`
  - MUI v9 インストール済み

## ■開発環境

### Spring Boot起動

```bash
cd backend/task-management
./mvnw spring-boot:run
```

---

<br>

# JWTとは

JWT(JSON Web Token)とは、ログイン状態をサーバーに持たずに管理する仕組み。

## ■通常のログインとJWT方式との違い

### 通常のログイン(セッション方式)

- **サーバーがログイン状態を保持**する
- メモリやDBにセッションを保存

### JWT方式

- ログイン時に「トークン」を発行
- クライアントがそれを持ち続ける
- リクエストごとに送る

→**サーバーは状態を持たない**

## ■今回のアプリにおける流れ

### ① ログイン

- メール + パスワード送信

↓

### ② サーバー（Spring Boot）

- 正しければJWT(→トークン)を発行

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

↓

### ③ フロント（Next.js）

- このトークンを保存（localStorageなど）

↓

### ④ APIアクセス時

```
Authorization: Bearer <JWT>
```

↓

### ⑤ サーバー

- トークンを検証
- OKなら処理実行

## ■JWTの中身（イメージ）

実はトークンの中に情報が入っている。

```json
{
  "userId": 1,
  "email": "test@example.com",
  "exp": 1710000000
}
```

→「この人は誰か」が分かる

## ■今回どこで使うか

### ① ログインAPI

```
POST /auth/login
```

→ JWTを返す

### ② 認証が必要なAPI

- タスク作成
- 作業ログ追加

→JWT必須

### ③ ユーザー識別

```java
userId = JWTから取得
```

→DBと紐付け

## ■メリット

### サーバーが楽

- セッション管理不要

### スケールしやすい

- 分散環境OK

### フロントと相性良い

- Next.jsと相性抜群

## ■デメリット

- トークン管理をミスると危険
- ログアウトが少し面倒

## ■今回の実装

### 必要なもの

- ログインAPI
- JWT生成
- JWT検証フィルター

### (今回は)不要なもの

- リフレッシュトークン
- 複雑な権限管理

## ■Spring Bootでの構成（イメージ）

### ① JWT生成

```java
String token = jwtUtil.generateToken(user);
```

###② フィルター

```java
Authorization: Bearer xxx
```

→毎リクエストでチェック

## ■よくあるミス（重要）

### ❌ セッションと混ぜる

👉 どっちかにする

### ❌ トークンに情報入れすぎ

👉 最小限（userIdだけでOK）

### ❌ 有効期限なし

👉 必ずexp入れる

---

<br>

# Spring Bootについて

## ■ Spring Bootとは

Spring Bootは、JavaでWebアプリケーションを効率的に開発するためのフレームワーク。

- 設定を極力省略（Convention over Configuration）
- すぐに動くWebアプリを作れる
- APIサーバー構築に強い

## ■ Spring Bootを使うメリット

### ① 設定が少ない（爆速で開発できる）

通常のSpringは設定が複雑だが、Spring Bootは自動設定がある。

👉 例

- DB接続
- サーバー起動（Tomcat内蔵）

### ② すぐにAPIが作れる

```java
@RestController
public class TaskController {
    @GetMapping("/tasks")
    public String getTasks() {
        return "Hello";
    }
}
```

👉 これだけでAPIが動く

### ③ エコシステムが強い

- Spring Data JPA（DB操作）
- Spring Security（認証）
- バッチ処理 etc

### ④ 実務で使われている

👉 ポートフォリオとして評価されやすい

## ■ DI（依存性注入）とは（超重要）

Springのコア概念👇

👉 「クラスの依存関係を自動で注入する仕組み」

### 通常（NG例）

```java
UserService service = new UserService();
```

### Spring（DI）

```java
@Autowired
UserService service;
```

👉 インスタンス生成をSpring(DI)が管理

**これにより、使うクラスが変わっても、そのクラスを使う方の処理を極力変更しないで済むようになる。**

## ■ 主要アノテーション一覧

### @Component

- Spring管理対象のクラスに付ける
- DIの対象になる

👉 最も基本

### @Controller

- Webリクエストを受け取るクラス
- 画面（HTML）向け

### @RestController

- API用（JSON返す）
- 今回はこれを使う

### @Service

- ビジネスロジックを書く層

👉 例：タスク作成処理

### @Repository

- DBアクセスを担当
- Spring Data JPAとセットで使う

### @Autowired

- DIを実現するためのアノテーション
- 自動で依存オブジェクトを注入

→@Autowiredは使う側の処理に付ける。

### @Aspect（少し応用）

- 横断的関心（AOP）を扱う

👉 例

- ログ出力
- トランザクション管理

## ■ レイヤー構造（重要）

Spring Bootは基本この構造👇

```
Controller → Service → Repository → DB
```

### Controller

- リクエスト受付
- レスポンス返却

### Service

- ビジネスロジック
- 複雑な処理を書く

### Repository

- DB操作

## ■ 今回のアプリでの対応

### Controller

- タスク取得API
- 工数登録API

### Service

- タスク作成ロジック
- 工数集計

### Repository

- tasksテーブル操作
- work_logs操作

## ■ Spring Data JPA（重要）

👉 ORMの一種

### 何ができる？

```java
public interface TaskRepository extends JpaRepository<Task, Long> {
}
```

👉 これだけで👇

- CRUD全部使える

## ■application.properties

今回は

- application-dev.properties (開発用)
- application-prod.properties (本番用)

の2つに分ける。

```properties
# ローカルPostgreSQL接続設定
spring.datasource.url=jdbc:postgresql://localhost:5432/task_management_dev
spring.datasource.username=wanchi
spring.datasource.password=

# JPA設定
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## ■ 今回の開発で重要なポイント

### ① REST APIを作る

- Next.jsから呼ばれる

### ② JSONベース

- フロントと連携

### ③ CORS設定（忘れがち）

```java
@CrossOrigin
```

## ■ よくある初心者の詰まりポイント

### ❌ @Autowiredが効かない

👉 Spring管理外のクラス

### ❌ EntityとDTO混同

👉 分けるのがベスト

### ❌ Controllerにロジック書く

👉 Serviceに寄せる

## ■参考URL

https://qiita.com/ist-a-ku/items/1d278619f241f4800bb2

---

<br>

# Claude Codeへの指示

## ■ 全体の実装戦略（重要）

👉 バックエンド → フロントの順で進める

### 理由👇

- APIがないとフロントが作れない
- Spring Bootの理解が進む

## ■ 実装の全体ステップ

① DB設計（Entity）
② Repository
③ Service
④ Controller（API完成）
⑤ 動作確認
⑥ Next.js実装
⑦ フロント連携
⑧ デプロイ

## ■ ステップ① Entity作成（最優先）

### やること

- tasksテーブル
- work_logsテーブル

### Claude Code用プロンプト

```
Spring Bootで、CLAUDE.mdの「DB設計」に記載しているEntityクラスを作成してください。

【要件】
・JPA（Hibernate）を使用
・Lombokを使用
・テーブル名も明示する

【補足】
・created_at, updated_atは自動設定にしてください
```

## ■ ステップ② Repository

### Claude Code用プロンプト

```
Spring Data JPAを使用してRepositoryを作成してください。

① TaskRepository

- JpaRepository<Task, Long>

② WorkLogRepository

- JpaRepository<WorkLog, Long>

【追加要件】
・WorkLogRepositoryに以下のメソッドを追加

- 指定したtaskIdの作業ログ一覧取得
```

## ■ ステップ③ Service（ロジック）

### Claude Code用プロンプト

```
Serviceクラスを作成してください。

① TaskService

- タスク一覧取得
- タスク作成
- タスク更新
- タスク削除

② WorkLogService

- 作業ログ登録
- タスクごとの作業ログ一覧取得
- タスクごとの合計工数算出

【要件】
・@Serviceを使用
・Repositoryを利用する
```

## ■ ステップ④ Controller（API）

### Claude Code用プロンプト

```
REST APIを作成してください。

① TaskController

- GET /tasks
- POST /tasks
- PUT /tasks/{id}
- DELETE /tasks/{id}

② WorkLogController

- GET /tasks/{taskId}/worklogs
- POST /tasks/{taskId}/worklogs

【要件】
・@RestControllerを使用
・JSON形式でやり取り
・CORS対応を追加
```

## ■ ステップ⑤ 動作確認（重要）

### やること

- Postman or curlで確認

```bash
curl http://localhost:8080/tasks
```

---

👉 ここまでで
バックエンド完成（超重要）

## ■ ステップ⑥ Next.js実装

### Claude Code用プロンプト

```
Next.js（TypeScript）で以下の画面を作成してください。

① タスク一覧画面

- APIからタスク一覧取得
- 表示

② タスク作成フォーム

- title, description入力
- POST /tasks

【要件】
・fetchまたはaxiosを使用
・環境変数でAPI URL管理
```

## ■ ステップ⑦ フロント連携

### Claude Code用プロンプト

```
Next.jsからSpring Boot APIに接続してください。

【要件】
・API URLは環境変数で管理
・エラーハンドリング追加
・ローディング状態を管理
```

## ■ ステップ⑧ 追加機能（余裕あれば）

- 工数入力UI
- 合計時間表示
- ステータス管理（TODO / DOING / DONE）
