package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.HoursSummaryResponse;
import com.example.taskmanagement.dto.TaskResponse;
import com.example.taskmanagement.entity.Project;
import com.example.taskmanagement.entity.Task;
import com.example.taskmanagement.entity.TaskAssignment;
import com.example.taskmanagement.entity.TaskPriority;
import com.example.taskmanagement.entity.TaskStatus;
import com.example.taskmanagement.entity.User;
import com.example.taskmanagement.repository.ProjectRepository;
import com.example.taskmanagement.repository.TaskAssignmentRepository;
import com.example.taskmanagement.repository.TaskRepository;
import com.example.taskmanagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * タスクのサービスクラス
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    /**
     * タスクリポジトリ
     */
    private final TaskRepository taskRepository;

    /**
     * プロジェクトリポジトリ
     */
    private final ProjectRepository projectRepository;

    /**
     * ユーザリポジトリ
     */
    private final UserRepository userRepository;

    /**
     * タスクアサインリポジトリ
     */
    private final TaskAssignmentRepository taskAssignmentRepository;

    /**
     * タスクを作成する
     * 
     * @param projectId       プロジェクトID
     * @param title           タスクタイトル
     * @param description     タスク説明
     * @param assignedUserIds アサインするユーザIDのリスト
     * @param status          ステータス
     * @param priority        優先度
     * @param dueDate         期限日
     * @param estimatedHours  見積時間
     * @return 作成されたタスクのレスポンスDTO
     */
    @Transactional
    public TaskResponse createTask(Long projectId, String title, String description, List<Long> assignedUserIds,
            TaskStatus status, TaskPriority priority, LocalDate dueDate, BigDecimal estimatedHours) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        Task task = new Task();
        task.setProject(project);
        task.setTitle(title);
        task.setDescription(description);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(dueDate);
        task.setEstimatedHours(estimatedHours);

        Task savedTask = taskRepository.save(task);

        // アサインユーザの登録
        if (assignedUserIds != null) {
            for (Long userId : assignedUserIds) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));
                TaskAssignment assignment = new TaskAssignment();
                assignment.setTask(savedTask);
                assignment.setUser(user);
                taskAssignmentRepository.save(assignment);
                savedTask.getTaskAssignments().add(assignment);
            }
        }

        return TaskResponse.from(savedTask);
    }

    /**
     * タスクを更新する
     * 
     * @param id             タスクID
     * @param title          タスクタイトル
     * @param description    タスクの説明
     * @param status         ステータス
     * @param priority       優先度
     * @param dueDate        期限日
     * @param estimatedHours 見積時間
     * @return 更新されたタスクのレスポンスDTO
     */
    @Transactional
    public TaskResponse updateTask(Long id, String title, String description,
            TaskStatus status, TaskPriority priority,
            LocalDate dueDate, BigDecimal estimatedHours) {
        Task task = findTaskById(id);

        task.setTitle(title);
        task.setDescription(description);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(dueDate);
        task.setEstimatedHours(estimatedHours);

        return TaskResponse.from(taskRepository.save(task));
    }

    /**
     * プロジェクトIDでタスクを取得する
     * 
     * @param projectId プロジェクトID
     * @return タスクのレスポンスDTOのリスト
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(TaskResponse::from)
                .toList();
    }

    /**
     * タスクIDで時間集計レスポンスDTOを取得する
     * 
     * @param taskId タスクID
     * @return 時間集計レスポンスDTO
     */
    @Transactional(readOnly = true)
    public HoursSummaryResponse getHoursSummary(Long taskId) {
        Task task = findTaskById(taskId);

        BigDecimal estimated = task.getEstimatedHours() != null
                ? task.getEstimatedHours()
                : BigDecimal.ZERO;
        BigDecimal actual = taskRepository.sumActualHoursByTaskId(taskId);
        BigDecimal diff = estimated.subtract(actual);

        return new HoursSummaryResponse(taskId, estimated, actual, diff);
    }

    /**
     * タスクIDでタスクを取得する
     * 
     * @param id タスクID
     * @return タスクエンティティ
     */
    private Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    /**
     * タスクにユーザをアサインする
     * 
     * @param taskId タスクID
     * @param userId ユーザID
     */
    @Transactional
    public void assignUser(Long taskId, Long userId) {
        // 重複チェック
        if (taskAssignmentRepository.existsByTaskIdAndUserId(taskId, userId)) {
            throw new RuntimeException("User already assigned: userId=" + userId);
        }

        Task task = findTaskById(taskId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        TaskAssignment assignment = new TaskAssignment();
        assignment.setTask(task);
        assignment.setUser(user);
        taskAssignmentRepository.save(assignment);
    }

    /**
     * タスクからユーザのアサインを解除する
     * 
     * @param taskId タスクID
     * @param userId ユーザID
     */
    @Transactional
    public void unassignUser(Long taskId, Long userId) {
        if (!taskAssignmentRepository.existsByTaskIdAndUserId(taskId, userId)) {
            throw new RuntimeException("Assignment not found: taskId=" + taskId + ", userId=" + userId);
        }
        taskAssignmentRepository.deleteByTaskIdAndUserId(taskId, userId);
    }

    /**
     * タスクにアサインされたユーザIDのリストを取得する
     *
     * @param taskId タスクID
     * @return ユーザIDのリスト
     */
    @Transactional(readOnly = true)
    public List<Long> getAssignedUserIds(Long taskId) {
        return taskAssignmentRepository.findByTaskId(taskId).stream()
                .map(a -> a.getUser().getId())
                .toList();
    }
}
