package com.example.taskmanagement.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWTプロパティクラス
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * JWTの秘密鍵
     */
    private String secret;

    /**
     * JWTの有効期限（秒）
     */
    private long expiration;
}
