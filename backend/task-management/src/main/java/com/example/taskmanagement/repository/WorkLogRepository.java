package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.WorkLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * ワークログのリポジトリインターフェース
 */
public interface WorkLogRepository extends JpaRepository<WorkLog, Long> {

    /**
     * タスクIDに紐付くワークログ一覧を取得する
     *
     * @param taskId タスクID
     * @return ワークログのリスト
     */
    List<WorkLog> findByTaskId(Long taskId);
}
