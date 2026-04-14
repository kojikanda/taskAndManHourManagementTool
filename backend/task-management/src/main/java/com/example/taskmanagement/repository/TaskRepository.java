package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

/**
 * タスクのリポジトリインターフェース
 */
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * 指定したプロジェクトIDに紐付くタスク一覧を取得する
     * 
     * @param projectId プロジェクトID
     * @return タスクのリスト
     */
    List<Task> findByProjectId(Long projectId);

    /**
     * タスクIDに紐付く作業ログの工数合計を取得する<br>
     * 工数合計はwork_logsのhoursを集計して算出する。
     * 
     * @param taskId
     * @return 工数合計
     */
    @Query("SELECT COALESCE(SUM(w.hours), 0) FROM WorkLog w WHERE w.task.id = :taskId")
    BigDecimal sumActualHoursByTaskId(@Param("taskId") Long taskId);

    /**
     * 指定ユーザにアサインされたタスク一覧を取得する
     * 
     * @param userId ユーザID
     * @return タスクのリスト
     */
    @Query("SELECT t FROM Task t JOIN t.taskAssignments ta WHERE ta.user.id = :userId")
    List<Task> findByAssignedUserId(@Param("userId") Long userId);
}
