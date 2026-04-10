package com.example.taskmanagement.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * ワークログ作成リクエストDTO
 */
@Getter
@Setter
public class WorkLogRequest {

    /**
     * タスクID
     */
    private Long taskId;

    /**
     * ユーザーID
     */
    private Long userId;

    /**
     * 作業日
     */
    private LocalDate workDate;

    /**
     * 作業時間
     */
    private BigDecimal hours;

    /**
     * メモ
     */
    private String memo;
}
