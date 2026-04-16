package com.example.taskmanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 日ごとの作業時間レスポンスDTO
 */
@Getter
@AllArgsConstructor
public class DailyWorkHoursResponse {

    /**
     * 作業日
     */
    private LocalDate date;

    /**
     * 作業時間合計
     */
    private BigDecimal hours;
}
