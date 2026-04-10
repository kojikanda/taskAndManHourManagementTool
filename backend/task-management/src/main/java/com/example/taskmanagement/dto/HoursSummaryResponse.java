package com.example.taskmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * 時間集計レスポンスDTO
 */
@Getter
@AllArgsConstructor
public class HoursSummaryResponse {

    /**
     * タスクID
     */
    private Long taskId;

    /**
     * 見積時間
     */
    private BigDecimal estimatedHours;

    /**
     * 実績時間
     */
    private BigDecimal actualHours;

    /**
     * 差分時間<br>
     * 見積 - 実績（マイナスなら超過）
     */
    private BigDecimal diffHours;
}
