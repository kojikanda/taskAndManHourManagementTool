package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.User;
import lombok.Getter;

/**
 * ユーザレスポンスDTO
 */
@Getter
public class UserResponse {

    /**
     * ユーザID
     */
    private final Long id;

    /**
     * ユーザ名
     */
    private final String name;

    /**
     * メールアドレス
     */
    private final String email;

    /**
     * UserエンティティからユーザレスポンスDTOを生成するコンストラクタ
     * 
     * @param user Userエンティティ
     */
    private UserResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
    }

    /**
     * UserエンティティからユーザレスポンスDTOを生成するファクトリメソッド
     * 
     * @param user Userエンティティ
     * @return ユーザレスポンスDTO
     */
    public static UserResponse from(User user) {
        return new UserResponse(user);
    }
}
