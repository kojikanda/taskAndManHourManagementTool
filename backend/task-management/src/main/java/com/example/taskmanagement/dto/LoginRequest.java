package com.example.taskmanagement.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * ログインリクエストDTO
 */
@Getter
@Setter
public class LoginRequest {
    /**
     * メールアドレス
     */
    private String email;

    /**
     * パスワード
     */
    private String password;
}
