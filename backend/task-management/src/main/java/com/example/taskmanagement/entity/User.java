package com.example.taskmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ユーザエンティティクラス
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class User {

    /**
     * ユーザID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ユーザ名
     */
    @Column(nullable = false)
    private String name;

    /**
     * メールアドレス
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * パスワードハッシュ
     */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /**
     * ユーザが所有するプロジェクトのリスト
     */
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Project> projects = new ArrayList<>();

    /**
     * ユーザが作成したワークログのリスト
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<WorkLog> workLogs = new ArrayList<>();

    /**
     * 作成日時
     */
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新日時
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
