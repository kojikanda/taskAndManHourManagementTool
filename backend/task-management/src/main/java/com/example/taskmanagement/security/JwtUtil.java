package com.example.taskmanagement.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    /**
     * JWTの秘密鍵
     */
    private final SecretKey secretKey;

    /**
     * トークンの有効期限（ミリ秒）
     */
    private final long expiration;

    /**
     * コンストラクタ
     * 
     * @param secret     JWTの署名に使用する秘密鍵
     * @param expiration トークンの有効期限（ミリ秒）
     */
    public JwtUtil(JwtProperties jwtProperties) {
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
        this.expiration = jwtProperties.getExpiration();
    }

    /**
     * メールアドレスとユーザIDからJWTトークンを生成する
     * 
     * @param email  ユーザのメールアドレス
     * @param userId ユーザID
     * @return 生成されたJWTトークン
     */
    public String generateToken(String email, Long userId) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(secretKey)
                .compact();
    }

    /**
     * トークンからメールアドレスを抽出する
     * 
     * @param token JWTトークン
     * @return メールアドレス
     */
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    /**
     * トークンからユーザIDを抽出する
     */
    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }

    /**
     * トークンが有効かどうかを検証する
     * 
     * @param token JWTトークン
     * @param email メールアドレス
     * @return トークンが有効であればtrue、そうでなければfalse
     */
    public boolean isTokenValid(String token, String email) {
        return extractEmail(token).equals(email) && !isTokenExpired(token);
    }

    /**
     * トークンが期限切れかどうかをチェックする
     * 
     * @param token JWTトークン
     * @return トークンが期限切れであればtrue、そうでなければfalse
     */
    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    /**
     * トークンからクレームを抽出する
     * 
     * @param token JWTトークン
     * @return クレーム
     */
    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
