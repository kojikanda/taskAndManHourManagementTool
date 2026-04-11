package com.example.taskmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * タスクエンティティクラス
 */
@Entity
@Table(name = "tasks")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class Task {

    /**
     * タスクID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * タスクが所属するプロジェクト
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /**
     * タスクタイトル
     */
    @Column(nullable = false)
    private String title;

    /**
     * タスクの説明
     */
    private String description;

    /**
     * タスクの状態
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    /**
     * タスクの優先度
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority = TaskPriority.MEDIUM;

    /**
     * 期限日
     */
    @Column(name = "due_date")
    private LocalDate dueDate;

    /**
     * 予想工数
     */
    @Column(name = "estimated_hours", precision = 5, scale = 1)
    private BigDecimal estimatedHours;

    /**
     * タスクにアサインされたユーザのリスト
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskAssignment> taskAssignments = new ArrayList<>();

    /**
     * タスクに紐付いたワークログのリスト
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
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
