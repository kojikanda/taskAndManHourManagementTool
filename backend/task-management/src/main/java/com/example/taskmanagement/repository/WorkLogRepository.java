package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.WorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * ワークログのリポジトリインターフェース
 */
public interface WorkLogRepository extends JpaRepository<WorkLog, Long> {

    /**
     * タスクIDに紐付くワークログ一覧を作業日の降順で取得する
     * 
     * @param taskId タスクID
     * @return ワークログのリスト（作業日降順）
     */
    List<WorkLog> findByTaskIdOrderByWorkDateDesc(Long taskId);

    /**
     * ユーザIDと作業日指定でワークログを集計する
     * 
     * @param userId ユーザID
     * @param date   作業日
     * @return 集計した作業時間
     */
    @Query("SELECT COALESCE(SUM(w.hours), 0) FROM WorkLog w WHERE w.user.id = :userId AND w.workDate = :date")
    BigDecimal sumHoursByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    /**
     * ユーザIDと年月指定でワークログを集計する
     * 
     * @param userId ユーザID
     * @param year   年
     * @param month  月
     * @return 集計した作業時間
     */
    @Query("""
            SELECT COALESCE(SUM(w.hours), 0)
            FROM WorkLog w
            WHERE w.user.id = :userId AND YEAR(w.workDate) = :year AND MONTH(w.workDate) = :month
            """)
    BigDecimal sumHoursByUserIdAndYearMonth(@Param("userId") Long userId, @Param("year") int year,
            @Param("month") int month);

    /**
     * ユーザIDと期間でワークログを日ごとに集計する
     * 
     * @param userId ユーザID
     * @param from   開始日付
     * @param to     終了日付
     * @return 集計した作業時間([日付, 集計した時間]のリスト)
     */
    @Query("""
            SELECT w.workDate, SUM(w.hours)
            FROM WorkLog w
            WHERE w.user.id = :userId AND w.workDate >= :from AND w.workDate<=:to
            GROUP BY w.workDate
            ORDER BY w.workDate ASC
            """)
    List<Object[]> sumHoursByUserIdGroupByDate(@Param("userId") Long userId, @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * プロジェクトIDに紐付く全タスクの実績時間をタスクIDごとに集計する
     * 
     * @param projectId プロジェクトID
     * @return [taskId, sumHours] の Object[] のリスト
     */
    @Query("""
            SELECT w.task.id, COALESCE(SUM(w.hours), 0)
            FROM WorkLog w
            WHERE w.task.project.id = :projectId
            GROUP BY w.task.id
            """)
    List<Object[]> sumHoursGroupByTaskIdByProjectId(@Param("projectId") Long projectId);
}
