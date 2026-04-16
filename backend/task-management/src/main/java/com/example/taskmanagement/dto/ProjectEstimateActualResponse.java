package com.example.taskmanagement.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * プロジェクトの見積・実績比較レスポンスDTO
 */
@Getter
@AllArgsConstructor
public class ProjectEstimateActualResponse {

    /**
     * 見積合計
     */
    private BigDecimal estimatedTotal;

    /**
     * 実績合計
     */
    private BigDecimal actualTotal;

    /**
     * 差分（見積 - 実績）
     */
    private BigDecimal diff;

    /**
     * 実績割合(パーセンテージ)。見積が0の場合は0.0。
     */
    private double actualRate;

    /**
     * タスク別の見積・実績リスト
     */
    private List<TaskEstimateActualResponse> tasks;

    /**
     * 見積合計、実績合計、タスク別見積・実績レスポンスDTOから生成するファクトリメソッド
     * 
     * @param estimatedTotal 見積合計
     * @param actualTotal    実績合計
     * @param tasks          タスク別見積・実績レスポンスDTO
     * @return プロジェクトの見積・実績比較レスポンスDTO
     */
    public static ProjectEstimateActualResponse of(BigDecimal estimatedTotal, BigDecimal actualTotal,
            List<TaskEstimateActualResponse> tasks) {
        BigDecimal diff = estimatedTotal.subtract(actualTotal);
        double rate = estimatedTotal.compareTo(BigDecimal.ZERO) == 0
                ? 0.0
                : actualTotal.divide(estimatedTotal, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
        return new ProjectEstimateActualResponse(estimatedTotal, actualTotal, diff, rate, tasks);
    }
}
