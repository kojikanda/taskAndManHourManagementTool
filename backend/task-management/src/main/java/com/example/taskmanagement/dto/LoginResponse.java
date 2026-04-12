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
}
