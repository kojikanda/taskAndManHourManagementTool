package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.WorkLog;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
