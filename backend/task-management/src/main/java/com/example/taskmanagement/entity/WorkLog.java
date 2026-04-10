package com.example.taskmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ワークログエンティティクラス
 */
@Entity
@Table(name = "work_logs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class WorkLog {

    /**
     * ワークログID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ワークログが所属するタスク
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    /**
     * ワークログを記録したユーザ
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * ワーク日
     */
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    /**
     * 作業時間
     */
    @Column(nullable = false, precision = 5, scale = 1)
    private BigDecimal hours;

    /**
     * メモ
     */
    private String memo;

    /**
     * 作成日時
     */
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
