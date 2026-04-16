package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.ProjectEstimateActualResponse;
import com.example.taskmanagement.dto.TaskEstimateActualResponse;
import com.example.taskmanagement.entity.Project;
import com.example.taskmanagement.entity.Task;
import com.example.taskmanagement.entity.User;
import com.example.taskmanagement.repository.ProjectRepository;
import com.example.taskmanagement.repository.TaskRepository;
import com.example.taskmanagement.repository.UserRepository;
import com.example.taskmanagement.repository.WorkLogRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * プロジェクトのサービスクラス
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    /**
     * プロジェクトリポジトリ
     */
    private final ProjectRepository projectRepository;

    /**
     * タスクリポジトリ
     */
    private final TaskRepository taskRepository;

    /**
     * ワークログリポジトリ
     */
    private final WorkLogRepository workLogRepository;

    /**
     * ユーザリポジトリ
     */
    private final UserRepository userRepository;

    /**
     * プロジェクトを作成する
     * 
     * @param name        プロジェクト名
     * @param description 説明
     * @param ownerId     オーナーID
     * @return 作成されたプロジェクト
     */
    @Transactional
    public Project createProject(String name, String description, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + ownerId));

        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setOwner(owner);

        return projectRepository.save(project);
    }

    /**
     * オーナーIDでプロジェクトを取得する
     * 
     * @param ownerId オーナーID
     * @return プロジェクトのリスト
     */
    @Transactional(readOnly = true)
    public List<Project> getProjectsByOwnerId(Long ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    /**
     * IDでプロジェクトを取得する
     * 
     * @param id プロジェクトID
     * @return プロジェクト
     */
    @Transactional(readOnly = true)
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found: " + id));
    }

    /**
     * 全プロジェクトを取得する
     *
     * @return プロジェクトのリスト
     */
    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    /**
     * ユーザがアサインされているタスクが存在するプロジェクト一覧を取得する
     * 
     * @param userId ユーザID
     * @return プロジェクトのリスト
     */
    @Transactional(readOnly = true)
    public List<Project> getProjectsByAssignedUserId(Long userId) {
        return projectRepository.findByAssignedUserId(userId);
    }

    /**
     * プロジェクトの見積・実績比較データを取得する
     * 
     * @param projectId プロジェクトID
     * @return 見積・実績比較レスポンスDTO
     */
    @Transactional(readOnly = true)
    public ProjectEstimateActualResponse getEstimateActual(Long projectId) {
        // プロジェクト内の全タスクを取得
        List<Task> tasks = taskRepository.findByProjectId(projectId);

        // プロジェクト内の全タスクの実績時間をまとめて取得
        Map<Long, BigDecimal> actualHoursMap = workLogRepository
                .sumHoursGroupByTaskIdByProjectId(projectId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (BigDecimal) row[1]));

        // タスクごとにDTOへ変換
        // 実績が無いタスクはここで実績時間: 0で作成
        List<TaskEstimateActualResponse> taskDtos = tasks.stream()
                .map(task -> {
                    BigDecimal actual = actualHoursMap.getOrDefault(task.getId(), BigDecimal.ZERO);
                    return TaskEstimateActualResponse.of(task, actual);
                })
                .toList();

        // サマリの合計計算
        BigDecimal estimatedTotal = taskDtos.stream()
                .map(TaskEstimateActualResponse::getEstimated)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal actualTotal = taskDtos.stream()
                .map(TaskEstimateActualResponse::getActual)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ProjectEstimateActualResponse.of(estimatedTotal, actualTotal, taskDtos);
    }

    /**
     * プロジェクトを削除する（タスク・アサイン・ワークログもカスケード削除）
     * 
     * @param projectId プロジェクトID
     */
    @Transactional
    public void deleteProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new RuntimeException("Project not found: " + projectId);
        }
        projectRepository.deleteById(projectId);
    }
}
