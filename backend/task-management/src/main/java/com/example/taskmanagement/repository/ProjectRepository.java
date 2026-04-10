package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * プロジェクトのリポジトリインターフェース
 */
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * 指定したオーナーIDに紐付くプロジェクト一覧を取得する
     * 
     * @param ownerId オーナーID
     * @return プロジェクトのリスト
     */
    List<Project> findByOwnerId(Long ownerId);
}
