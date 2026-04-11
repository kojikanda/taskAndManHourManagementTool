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

### ② フィルター

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
spring.datasource.username=xxx
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

## ■依存関係を注入(DI)について

### ◯まず「依存関係」とは何か

```java
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
}
```

この場合：

- ProjectService は ProjectRepository を使う
- ProjectService は UserRepository を使う

👉 つまり

ProjectService はこれらに依存している

### ◯DIありとなしの違い

#### ・DIしない場合（昔ながら）

```java
public class ProjectService {

    private ProjectRepository projectRepository = new ProjectRepository();

}
```

これの問題：

- 自分でインスタンスを作ってしまう
- 差し替えができない
- テストしづらい

#### ・DIあり（Spring）

```java
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

}
```

👉 これだけでOK

なぜかというと：

- Springが勝手に ProjectRepository を作る
- それをコンストラクタで渡してくれる

### ◯裏で何が起きているか

#### ① SpringがBeanを作る

```java
@Repository
public interface ProjectRepository ...
```

👉 Springがこれを見てインスタンス生成

#### ② Serviceも作る

```java
@Service
public class ProjectService ...
```

👉 これもSpringが管理

#### ③ コンストラクタに注入

```java
@RequiredArgsConstructor により：

public ProjectService(ProjectRepository projectRepository, UserRepository userRepository) {
  this.projectRepository = projectRepository;
  this.userRepository = userRepository;
}
```

が自動生成される

👉 Springがここに値を渡す

### ◯できるようになること（ここが本題）

#### ① 疎結合になる（超重要）

Serviceは「Repositoryを使う」ことだけ知っている<br>
「どう作るか」は知らない

👉 設計がきれいになる

#### ② テストがめちゃくちゃ楽

例：

```java
ProjectRepository mockRepo = mock(ProjectRepository.class);
ProjectService service = new ProjectService(mockRepo, mockUserRepo);
```

👉 DBなしでテストできる

#### ③ 実装の差し替えが簡単

例えば：

- 本番 → DB Repository
- テスト → Mock Repository

👉 コードを変えずに切り替え可能

#### ④ Springの機能と連携できる

- トランザクション管理（@Transactional）
- キャッシュ
- AOP

👉 DI前提で動く

### ◯よくある誤解

#### ❌ 「DI = ただのnew省略」

→ 違う

👉 設計思想そのもの

#### ❌ 「なくても動くから不要」

- 小さいアプリならOK<
- 大きくなると地獄

### ◯イメージで理解する

#### ・DIなし

```
ProjectService
  └── 自分でRepositoryを作る
```

#### ・DIあり

```
Spring（工場）
  ├── ProjectRepositoryを作る
  └── UserRepositoryを作る
        ↓
ProjectServiceに渡す
```

👉 Serviceは「使うだけ」

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

① DB設計（Entity）<br>
② Repository<br>
③ Service<br>
④ Controller（API完成）<br>
⑤ 動作確認<br>
⑥ Next.js実装<br>
⑦ フロント連携<br>
⑧ デプロイ<br>

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
```

## ■ ステップ③ Service（ロジック）

### Claude Code用プロンプト

```
Serviceクラスを作成してください。

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

① プロジェクト一覧画面

- APIからプロジェクト一覧取得
- 表示

② タスク一覧画面

- プロジェクト一覧画面からタスク一覧
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

# Spring Boot実装

## ■@EnableJpaAuditing (TaskManagementApplication)

created_at / updated_at の自動設定には Spring Data JPA の Auditing機能を使う。<br>
@EnableJpaAuditing はそのスイッチ。<br>
これがないと後述の @CreatedDate / @LastModifiedDate が機能しない。

## ■Entity (DBのテーブル)

### ◯アノテーション / フィールド

| 項目                                              | 説明                                                                                                      |
| :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| @Entity                                           | このクラスがDBテーブルに対応することをJPAに伝える                                                         |
| @Table(name = "users")                            | テーブル名を明示。省略するとクラス名になる                                                                |
| @EntityListeners(AuditingEntityListener.class)    | Auditing機能を有効化。これがないと@CreatedDate 等が動かない                                               |
| @Id + @GeneratedValue                             | 主キー＋自動採番（PostgreSQLのSERIAL相当）                                                                |
| @Column(updatable = false)                        | created_at は INSERT 時のみ設定し、UPDATEで変更させない                                                   |
| @OneToMany(mappedBy = "owner")                    | Projectの owner。フィールドが外部キーの主導権を持つことを示す                                             |
| @Getter @Setter @NoArgsConstructor                | @Data を使わない理由は後述                                                                                |
| @Column(name = "password_hash", nullable = false) | フィールド名と実際のDBのカラム名が一致しないときnameにカラム名を指定する                                  |
| @Enumerated(EnumType.STRING)                      | DBにenumを "TODO" のような文字列で保存。ORDINAL（数値）は避ける（enumの順番を変えるとデータが壊れるため） |
| BigDecimal forestimatedHours                      | 工数は 1.5時間 のような小数を扱うため Double より精度の高いBigDecimal を使用                              |
| LocalDate for dueDate                             | 日付のみ（時刻なし）なので LocalDate。created_at は日時なのでLocalDateTime                                |

#### ※なぜ @Data を使わないか

LombokのアノテーションにはEntityに向いていないものがある。

```java
@Data = @Getter + @Setter + @ToString + @EqualsAndHashCode + @RequiredArgsConstructor
```

- @ToString → 双方向リレーション（User ↔ Project ↔ Task）があると 無限ループでStackOverflowが発生
- @EqualsAndHashCode → JPAのプロキシオブジェクト（遅延ロード用のラッパー）と比較すると正しく動かないケースがある

そのため、Entityには @Getter @Setter @NoArgsConstructor の組み合わせが安全。

- @NoArgsConstructor → デフォルトコンストラクタを生成

### ◯外部キーの管理

```java
// User.java
@OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
private List<Project> projects = new ArrayList<>();

// Project.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "owner_id", nullable = false)
private User owner;  // ← "owner" というフィールド名
```

#### ・OneToMany

「1つのUserが複数のProjectを持つ」というリレーションを表す。

```
User(1) ─── Project(N)
```

#### ・mappedBy = "owner" の意味

「外部キーの管理はProject側の owner フィールドに任せる」 という宣言。

DBの外部キー（owner_id）は Projectテーブルにあるので、その管理責任はProject側にある。<br>
User側は「自分は管理しない、Projectの ownerフィールドを見ろ」と指示しているイメージ。

```
[users テーブル]
id | name | ...

[projects テーブル]
id | name | owner_id(FK)
                ↑
                ここで外部キーを持っている
```

mappedBy を書かないと、JPAは「両方が外部キーを管理しようとしている」と誤解し、余分な中間テーブルを作ろうとしてしまう。

#### ・cascade = CascadeType.ALL の意味

「Userに対する操作をProjectにも連鎖させる」 という設定。

| 操作                  | 挙動                            |
| --------------------- | ------------------------------- |
| Userを保存（persist） | 紐づくProjectも一緒に保存される |
| Userを更新（merge）   | 紐づくProjectも一緒に更新される |
| Userを削除（remove）  | 紐づくProjectも一緒に削除される |

#### ・@ManyToOne(fetch = FetchType.LAZY) について

デフォルトは EAGER（関連データを即時ロード）だが、LAZY（必要になった時にロード）を明示している。<br>
Projectを取得するたびにUserのデータまで引っ張ってきてしまうのを防ぎ、パフォーマンスが向上する。

### ◯Entityを作ってSpring Bootを動かすと

spring.jpa.hibernate.ddl-autoの設定によっては、**Hibernateが自動でテーブルを作成**してくれる。

application-dev.propertiesに以下が設定されていれば、起動時にテーブルが作られる。

```properties
spring.jpa.hibernate.ddl-auto=update
```

## ■repositoryについて

repositoryはDB操作を実装したもの。<br>
実装と言っても、実際にはInterfaceを実装するだけで良い。

### ◯JpaRepository<Entity, ID型> を継承するだけでよい理由

Spring Data JPA が以下のメソッドを自動生成してくれる。

| メソッド       | 内容            |
| -------------- | --------------- |
| save(entity)   | INSERT / UPDATE |
| findById(id)   | 主キーで1件取得 |
| findAll()      | 全件取得        |
| deleteById(id) | 主キーで削除    |

自分で SQL を書く必要はない。

👉️ JPAにより、実装量が格段に少なくなる。

### ◯メソッド名によるクエリ自動生成

```java
List<Task> findByProjectId(Long projectId);
```

これもSQLを書いていないが、メソッド名のルールからSpringが自動的に以下のSQLを生成する。

```sql
SELECT \* FROM tasks WHERE project_id = ?
```

findBy + フィールド名 の形式で書くだけでOK。

### ◯@Query を使う場面

メソッド名では表現できない複雑なクエリは @Query で書く。

```java
@Query("SELECT COALESCE(SUM(w.hours), 0) FROM WorkLog w WHERE w.task.id = :taskId")
BigDecimal sumActualHoursByTaskId(@Param("taskId") Long taskId);
```

#### ポイント：

- これは JPQL（テーブル名ではなくEntityクラス名・フィールド名で書く SQL)
- COALESCE(..., 0) はWorkLogが1件もない場合に null でなく 0 を返すための記述
- このメソッドが後の「工数集計API（見積 vs 実績）」で使われる

### ◯Optionalについて

```java
Optional<User> findByEmail(String email);
```

Optionalは**「値が存在しない可能性がある」**ことを明示するために使う。

👉 「空かもしれない」というのが型で分かる。<br>
👉️ NullPointerExceptionが発生しないように処置する必要があるから、NullPointerExceptionが発生するのを強制的に防ぐことができる。

#### ・Opetionalが返ってくるときの処理例

##### ① 値があるかチェック

```java
if (userOpt.isPresent()) {
    User user = userOpt.get();
}
```

##### ② よく使う書き方（推奨）

```java
User user = userOpt.orElseThrow(() -> new RuntimeException("ユーザが見つかりません"));
```

👉 見つからなければ例外

##### ③ デフォルト値

```java
User user = userOpt.orElse(new User());
```

## ■Serviceについて

アプリケーションの「核心となる業務処理」を担当する部分で、通常@Serviceアノテーションを付与したサービスクラスに実装される処理。<br>
これは**ビジネスロジック**と呼ばれる。<br>
データの計算、加工、条件分岐、外部システム連携などのルールを担い、コントローラー（入力）とリポジトリ（DB操作）を仲介する。

Serviceクラスでは、Spring Bootで重要な、Repositoryクラスについて「依存関係の注入（DI）」の実装を行っている。<br>
これにより、Repositoryクラスの実装が変わっても、Serviceクラスの処理には影響を与えない。<br>
また、例えばテストでDBが使えない状況であっても、MockのRepostoryクラスのインスタンスを指定することで、Serviceクラスの試験を実施することができる。

### ◯@Transactional(readOnly = true) を使う理由

| アノテーション                  | 用途                     |
| ------------------------------- | ------------------------ |
| @Transactional                  | INSERT / UPDATE / DELETE |
| @Transactional(readOnly = true) | SELECT のみ              |

まず、@Transactionalをつけることで、1つのトランザクションで実行することを確約する。<br>
また、例外発生したときは自動的にロールバックもしてくれる。

**Controller-Service間で、1つのトランザクションで実行できているかを認識して実装する必要がある。**

readOnly = true にすると Hibernate の最適化が効き、不要な変更検出（ダーティチェック）をスキップするため、参照系の処理が効率化される。

## ■Controllerについて

ControllerはHTTPリクエストの受け口となるクラス。

```
クライアント → [DTO] → Controller → Service → [Entity] → DB
```

### ◯DTOとEntityを分けている理由

- DTO（Data Transfer Object）：APIの入出力専用のクラス。受け取りたい項目だけ定義できる
- Entity：DBのテーブル構造に対応するクラス

Entityをそのままリクエストで受け取ると、id や createdAt などクライアントに設定させてはいけないフィールドまで上書きできてしまうため、入力用にDTOを分けている。

### ◯@RestController と @RequestMapping の関係

#### ・@RestControllr

@RestController は @Controller + @ResponseBodyの組み合わせ。<br>
メソッドの戻り値を自動的にJSONに変換してレスポンスとして返す。

👉️ REST APIは**データを返すAPI**だから、この組み合わせが良いということで、@RestControllerを使っている。

- @Controller → Springのコントローラとして認識
- @ResponseBody → 戻り値をそのままHTTPレスポンスにする

#### ・@Controller

@Controllerのみだと、画面(HTML)を返すAPIになる。

👉️ 今回は**データ**を返したいので、やりたいこととは違う。

### ◯@GetMapping / @PostMapping / @PutMapping

@GetMapping / @PostMapping / @PutMapping はそれぞれHTTPメソッドに対応している。

### ◯ResponseEntity を使う理由

```java
return ResponseEntity.ok(task); // 200 OK + body
```

この処理で、HTTPステータスコードを明示的に指定できる。

今後エラー処理を追加するときも、

```java
ResponseEntity.notFound();
ResponseEntity.badRequest();
```

のように使える。

## ■循環参照について

Entityは別のEntityを持つことで、相互に参照している状態になっている。<br>
これをそのまま利用し、データを取得するServiceの処理でEntityを返すようにすると、その先のControllerがJSONに変換する処理で**循環参照**が発生する。<br>
その場合、StackOverFlowErrorが発生する。

### ◯循環参照を避けるには

ServiceでEntityを返すのではなく、**DTO**を返すようにする。

重要なのは、**DTOは必要なデータだけを持つように設計するから、循環構造を作らない**、ということ。

例えば、DTOではTaskの情報を帰す場合、絶対にProjectのインスタンスは持たないようにするのが基本。<br>
👉️ Entityではなく**値**を設定する。<br>
👉️ 絶対に循環参照にならない。
