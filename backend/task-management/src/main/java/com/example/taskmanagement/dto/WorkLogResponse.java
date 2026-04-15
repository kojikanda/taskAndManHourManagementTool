package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.WorkLog;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ワークログレスポンスDTO
 */
@Getter
public class WorkLogResponse {

    /**
     * ワークログID
     */
    private final Long id;

    /**
     * タスクID
     */
    private final Long taskId;

    /**
     * ユーザーID
     */
    private final Long userId;

    /**
     * ユーザー名
     */
    private final String userName;

    /**
     * ワーク日付
     */
    private final LocalDate workDate;

    /**
     * 時間
     */
    private final BigDecimal hours;

    /**
     * メモ
     */
    private final String memo;

    /**
     * 作成日時
     */
    private final LocalDateTime createdAt;

    /**
     * ワークログエンティティからレスポンスDTOを作成するコンストラクタ
     * 
     * @param workLog ワークログエンティティ
     */
    private WorkLogResponse(WorkLog workLog) {
        this.id = workLog.getId();
        this.taskId = workLog.getTask().getId();
        this.userId = workLog.getUser().getId();
        this.userName = workLog.getUser().getName();
        this.workDate = workLog.getWorkDate();
        this.hours = workLog.getHours();
        this.memo = workLog.getMemo();
        this.createdAt = workLog.getCreatedAt();
    }

    /**
     * ワークログエンティティからレスポンスDTOを作成するファクトリメソッド
     * 
     * @param workLog ワークログエンティティ
     * @return ワークログレスポンスDTO
     */
    public static WorkLogResponse from(WorkLog workLog) {
        return new WorkLogResponse(workLog);
    }
}
