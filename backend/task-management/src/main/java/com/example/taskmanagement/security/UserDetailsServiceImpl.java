package com.example.taskmanagement.security;

import com.example.taskmanagement.entity.User;
import com.example.taskmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * ユーザ詳細情報サービス実装
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    /**
     * ユーザリポジトリ
     */
    private final UserRepository userRepository;

    /**
     * ユーザ名からユーザ詳細情報をロードする
     *
     * @param email ユーザのメールアドレス
     * @return ユーザ詳細情報
     * @throws UsernameNotFoundException ユーザが見つからない場合
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Usersテーブルから取得した情報を元に、Spring SecurityのUserDetailsオブジェクトを作成して返す
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .build();
    }
}
