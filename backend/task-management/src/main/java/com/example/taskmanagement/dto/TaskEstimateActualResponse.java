package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Task;
import com.example.taskmanagement.entity.TaskStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Getter;

/**
 * タスク別見積・実績レスポンスDTO
 */
@Getter
public class TaskEstimateActualResponse {

    /**
     * タスクID
     */
    private Long taskId;

    /**
     * タスク名
     */
    private String taskTitle;

    /**
     * 見積時間
     */
    private BigDecimal estimated;

    /**
     * 実績時間
     */
    private BigDecimal actual;

    /**
     * 差分（見積 - 実績）
     */
    private BigDecimal diff;

    /**
     * ステータス
     */
    private TaskStatus status;

    /**
     * 期限日
     */
    private LocalDate dueDate;

    public static TaskEstimateActualResponse of(Task task, BigDecimal actual) {
        TaskEstimateActualResponse dto = new TaskEstimateActualResponse();
        dto.taskId = task.getId();
        dto.taskTitle = task.getTitle();
        dto.estimated = task.getEstimatedHours() != null ? task.getEstimatedHours() : BigDecimal.ZERO;
        dto.actual = actual;
        dto.diff = dto.estimated.subtract(actual);
        dto.status = task.getStatus();
        dto.dueDate = task.getDueDate();
        return dto;
    }
}
