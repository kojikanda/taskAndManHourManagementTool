package com.example.taskmanagement.service;

import com.example.taskmanagement.entity.User;
import com.example.taskmanagement.repository.UserRepository;
import com.example.taskmanagement.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ユーザーのサービスクラス
 */
@Service
@RequiredArgsConstructor
public class UserService {

    /**
     * ユーザリポジトリ
     */
    private final UserRepository userRepository;

    /**
     * パスワードエンコーダー
     */
    private final PasswordEncoder passwordEncoder;

    /**
     * JWTユーティリティ
     */
    private final JwtUtil jwtUtil;

    /**
     * ユーザーを作成する
     * 
     * @param name        ユーザー名
     * @param email       メールアドレス
     * @param rawPassword 生パスワード
     * @return 作成されたユーザー
     */
    @Transactional
    public User createUser(String name, String email, String rawPassword) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already in use: " + email);
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));

        return userRepository.save(user);
    }

    /**
     * IDでユーザーを取得する
     * 
     * @param id ユーザーID
     * @return ユーザー
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    /**
     * ログイン認証を行い、JWTトークンを返す
     * 
     * @param email       メールアドレス
     * @param rawPassword 生パスワード
     * @return JWTトークン
     */
    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        return jwtUtil.generateToken(email);
    }
}
