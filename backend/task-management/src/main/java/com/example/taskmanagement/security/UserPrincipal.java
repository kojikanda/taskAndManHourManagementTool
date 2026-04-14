package com.example.taskmanagement.security;

import com.example.taskmanagement.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Securityのプリンシパルクラス<br>
 * userIdを保持することで、コントローラから@AuthenticationPrincipalで取り出すことができる。
 */
@Getter
public class UserPrincipal implements UserDetails {

    /**
     * ユーザID
     */
    private final Long userId;

    /**
     * メールアドレス
     */
    private final String email;

    /**
     * パスワードハッシュ
     */
    private final String passwordHash;

    /**
     * コンストラクタ
     * 
     * @param user ユーザエンティティ
     */
    public UserPrincipal(User user) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
    }

    /**
     * 権限リスト取得
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // ロールベース認可は今回不要
        return List.of();
    }

    /**
     * パスワードハッシュ取得
     */
    @Override
    public String getPassword() {
        return passwordHash;
    }

    /**
     * ユーザ名(メールアドレス)取得
     */
    @Override
    public String getUsername() {
        return email;
    }
}
