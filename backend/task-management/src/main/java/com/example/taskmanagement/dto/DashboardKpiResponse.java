package com.example.taskmanagement.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * ダッシュボードのKPIカード用レスポンスDTO
 */
@Getter
@AllArgsConstructor
public class DashboardKpiResponse {

    /**
     * 未完了タスク数（TODOとDOING）
     */
    private long incompleteTaskCount;

    /**
     * 今日の作業時間合計
     */
    private BigDecimal todayWorkHours;

    /**
     * 今月の作業時間合計
     */
    private BigDecimal monthlyWorkHours;

    /**
     * 遅延タスク数（期限切れ＆未完了）
     */
    private long overdueTaskCount;

    /**
     * 進行中プロジェクト数（自担当タスクが存在するプロジェクト）
     */
    private long activeProjectCount;
}
