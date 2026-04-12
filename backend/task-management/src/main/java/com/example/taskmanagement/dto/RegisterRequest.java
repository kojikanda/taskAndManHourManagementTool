package com.example.taskmanagement.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * ユーザー登録リクエストDTO
 */
@Getter
@Setter
public class RegisterRequest {
    /**
     * ユーザー名
     */
    private String name;

    /**
     * メールアドレス
     */
    private String email;

    /**
     * パスワード
     */
    private String password;
}
