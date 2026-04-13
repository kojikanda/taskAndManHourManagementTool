package com.example.taskmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * ログインレスポンスDTO
 */
@Getter
@AllArgsConstructor
public class LoginResponse {
    /**
     * JWTトークン
     */
    private String token;

    /**
     * ユーザID
     */
    private Long userId;

    /**
     * ユーザ名
     */
    private String name;

    /**
     * メールアドレス
     */
    private String email;
}
