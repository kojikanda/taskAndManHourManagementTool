package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CreateProjectRequest;
import com.example.taskmanagement.dto.ProjectResponse;
import com.example.taskmanagement.entity.Project;
import com.example.taskmanagement.security.UserPrincipal;
import com.example.taskmanagement.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * プロジェクトのコントローラークラス
 */
@RestController
@RequiredArgsConstructor
public class ProjectController {

    /**
     * プロジェクトサービス
     */
    private final ProjectService projectService;

    /**
     * プロジェクト作成<br>
     * ownerId は JWT から取得するため、リクエストボディには含めない
     * 
     * @param request   プロジェクト作成リクエストDTO
     * @param principal Spring Securityのプリンシパル
     */
    @PostMapping("/projects")
    public ResponseEntity<ProjectResponse> createProject(
            @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse project = ProjectResponse
                .from(projectService.createProject(request.getName(), request.getDescription(), principal.getUserId()));
        return ResponseEntity.ok(project);
    }

    /**
     * プロジェクト一覧取得
     * filter=assigned : 自分がアサインされているタスクが存在するプロジェクト
     * filter=owner : 自分がオーナーのプロジェクト
     * filter=all : 全プロジェクト
     * 
     * @param filter フィルタ種別
     * @param userId ユーザID（filter=all 以外で必須）
     * @return プロジェクトレスポンスDTOのリスト
     */
    @GetMapping("/projects")
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @RequestParam String filter,
            @RequestParam(required = false) Long userId) {

        // フィルタ種別の内容によって、コールするサービスのメソッドを変える
        List<Project> projects = switch (filter) {
            case "assigned" -> projectService.getProjectsByAssignedUserId(userId);
            case "owner" -> projectService.getProjectsByOwnerId(userId);
            default -> projectService.getAllProjects();
        };

        return ResponseEntity.ok(projects.stream().map(ProjectResponse::from).toList());
    }
}
