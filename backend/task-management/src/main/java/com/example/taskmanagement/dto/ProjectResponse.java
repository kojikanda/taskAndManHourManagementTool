package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Project;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * プロジェクトレスポンスDTO
 */
@Getter
public class ProjectResponse {

    /**
     * プロジェクトID
     */
    private final Long id;

    /**
     * プロジェクト名
     */
    private final String name;

    /**
     * プロジェクト詳細
     */
    private final String description;

    /**
     * オーナーID
     */
    private final Long ownerId;

    /**
     * 生成日時
     */
    private final LocalDateTime createdAt;

    /**
     * 更新日時
     */
    private final LocalDateTime updatedAt;

    /**
     * ProjectエンティティからプロジェクトレスポンスDTOを生成するコンストラクタ
     * 
     * @param project Projectエンティティ
     */
    private ProjectResponse(Project project) {
        this.id = project.getId();
        this.name = project.getName();
        this.description = project.getDescription();
        this.ownerId = project.getOwner().getId();
        this.createdAt = project.getCreatedAt();
        this.updatedAt = project.getUpdatedAt();
    }

    /**
     * ProjectエンティティからプロジェクトレスポンスDTOを生成するファクトリメソッド
     * 
     * @param project Projectエンティティ
     * @return プロジェクトレスポンスDTO
     */
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(project);
    }
}
