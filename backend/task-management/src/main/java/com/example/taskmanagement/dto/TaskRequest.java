package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.TaskPriority;
import com.example.taskmanagement.entity.TaskStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * タスク作成リクエストDTO
 */
@Getter
@Setter
public class TaskRequest {

    /**
     * プロジェクトID
     */
    private Long projectId;

    /**
     * タスク名
     */
    private String title;

    /**
     * 説明
     */
    private String description;

    /**
     * ステータス
     */
    private TaskStatus status;

    /**
     * 優先度
     */
    private TaskPriority priority;

    /**
     * 期限日
     */
    private LocalDate dueDate;

    /**
     * 見積時間
     */
    private BigDecimal estimatedHours;
}
