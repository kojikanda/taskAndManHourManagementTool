package com.example.taskmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * プロジェクト進捗レスポンスDTO
 */
@Getter
@AllArgsConstructor
public class ProjectProgressResponse {

    /**
     * プロジェクトID
     */
    private Long projectId;

    /**
     * プロジェクト名
     */
    private String projectName;

    /**
     * プロジェクト内の全タスク数
     */
    private long totalTaskCount;

    /**
     * プロジェクト内のDONEタスク数
     */
    private long doneTaskCount;

    /**
     * 進捗率（0.0 〜 1.0）
     */
    private double progressRate;
}
