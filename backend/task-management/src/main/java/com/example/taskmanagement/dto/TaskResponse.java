package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Task;
import com.example.taskmanagement.entity.TaskPriority;
import com.example.taskmanagement.entity.TaskStatus;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * タスクレスポンスDTO
 */
@Getter
public class TaskResponse {

    /**
     * タスクID
     */
    private final Long id;

    /**
     * プロジェクトID
     */
    private final Long projectId;

    /**
     * タスク名
     */
    private final String title;

    /**
     * 説明
     */
    private final String description;

    /**
     * ステータス
     */
    private final TaskStatus status;

    /**
     * 優先度
     */
    private final TaskPriority priority;

    /**
     * 期限日
     */
    private final LocalDate dueDate;

    /**
     * 見積時間
     */
    private final BigDecimal estimatedHours;

    /**
     * 作成日時
     */
    private final LocalDateTime createdAt;

    /**
     * 更新日時
     */
    private final LocalDateTime updatedAt;

    /**
     * タスクエンティティからレスポンスDTOを作成するコンストラクタ
     * 
     * @param task タスクエンティティ
     */
    private TaskResponse(Task task) {
        this.id = task.getId();
        this.projectId = task.getProject().getId();
        this.title = task.getTitle();
        this.description = task.getDescription();
        this.status = task.getStatus();
        this.priority = task.getPriority();
        this.dueDate = task.getDueDate();
        this.estimatedHours = task.getEstimatedHours();
        this.createdAt = task.getCreatedAt();
        this.updatedAt = task.getUpdatedAt();
    }

    /**
     * タスクエンティティからレスポンスDTOを作成するファクトリメソッド
     * 
     * @param task タスクエンティティ
     * @return タスクレスポンスDTO
     */
    public static TaskResponse from(Task task) {
        return new TaskResponse(task);
    }
}
