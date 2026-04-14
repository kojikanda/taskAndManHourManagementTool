package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /**
     * 指定ユーザにアサインされているタスクが存在するプロジェクト一覧を取得する
     * 
     * @param userId ユーザID
     * @return プロジェクトのリスト
     */
    @Query("SELECT DISTINCT p FROM Project p JOIN p.tasks t JOIN t.taskAssignments ta WHERE ta.user.id = :userId")
    List<Project> findByAssignedUserId(@Param("userId") Long userId);
}
