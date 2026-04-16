package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Task;
import com.example.taskmanagement.entity.TaskStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    /**
     * 指定ユーザにアサインされ、かつ指定のステータスに含まれるタスクの件数を取得
     * 
     * @param userId   ユーザID
     * @param statuses ステータスのリスト
     */
    @Query("""
            SELECT COUNT(DISTINCT t)
            FROM Task t JOIN t.taskAssignments ta
            WHERE ta.user.id = :userId AND t.status IN:statuses
            """)

    long countByAssignedUserIdAndStatuses(@Param("userId") Long userId, @Param("statuses") List<TaskStatus> statuses);

    /**
     * 指定ユーザにアサインされ、期限が指定日より前で、かつ指定されたステータスのタスクの件数
     * 
     * @param userId ユーザID
     * @param date   日付
     * @param status ステータス
     * @return
     */
    @Query("""
            SELECT COUNT(DISTINCT t)
            FROM Task t JOIN t.taskAssignments ta
            WHERE ta.user.id = :userId AND t.dueDate < :date AND t.status <> :status
            """)
    long countOverdueByAssignedUserId(@Param("userId") Long userId, @Param("date") LocalDate date,
            @Param("status") TaskStatus status);

    /**
     * 指定ユーザにアサインされたタスクを期限昇順で取得(ページング指定あり)<br>
     * ソートする際、期限がnullの場合、最後に配置する。
     * 
     * @param userId   ユーザID
     * @param status   ステータス
     * @param pageable Pageableパラメータ
     * @return Taskのリスト
     */
    @Query("""
            SELECT t
            FROM Task t JOIN t.taskAssignments ta
            WHERE ta.user.id = :userId AND t.status <> :status
            ORDER BY t.dueDate ASC NULLS LAST
            """)
    List<Task> findRecentByAssignedUserIdOrderByDueDate(@Param("userId") Long userId,
            @Param("status") TaskStatus status, org.springframework.data.domain.Pageable pageable);

    /**
     * プロジェクト内の全タスクを集計して進捗情報を取得<br>
     * 指定されたユーザがアサインされているプロジェクトのみが算出対象。<br>
     * 全てのタスク数と指定されたステータスと一致しているタスク数を算出する。
     * 
     * @param userId ユーザID(プロジェクトの絞り込みに使用)
     * @param status ステータス
     * @return [プロジェクトID, プロジェクト名, 全タスク数, ステータスが一致しているタスク数]のObject[]リスト
     */
    @Query("""
            SELECT t.project.id, t.project.name, COUNT(t),
                   SUM(CASE WHEN t.status = :status THEN 1 ELSE 0 END)
            FROM Task t
            WHERE t.project.id IN (
                SELECT DISTINCT t2.project.id
                FROM Task t2
                JOIN t2.taskAssignments ta
                WHERE ta.user.id = :userId
            )
            GROUP BY t.project.id, t.project.name
            """)
    List<Object[]> findProjectProgressByAssignedUserId(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status);

    /**
     * プロジェクトIDに紐付くタスクの見積時間合計と実績時間合計を取得する
     * 
     * @param projectId プロジェクトID
     * @return 見積時間合計と実績時間合計
     */
    @Query("""
            SELECT COALESCE(SUM(t.estimatedHours), 0),
                   COALESCE(SUM((SELECT COALESCE(SUM(w.hours), 0) FROM WorkLog w WHERE w.task = t)), 0)
            FROM Task t
            WHERE t.project.id = :projectId
            """)
    Object[] findEstimateActualSummaryByProjectId(@Param("projectId") Long projectId);
}
