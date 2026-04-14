package com.example.taskmanagement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * プロジェクト作成リクエストDTO
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateProjectRequest {
    /**
     * プロジェクト名
     */
    private String name;

    /**
     * プロジェクト詳細
     */
    private String description;
}
