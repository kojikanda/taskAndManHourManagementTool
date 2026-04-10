package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * ユーザのリポジトリインターフェース
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * メールアドレスでユーザを検索する
     * 
     * @param email メールアドレス
     * @return ユーザのオプショナル
     */
    Optional<User> findByEmail(String email);
}
