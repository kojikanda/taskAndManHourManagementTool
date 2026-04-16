package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.HoursSummaryResponse;
import com.example.taskmanagement.dto.TaskRequest;
import com.example.taskmanagement.dto.TaskResponse;
import com.example.taskmanagement.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * タスクのコントローラークラス
 */
@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * タスク作成
     * 
     * @param request タスク作成リクエスト
     * @return 作成されたタスクのレスポンスDTO
     */
    @PostMapping("/tasks")
    public ResponseEntity<TaskResponse> createTask(@RequestBody TaskRequest request) {
        TaskResponse task = taskService.createTask(
                request.getProjectId(),
                request.getTitle(),
                request.getDescription(),
                request.getAssignedUserIds(),
                request.getStatus(),
                request.getPriority(),
                request.getDueDate(),
                request.getEstimatedHours());
        return ResponseEntity.ok(task);
    }

    /**
     * タスク更新
     * 
     * @param id      タスクID
     * @param request タスク更新リクエスト
     * @return 更新されたタスクのレスポンスDTO
     */
    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id, @RequestBody TaskRequest request) {
        TaskResponse task = taskService.updateTask(
                id,
                request.getTitle(),
                request.getDescription(),
                request.getStatus(),
                request.getPriority(),
                request.getDueDate(),
                request.getEstimatedHours());
        return ResponseEntity.ok(task);
    }

    /**
     * プロジェクトID指定によるタスク一覧取得
     * 
     * @param projectId プロジェクトID
     * @return タスクのレスポンスDTOのリスト
     */
    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProjectId(projectId));
    }

    /**
     * タスクID指定によるタスク取得
     * 
     * @param taskId タスクID
     * @return タスクレスポンスDTO
     */
    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTaskById(taskId));
    }

    /**
     * ユーザにアサインされたタスク一覧取得
     * 
     * @param userId ユーザID
     * @return タスクレスポンスDTOのリスト
     */
    @GetMapping("/tasks/assigned/{userId}")
    public ResponseEntity<List<TaskResponse>> getTasksByAssignedUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(taskService.getTasksByAssignedUserId(userId));
    }

    /**
     * タスクの時間集計（見積時間、実績時間、差分）を取得する
     * 
     * @param taskId タスクID
     * @return 時間集計レスポンスDTO
     */
    @GetMapping("/tasks/{taskId}/hours-summary")
    public ResponseEntity<HoursSummaryResponse> getHoursSummary(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getHoursSummary(taskId));
    }

    /**
     * タスクへのユーザアサイン
     *
     * @param taskId タスクID
     * @param userId ユーザID
     * @return 204(No Content)のレスポンス
     */
    @PostMapping("/tasks/{taskId}/assignments/{userId}")
    public ResponseEntity<Void> assignUser(@PathVariable Long taskId, @PathVariable Long userId) {
        taskService.assignUser(taskId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * タスクからユーザのアサイン解除
     * 
     * @param taskId タスクID
     * @param userId ユーザID
     * @return 204(No Content)のレスポンス
     */
    @DeleteMapping("/tasks/{taskId}/assignments/{userId}")
    public ResponseEntity<Void> unassignUser(@PathVariable Long taskId, @PathVariable Long userId) {
        taskService.unassignUser(taskId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * タスクのアサイン済みユーザID一覧取得
     * 
     * @param taskId タスクID
     * @return ユーザIDのリスト
     */
    @GetMapping("/tasks/{taskId}/assignments")
    public ResponseEntity<List<Long>> getAssignedUsers(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getAssignedUserIds(taskId));
    }

    /**
     * タスク削除
     * 
     * @param id タスクID
     * @return プロジェクトの見積・実績比較レスポンスDTO
     */
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
