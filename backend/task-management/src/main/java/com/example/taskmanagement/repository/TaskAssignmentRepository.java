package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * タスクアサインのリポジトリインターフェース
 */
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    /**
     * タスクIDに紐付くタスクアサインのリストを取得する
     * 
     * @param taskId タスクID
     * @return タスクアサインのリスト
     */
    List<TaskAssignment> findByTaskId(Long taskId);

    /**
     * 指定したタスクIDとユーザーIDの組み合わせが存在するかをチェックする
     * 
     * @param taskId タスクID
     * @param userId ユーザーID
     * @return 存在する場合はtrue、そうでない場合はfalse
     */
    boolean existsByTaskIdAndUserId(Long taskId, Long userId);

    /**
     * 指定したタスクIDとユーザーIDの組み合わせに該当するタスクアサインを削除する
     * 
     * @param taskId タスクID
     * @param userId ユーザーID
     */
    @Transactional
    void deleteByTaskIdAndUserId(Long taskId, Long userId);
}
