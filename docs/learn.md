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

### mavenについて

pow.xmlを修正したら、手動で以下コマンドを実行する必要がある。

```bash
cd backend/task-management
./mvnw compile
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

## ■具体的な実装

### ◯JwtUtil

```java
public JwtUtil(@Value("${jwt.secret}") String secret,
               @Value("${jwt.expiration}") long expiration) {
  this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
  this.expiration = expiration;
}
```

#### ・@Valueアノテーションについて

@Valueはapplication.properties に書いた値をJavaのフィールドや引数に注入するアノテーション。

application-dev.properties に書いたこの2行が：

```properties
jwt.secret=your-256-bit-secret-key-here-please-change-in-production
jwt.expiration=86400000
```

コンストラクタの引数に自動で注入される。

```
jwt.secret の値  →  secret 引数に入る
jwt.expiration の値  →  expiration 引数に入る
```

### ◯クレームとは

JSON Web Token（JWT）クレームは対象について主張された情報。

たとえば、IDトークン（必ずJWT）には、認証しようとしているユーザーの名前が「John Doe」であると主張するnameクレームが含まれている。<br>
JWTでは、クレームは名前と値のペアで表記され、名前は常に文字列で、値は任意のJSON値になる。<br>
一般的に、JWTに関してクレームと言えば、名前（または鍵）のことを指す。<br>
たとえば、以下のJSONオブジェクトには3つのクレーム（sub、name、admin）が含まれている。

```properties
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}
```

### ◯UserDetailsServiceImplの処理について

UserエンティティからSpring Securityが扱うことができる形式(UserDetailsインタフェース)に変換している。

```java
return org.springframework.security.core.userdetails.User  // Spring SecurityのUserクラス
          .withUsername(user.getEmail())     // ユーザ識別子としてemailをセット
          .password(user.getPasswordHash())  // パスワードハッシュをセット
          .build();                          // UserDetailsオブジェクトを生成
```

- .withUsername() : ユーザを一意に識別するIDとして何を使うかを指定する。<br>
  今回はemailを使っている（usernameという名前だが、emailをセットしてOK）。
- .password() : BCryptでハッシュ化済みのパスワードをセット。<br>
  Spring Securityがログイン時に比較するために使う。
- .build() : ビルダーパターンでオブジェクトを生成

#### ・ログイン処理の流れ

```
ログインリクエスト
    ↓
JwtAuthenticationFilter がトークンからemailを取り出す
    ↓
UserDetailsServiceImpl#loadUserByUsername(email) が呼ばれる
    ↓
DBからUserエンティティを取得
    ↓
Spring SecurityのUserオブジェクトに変換 ← ここ
    ↓
Spring SecurityがUserDetailsとして認証情報を管理する
```

### ◯JwtAuthenticationFilterについて

すべてのリクエストに対して「トークンが正しいか」を検証するフィルター。<br>
この処理は**Controllerの前**で動く。

トークンは、HTTPのリクエスト内で以下のようになっている。

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

doFilterInternalの処理では、トークンを抜き出すとき、先頭の「Bearer 」を取り除いている。

#### ・doFilterInterernalの処理について

```java
// Spring Security が扱う「認証済みトークン」オブジェクトを作成
UsernamePasswordAuthenticationToken authToken =
    new UsernamePasswordAuthenticationToken(
        userDetails,              // 認証されたユーザ情報
        null,                     // パスワード（認証後は不要なのでnull）
        userDetails.getAuthorities()  // 権限リスト（今回はロールなしなので空）
    );

// リクエストの詳細情報（IPアドレスなど）を付加
authToken.setDetails(
    new WebAuthenticationDetailsSource().buildDetails(request)
);
// SecurityContext に認証情報をセット → 「このユーザは認証済み」と記録
SecurityContextHolder.getContext().setAuthentication(authToken);
```

#### ・SecurityContextとは

「現在のリクエストを送ってきたユーザが誰か」を保持する場所。

Spring Securityはリクエストを処理する間、認証済みユーザの情報をスレッドローカル（そのリクエストを処理しているスレッド専用の記憶領域）に保存している。<br>
その保存場所が SecurityContext。

Spring Security は SecurityContext を見て「このリクエストは認証済みか」を判断する。

```
SecurityContext に認証情報がある → 認証済み → 処理を続行
SecurityContext に認証情報がない → 未認証 → 401 を返す
```

つまり SecurityContext にセットしないと、トークンが正しくても毎回 401 になってしまう。

#### ・全体のリクエスト処理イメージ

```
リクエスト受信
    ↓
JwtAuthenticationFilter が動く
    ↓
トークンを検証 → 有効
    ↓
SecurityContext に認証情報をセット  ← ここ
    ↓
SecurityConfig の .anyRequest().authenticated() チェック
    ↓
SecurityContext に認証情報がある → OK → Controllerへ
```

SecurityContextはSpring Securityとアプリの間の「このユーザは認証済みですよ」という合言葉のような役割を果たしている。

#### ・filterChain.doFilter(request, response);の処理について

**自分のフィルターの処理が終わったので、次のフィルターへ渡す**、という意味。<br>
これを呼ばないと、次のフィルターの処理に到達しないので、必ず呼ぶ必要がある。

### ◯SecurityConfigの処理について

#### ・securityFilterChainの処理

```java
http
     // ① CSRFを無効化
     .csrf(csrf -> csrf.disable())

     // ② セッションを使わない（JWTはステートレスなので）
     .sessionManagement(session ->
         session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

     // ③ URLごとのアクセス制御
     .authorizeHttpRequests(auth -> auth
         .requestMatchers("/auth/**").permitAll()   // /auth/* は認証不要
         .anyRequest().authenticated()              // それ以外は認証必要
     )

     // ④ JWTフィルターを既存のフィルターの前に差し込む
     .addFilterBefore(jwtAuthenticationFilter,
         UsernamePasswordAuthenticationFilter.class);
```

##### ① CSRFを無効化

CSRF対策はブラウザのCookieでセッション管理する場合に必要だが、JWTはAuthorizationヘッダーで認証するためCSRF攻撃の対象にならず、不要。

CSRFはWebサイトにログイン中のユーザーを騙し、意図しない操作（メール変更、決済、投稿など）を別のWebサイト経由で強制的に実行させる脆弱性および攻撃手法。<br>
ユーザ認証をセッションを使って行う場合に対策を行わないといけないが、今回はセッションを使わないので、無効化しても良い。

##### ② セッションを使わない

通常のWebアプリはログイン後にサーバ側でセッションを保持するが、JWTは「トークン自体に認証情報が入っている」ためサーバにセッションを持つ必要がない。<br>
**STATELESS**にすることでSpring Securityがセッションを一切作らなくなる。

##### ③ ログインが「認証不要」の意味

一見「ログインするためには認証が必要では？」と思えるが、ここで言う「認証」は別の話。

整理すると以下のようになる。

- 「認証不要」= JWTトークンなしでアクセスできる
- 「認証必要」= JWTトークンが必要

ログインの目的は「トークンを持っていない人がトークンを取得すること」。

```
まだトークンを持っていない(→ログインしていない)
↓
 POST /auth/login にメール+パスワードを送る
↓
 サーバがパスワードを検証
↓
 JWTトークンを返す ← これが「認証」
↓
 以降のリクエストでトークンを使う
```

/auth/login にトークンを要求してしまうと、「トークンを取得するためにトークンが必要」という矛盾が発
生します。そのため permitAll() でトークンなしでもアクセスできるようにしています。

/auth/register も同様で、まだアカウントを持っていない人が登録するエンドポイントなので、当然トーク
ンは持っていません。

#### ・passwordEncoderの処理について

リクエストで渡されたパスワードをハッシュ値に変換する際に利用する**BCryptPasswordEncoder**をクラスのインスタンスを返す。<br>
メソッドの頭に**@Beanアノテーション**を付けることで、このインスタンスをSpringに管理させる。<br>
これにより、UserServiceのpasswordEncoderフィールドにこのインスタンスが自動的に注入(DI)される。

BCryptPasswordEncoder は外部ライブラリのクラスなので、**直接、@Componentをつけられない**。<br>
そのためSecurityConfigに@Beanメソッドとして定義することでSpringに管理させている。

#### ・authenticationManagerの処理について

AuthenticationManager はSpring Securityが内部で持っているオブジェクトだが、デフォルトでは外部から取り出せないようになっている。<br>
これを @Bean として登録することで、将来的に AuthenticationManagerをServiceやControllerに注入して使えるようになる。

現時点では直接使っていませんが、JWT認証の一般的な実装パターンとして定型的に書いておくもの。<br>
例えばSpring SecurityのUsernamePasswordAuthenticationTokenを使ってパスワード検証をAuthenticationManagerに委譲する書き方もあり、その場合に必要になる。

### ◯ログアウト処理について

APIではログアウトの処理は不要。

JWTはサーバに状態を持たない（ステートレス）設計なので、フロントエンドでトークンを削除するだけがログアウトになる。

#### ・流れ

```
フロントエンドでの対応（Next.js実装時）

ログアウトボタンを押す
    ↓
localStorageやCookieからトークンを削除
    ↓
ログイン画面にリダイレクト
```

これだけでログアウトが完結する。

### ◯JWTからトークンにある情報以外を取得する場合

Controllerで、ユーザID(メールアドレスではない)をJWTから取得する場合、以下のやり方で対応する。

#### 1. UserDetailsを継承した独自のUserPrincipalを実装する

ここにユーザID、パスワードハッシュの情報を乗せる。<br>
(パスワードハッシュは処理の流れ上、次の処理で使う。)

#### 2. UserDetailsServiceImplでUserPrincipalを返す

ここで独自実装したUserPrincipalを返す。<br>
これにより、Controllerクラスのメソッドのパラメータとして<code>@AuthenticationPrincipal UserPrincipal principal)</code>を指定することで、UserPrincipalの情報を取得することができる。

#### なぜトークンからuserIdを取ってこないか？

##### ①JWTを「二重解析」している

JWTの検証・解析は JwtAuthenticationFilterがすでに行っている。<br>
コントローラで再度解析するのは、同じことを2回やっていることになる。

```
リクエスト
 ↓
JwtAuthenticationFilter ← ここで「JWTを解析 → userId取得 → SecurityContextに保存」済み
↓
ProjectController ← また「JWTを解析 → userId取得」 ← これが無駄
```

##### ②コントローラが「認証方式の詳細」を知ってしまう

コントローラが知りたいのは「今ログインしているユーザのIDは何か」だけ。<br>
それが「JWTから来る」「Sessionから来る」「OAuth2から来る」かはコントローラが知る必要はない。

しかし直接取る場合、コントローラはJwtUtilに依存する。<br>
将来、認証方式をJWT以外に変えたとき、全コントローラを修正することになる。

##### ③NullPointerExceptionのリスクがある

```java
// Authorization ヘッダーが null だと NPE
String token = httpRequest.getHeader("Authorization").substring(7);
```

フィルターに任せておけば、コントローラに届く時点で「認証済みが保証された状態」になっている。

##### ④テストが難しくなる

直接取る場合、ユニットテストで「JWTを生成してリクエストヘッダーに付ける」という手間が必要になる<br>
@AuthenticationPrincipalならUserPrincipalオブジェクトをモックするだけ。

## ■秘密鍵について

### ◯開発環境について

```properties
# JWT設定
jwt.secret=your-256-bit-secret-key-here-please-change-in-production
jwt.expiration=86400000
```

開発環境はこのままで問題ない。

ただし、秘密鍵の強度には注意が必要。<br>
JJWTはHS256アルゴリズムの場合、256bit（32バイト）以上の秘密鍵を要求する。<br>
現在の your-256-bit-secret-key-here-please-change-in-production<br>
は41文字あるので長さは足りているが、開発用として意味のある文字列に変えておくと管理しやすい。

👉️開発環境では一旦このままで進める。

### ◯本番環境について

application-prod.properties には推測されにくいランダムな文字列を設定する必要がある。

ただし、プロパティファイルに直接書くのは危険。

#### ・本番環境での推奨設定

RenderなどのPaaSでは環境変数として設定し、プロパティファイルからその環境変数を参照する。

#### ・application-prod.properties の書き方:

```properties
# JWT設定
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:86400000}
```

- ${JWT_SECRET} → Renderの環境変数 JWT_SECRET の値が注入される
- ${JWT_EXPIRATION:86400000} → 環境変数がなければデフォルト値 86400000 を使う

#### ・Render側の設定:

Renderの管理画面の「Environment」から環境変数を登録する。

```
JWT_SECRET = (openssl rand -base64 32 などで生成したランダム文字列)
```

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
# 自動的にテーブルをアップデートする設定。本番環境ではnoneにする(Flywayを使うため)。
spring.jpa.hibernate.ddl-auto=update
# デバッグ用にクエリが分かるようにする(多分コンソールに出てくるやつ)。本番環境ではfalseにする。
spring.jpa.show-sql=true
# デバッグ用に出力されたクエリをフォーマットする設定。本番環境では設定しない。
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

---

<br>

# Next.js実装

## ■JWTトークンの保存場所

- localStorage → シンプルだが、XSS攻撃に弱い
- httpOnly Cookie → セキュアだが、バックエンド側でもCookie設定が必要になる

今回はポートフォリオとして開発しているため**localStorage**で進める。

### ◯どうしてlocalStorageにしたのか

- 初期開発のスピードを優先した
- JWT認証の基本フロー理解を目的とした
- 本番ではhttpOnly Cookieに移行可能な設計にしている

## ■トースト通知のライブラリ

- notistack → MUIのSnackbarをラップ。MUIと見た目が統一できる
- react-hot-toast → よりシンプルで軽量

### ◯notistack

#### ・特徴

- MUIベース
- Snackbarの拡張
- 複雑な制御が可能

### ・デメリット

- MUI前提
- 少し重い
- セットアップがやや面倒

### ◯react-hot-toast

- 超シンプル
- 軽量
- 見た目がモダン
- カスタマイズしやすい

### ◯なぜnotistackにしたのか

- MUIとの統一性を重視した
- 実務での利用頻度を考慮した
- Snackbarの制御を柔軟にしたかった

## ■フォームライブラリ

- react-hook-form → パフォーマンスが良く、バリデーションも書きやすい。現在のReactプロジェクトでデファクトスタンダード

react-hook-formを使うことで、必要なところだけ再レンダリングでき、パフォーマンスが良くなる。

### ◯react-hook-formとは

React Hook Formは、Reactでフォームを扱いやすくするためのライブラリ。

Reactでは通常、フォームの各入力欄をuseStateで管理し、それを集めてバリデーションして…という処理が必要になる。<br>
React Hook Form を使うと、そういった作業を簡潔に書けるようになる。

具体的には以下のようなことができる：

- 入力値の管理
- バリデーション（必須、桁数、数値制限など）
- エラーメッセージの表示
- フォームの送信処理

### ◯Reactとの関係性

React Hook Formの中核はuseForm()というカスタムフック。<br>
これはReactのHookシステム（useStateやuseEffect など）と同じ考え方で、フォームの状態を扱えるようにしたもの。

React の設計に沿っているため、シンプルなコードが書ける。

### ◯実際にどう使うのか

#### ・useForm の初期化

まずはUseFormを使って、フォーム全体の管理を準備する。

```typescript
import { useForm } from "react-hook-form";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm();
```

- register
  - 各 input に適用して、フォームとして認識させる
- handleSubmit
  - フォーム送信時にバリデーションを走らせてから処理を行う
- errors
  - バリデーションでエラーになった項目の情報が入る

#### ・入力欄の登録

次に、フォームの中にある&lt;input/&gt;や&lt;textarea/&gt;にregisterを使って登録する。

```typescript
<input {...register("title", { required: "タイトルは必須です" })} />
```

ここで "title" はフィールド名。オブジェクト形式でバリデーションルールも指定できる。<br>

**...register**とスプレッド構文で書いているのは、registerの戻り値が以下のプロパティで返ってくるため。

```typescript
{
  name: "email",
  ref: (element) => { ... },
  onChange: (e) => { ... },
  onBlur: (e) => { ... },
}
```

コンポーネントのPropsとして渡すには、以下のような構文で渡す必要がある。<br>
スプレット構文は例外として、書き方が認められている。<br>
よって、registerをコンポーネントに指定するには、必ずスプレッド構文で書かないといけない。

```typescript
// かならず、propName={値}という形で渡さないといけない
// スプレッド構文は例外として、そのような形の書き方が認められている
<TextField
  name="email"
  ref={...}
  onChange={(e) => { ... }}
  onBlur={(e) => { ... }}
/>
```

#### ・エラーの表示

バリデーションエラーがある場合は、errors に情報が入る。<br>
それを使って、該当する入力欄の下にエラー文を表示する。

```typescript
{errors.title && <p>{errors.title.message}</p>}
```

##### 実際の例

```typescript
<TextField
  label="パスワード"
  type="password"
  fullWidth
  margin="normal"
  {...register("password", { // フォームとして認識させる
    required: "パスワードを入力してください",
  })}
  error={!!errors.password} // 成功時はerrors.passwordがundefinedになるので、!!でfalseになる。trueのときはボーダーやラベルが赤色になる。
  helperText={errors.password?.message} // コンポーネントの下にエラーメッセージを表示する。
/>
```

#### ・フォーム送信処理

送信時にはhandleSubmitを使う。<br>
バリデーションが通ったときのみ、引数で指定した関数が呼ばれる。

尚、onSubmit内で、event.preventDefault()をコールして、ブラウザのデフォルト動作(ページのリロード)を停止する必要はない。<br>
これは、react-hook-formが勝手に呼んでくれるため。

```typescript
const onSubmit = (data) => {
  console.log(data); // data は各 register() に対応する値のまとまり
};

<form onSubmit={handleSubmit(onSubmit)}>
  {/* 各 input 要素 */}
  <button type="submit">送信</button>
</form>
```

#### ・よく使うバリデーションの例

```typescript
register("time", {
  required: "時間の入力は必須です",
  min: {
    value: 1,
    message: "時間は0以上である必要があります",
  },
});
```

#### ・React Hook Form のメリット

- 入力値をuseStateで個別に管理する必要がない
- バリデーション処理をわかりやすく書ける
- コードが短くなり、読みやすくなる

## ■型定義

src/types/index.jsに型の定義を設定する。<br>
ここでも、エンティティ型とAPIリクエスト・レスポンスの療法を設定する。

## ■axios

axiosはfetchの代わりに使うAPI。<br>
今回は各リクエストに、毎回JWTトークンの情報を付加して送信しないといけないので、**インジェクション**が簡単にできるaxiosが便利。

```typescript
import axios from "axios";

// axiosのインスタンスを作成し、APIのベースURLを設定
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// リクエストインターセプター: 毎回のリクエストにJWTトークンを自動付与する
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## ■ユーザ認証関連情報の扱い

src/contexts/AuthContext.tsxで、ユーザ認証関連情報を取得するためのメソッドを実装する。

今回のアプリでは、各画面でログインしているユーザの情報が必要となるため、どの画面でもユーザの情報が取れるようにしたい。

これに対応するため、**コンテキスト**を利用する。<br>
このコンテキストを持つ共通コンポーネントで子コンポーネントをラップし、また、コンテキストのフックを取得するためのメソッドも別途提供することで、子コンポーネントのどこからでも、ユーザの情報が取れるようにする。

## ■カスタムフック

カスタムフックは値と手続きをまとめたもの。(クラスみたいなもの。)

これを使うと、Viewと手続き(APIリクエスト、DOM操作など)を分けることができ、別の処理で再利用も可能となる。

### ◯カスタムフックでAPIを実行する場合

useEffectでコールする必要がある。

useEffectを利用しないと、以下のように無限ループになる。

```
・初回レンダリング時に実行
↓
・APIレスポンス取得、state更新
↓
・state更新により、再レンダリング
↓
・再度APIを叩く処理が実行される
```

### ◯Reactの原則

React の原則：レンダリングは「純粋」であるべき

React では、レンダリング中（関数の本体が実行されている間）は副作用を起こしてはいけないというルールがある。

- 副作用とは：API リクエスト、DOM 操作、タイマー設定など「外の世界」に影響を与える処理
- useEffect はレンダリングが終わった後に副作用を実行するための仕組み

レンダリング（純粋な計算）→ 画面に反映 → useEffect 実行（副作用OK）

## ■プロジェクト一覧画面のスケルトンUI表示について

```typescript
<Grid container spacing={2}>
  {[...Array(4)].map((_, i) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
      <Skeleton
        variant="rectangular"
        height={120}
        sx={{ borderRadius: 2 }}
      />
    </Grid>
  ))}
</Grid>
```

MUIのSkeletonは「読み込み中のプレースホルダー」を表示するコンポーネント。<br>
デフォルトで灰色のアニメーション（波紋）が付いており、「何かが読み込まれている」ことをユーザに伝える。

### ◯プロパティ

- xs: 12 (Extra-small): スマホなど最小画面（0px〜）の場合、12/12列を使用、つまり画面幅いっぱいに表示（1つ）。
- sm: 6 (Small): タブレットなど中間画面（600px〜）の場合、6/12列を使用、つまり半分（2つ）並ぶ。
- md: 4 (Medium): PCなどデスクトップ（900px〜）の場合、4/12列を使用、つまり3等分（3つ）並ぶ。
- key={i}: Reactが識別するためにkeyの指定が必要。ここではインデックスを指定

- variant="rectangular": 形状：四角形
- height={120}: 高さ：120px
- sx={{ borderRadius: 2 }}: 角丸（MUIのスペーシング単位 = 16px）

## &lt;Select&gt;に対するuseFormについて

useFormのregisterはネイティブの&lt;input&gt;要素に直接参照を渡す仕組みである。<br>
これに対し、MUIの&lt;select&gt;はネイティブの&lt;input&gt;ではないため、registerが使えない<br>

これを解決するため、Controllerを使用し、フォームのvalue/onChangeをreact-hook-formと橋渡しする役割を担う。

```typescript
<Controller
  name="example"
  control={control}
  defaultValue=""
  rules={{
    maxLength: {
      value: 100,
      message: "100文字以内で入力してください",
    },
  }}
  render={({ field, fieldState: { error } }) => (
    <TextField
      {...field}
      label="Example"
      error={!!error}
      helperText={error?.message}
      inputProps={{ maxLength: 100 }}
    />
  )}
/>

// 文字数制限について
// inputProps={{ maxLength }}	HTMLレベルで入力を物理的にブロック
// rules={{ maxLength }}	バリデーションでエラーメッセージを表示
// inputProps だけだとフォーム送信時のバリデーションが効かず、rulesだけだと文字は入力できてしまうので、両方セットで使うのが基本。
```

## ■コンポーネント

- Box → Divのような多目的コンポーネント
- Container → Boxの一種。コンテンツを水平方向に中央配置する。
- Paper → Boxの一種。表面を浮き上がらせる。
- Typography → 文字列を扱うためのコンポーネント。
- TextField → テキストフィールド
- Button → ボタン
- MuiLink → ハイパーリンク
- CardActionArea → Cardコンポーネント全体をクリッカブル（クリック可能）にし、ホバー時などにマテリアルデザインのリップル効果や背景色変化を自動で適用するラッパーコンポーネント
- FormControl → フォームの入力要素（input、textareaなど）に対して、ラベル、ヘルプテキスト、エラーメッセージをセットで管理し、アクセシビリティ（障害者や高齢者を含む使いやすさ）を高めるためのコンポーネント
- OutlinedInput → 枠線付きのテキスト入力フィールドを構築するための、Material-UIの低レベルコンポーネント
- CircularProgress → データの読み込み中や処理の進行状況を円形のループアニメーション（インジケーター）で表示するUIコンポーネント
- MoreVertIcon → 「⋮」のアイコン

- List → リスト全体のコンテナ。
- ListItem → 各リスト要素の基本コンポーネント。
- ListItemButton → ホバーやクリック時のスタイルが自動適用される、インタラクティブなリストアイテム。
- ListItemIcon → リスト項目の先頭にアイコンを配置。
- ListItemText → リスト項目のテキスト（メイン・サブ）を表示。
- ListItemAvatar → アバターアイコンを配置する際に使用

- Dialog → 画面の前面にポップアップ表示され、ユーザーに重要情報（確認、警告、入力など）を伝えるモーダルウィンドウコンポーネント
- DialogTitle → タイトル
- DialogContent → 内容
- DialogContentText → 説明文
- DialogActions → ボタン類

## ■プロパティ

- maxWidth="xs" → 最大幅をExtra Small(一般的に444pxまたは600px未満)にする
- elevation={3} → &lt;Paper&gt;コンポーネントなどの背景に、3段階目の深さ（影）を適用するプロパティ。
- fullWidth → 親要素の横幅いっぱいまで広げる
- margin="normal" → MUIのテーマに基づいた、適切な上下のmarginを適用する
- variant="contained" → 背景色付きで影（シャドウ）を持つ、強調された塗りつぶしボタン
- variant="body2" → 主に補足説明、キャプション、長い本文など、通常の本文（body1）よりも少し小さめのフォントサイズやスタイルを適用するために使用される。
- multiline → textareaタグを使用するように設定。
- rows={3} → 最小の高さが3行分になる。
- exclusive → トグルボタングループ(ToggleButtonGroup)で、選択できるトグルボタンを1つにする指定。
- container spacing={2} → Gridの親にspacingを指定し、子要素（Grid item）の間に均等な間隔（デフォルトでは16px: 8px✕2）を自動的に設定する
- gutterBottom → これをtrue（単にgutterBottomと記述）に設定すると、テキスト要素の下部にマージン（margin-bottom）が自動的に追加され、要素間の余白を簡単に確保できる
- renderValue(Select) → 選択された値をどのように表示するかを決定するメソッドを指定する
- slotProps={{ primary: { sx: { fontSize: 14 } } }} → slotPropsを利用して、プライマリテキストのカスタマイズを行う
  - slotProps: ListItemTextのような複合コンポーネントにおいて、内部で使用されている特定の要素（スロット）にpropsを渡すためのプロパティ。
  - primary: ListItemText のメインテキスト（Typographyコンポーネント）を指す。

## ■CSS

- minHeight: "100vh" → 最小の高さが100%
- display: "flex" → Flexboxを使う
- alignItems: "center" → 縦方向で真ん中に置く
- justifyContent: "center" → 横方向で真ん中に置く
- justifyContent: "flex-start" → Flexboxコンテナ内の要素（アイテム）を主軸（デフォルトでは横方向）の左端（開始位置）に寄せて配置するスタイル指定
- justifyContent: "space-between" → Flexboxコンテナ内の要素を両端揃えし、要素間の余白を均等にするスタイル
- bgcolor: "grey.100" → 薄いグレー。値は50~900が指定可能。
- flexShrink: 0 → Flexboxレイアウトにおいて、親要素の幅に対して子要素が収まりきらない（オーバーフローする）場合に、その子要素をどれだけ縮小させるか（縮む比率）を指定するプロパティ
- flexWrap: "wrap" → フレックスアイテム(子要素)の折り返しを許可する
- gap: 2 → フレックスアイテム間の間隔(マージン)を指定する
- flexWrap: "wrap" → 異なる高さの要素が並んでいる場合、すべての要素が一番下（底辺）のラインで揃える
- whiteSpace: "nowrap" → 改行しない
- gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } → Gridの配置指定
  - { xs: "1fr", sm: "1fr 1fr" }: MUIのブレークポイント（Breakpoint）対応オブジェクト。
  - xs: "1fr": extra-small (0px以上)。モバイルデバイスなど、画面が小さい場合に1列で配置。
  - sm: "1fr 1fr": small (600px以上)。タブレットなど、画面が広くなると2列に配置。
- sx={{ gridColumn: { sm: "1 / -1" } }} → CSS Gridレイアウトにおいて、画面幅が sm（600px）以上の時に、その要素をグリッドの全幅に広げる設定
  - gridColumn: CSSの grid-column プロパティを設定し、CSS Gridアイテムの列方向の開始位置と終了位置を制御する。
  - "1 / -1": 「最初の列から最後の列まで」を意味し、グリッドの全幅（カラムの列数に関わらず全体）に要素を span（拡張）させる。
  - { sm: "..." }: MUIのブレークポイントを指定しており、このスタイルは「Small（600px）以上」のデバイスに適用される。
- flex: 1 → このGridアイテムが、コンテナ内で可能な限り残りのスペースを埋めるように拡大（flex-grow: 1）
- overflow: "hidden" → コンテナ（箱）からはみ出した文字を表示しない（隠す）。
- textOverflow: "ellipsis" → 省略されたテキストの末尾に「...」を表示する。

---

<br>

# Claude Codeへの指示

※実際にはここから都度変えて依頼している。<br>
※フロントエンド実装は、CLAUDE.mdにやりたいことを書いて、その内容で進めて、と依頼した。

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

---

<br>

# TypeScriptのファイルを開いていると、CPUを異常に使ってしまう場合

TypeScriptのファイルを開いていると、Code Helper (Plugin)というプロセスが、CPUとメモリを異常に使ってしまう減少が発生した。<br>
以下の手順で修正した。

## ■原因

tsconfig.jsonの設定が問題。

```json
"include": [
  "**/*.ts",    // ← .next/ 以下も全部対象になる
  "**/*.tsx",
  ".next/types/**/*.ts",
  ".next/dev/types/**/*.ts",
  ...
],
"exclude": ["node_modules"]  // ← node_modules しか除外していない
```

.next/ は287MBあり、Next.jsのビルド成果物（JSバンドルのソースマップなど大量のファイル）が入っている。<br>
\\\*_/_.tsのパターンが .next/以下のファイルも全部拾ってしまうため、TypeScript 言語サービスが延々と解析し続けている。

## ■修正方法

2つのファイルを修正します。

### 1. frontend/tsconfig.json — .next を exclude に追加

```json
"exclude": ["node_modules", ".next"] // ".next"を追加
```

.next/types/\*_/_.ts などは include に明示されているので、exclude に .nextを追加しても型定義は引き続き読み込まれる。<br>
（include の明示指定は exclude より優先される。）

### 2. .vscode/settings.json — ファイル監視・検索からも除外

```json
{
  // 下記の設定を追加
  "files.watcherExclude": {
    "**/frontend/.next/**": true,
    "**/frontend/node_modules/**": true
  },
  "search.exclude": {
    "**/frontend/.next": true,
    "**/frontend/node_modules": true
  }
}
```

files.watcherExclude は VSCode のファイル監視デーモン（inotify /FSEvents）が監視するパスを除外する設定。<br>
これが設定されていないと、.next/内のファイルが変わるたびに言語サービスが再解析を走らせる。

ファイルを修正後、VSCodeを再起動する。

---

<br>

# デプロイ

## 1. Neon

Neonにログインして、プロジェクトを作ると、「postgresql://」から始まるURLが発行される。<br>
これを設定ファイル、環境変数に設定すれば良い。<br>
(ユーザ名、パスワードはこのURLに設定されている。)

環境変数はRenderに指定する。<br>
今回は.env.prodに設定しておき、Renderで読み込ませる。

### application-prod.properties

```properties
spring.datasource.url=${DATABASE_URL}
```

環境変数

```properties
DATABASE_URL=jdbc:postgresql://から始まるURL
```

Neonが発行するURLは頭に「jdbc:」が付いていないが、つけないとJDBCドライバが認識できないので注意。

## 2. Flyway導入

本番現場では Flywayなどのマイグレーションツール を使うのが一般的。

仕組み：

- SQLファイル（マイグレーションスクリプト）を書いておく
- 起動時にFlywayが未適用のSQLを順番に実行してテーブルを作成・変更する
- どこまで適用済みかをDBで管理するので、安全にスキーマ管理できる

pom.xmlには以下の設定を追加する。

```xml
<!-- Flyway -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

マイグレーションSQLは以下のように格納する。

```
resources/
 └── db/migration/
          ├── V1**create_users.sql
          ├── V2**create_projects.sql
          ├── V3**create_tasks.sql
          └── V4**create_work_logs.sql
```

---

Flyway導入には以下の作業が増える：

- pom.xml に依存追加
- SQLファイルを書く
- application-prod.propertiesのddl-auto=**none**に変更。

## 3. Render

### 事前準備

RenderはJavaをネイティブサポートしていないので、Dockerを使って環境を作る必要がある。

backend/task-management/Dockerfileを作成し、gitに登録する。

```dockerfile
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/task-management-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ①New Web Serviceを作成

Renderダッシュボードで New → Web Service を選択し、GitHubリポジトリを連携する。

### ②基本設定

| 項目           | 設定値                                        |
| -------------- | --------------------------------------------- |
| Name           | 任意（例: task-management-api）               |
| Language       | Docker                                        |
| Region         | Singapore（日本から近い）                     |
| Root Directory | backend/task-management                       |
| Branch         | main                                          |
| Runtime        | Java ではなく Dockerは使わずNativeでOK → 後述 |
| Build Command  | 設定不要                                      |
| Start Command  | 設定不要                                      |

### ③環境変数設定

Environment Variables に以下を追加。

```properties
# Neonで発行されたURL
DATABASE_URL=Neonで発行されたURLからユーザ名とパスワードを省き、頭にjdbcを付けたもの
DATABASE_USERNAME=Neonで発行されたURLに設定されているユーザ名
DATABASE_PASSWORD=Neonで発行されたURLに設定されているパスワード

# JWTの秘密鍵
JWT_SECRET=秘密鍵の値

# Spring Boot設定(本番用設定で動作)
SPRING_PROFILES_ACTIVE=prod

# CORS設定(後でVercelのURLに変更する)
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Neonが発行するURLは、postgresql://username:password@ep-flat-rice...の形式。
環境変数の指定では、上記の通り、これを編集する必要がある。

### ④Instanceタイプ設定

無料版の場合は**Free**を選択。

### ⑤デプロイ実行

Deploy Web Serviceボタンでデプロイが始まる。

#### よくあるエラーと対処

| エラー                    | 原因                               | 対処                                                                         |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| Permission denied: ./mvnw | mvnwに実行権限がない               | ローカルで git update-index --chmod=+x backend/task-management/mvnw してpush |
| DB接続エラー              | DATABASE_URLの形式ミス             | JDBC形式になっているか確認                                                   |
| Port already in use       | Renderはポート 10000を使う場合あり | 後述                                                                         |

RenderはデフォルトでPort: 10000を期待することがあるので、application-prod.propertiesに以下を追加し、ポート: 8080を使用するよう設定しておく。

```properties
server.port=${PORT:8080}
```

## 4. Vercel

### ①Vercelにログイン・新規プロジェクト作成

Vercelダッシュボードで Add New → Project を選択し、GitHubリポジトリを連携する。

### ②基本設定

| 項目             | 設定値                                              |
| ---------------- | --------------------------------------------------- |
| Framework Preset | Next.js（Root Directoryを設定すると自動設定される） |
| Root Directory   | ./frontend                                          |
| Build Command    | そのまま（next build）                              |
| Output Directory | そのまま                                            |

### ③環境変数を設定

Environment Variables に以下を追加する。

| キー                     | 値                            |
| ------------------------ | ----------------------------- |
| NEXT_PUBLIC_API_BASE_URL | https://(RenderのサービスURL) |

RenderのサービスURLは Renderダッシュボードの該当サービスページ上部に表示されている。<br>
（例：https://task-management-api.onrender.com）

### ④Deploy実行

Deploy ボタンを押してデプロイを開始する。
