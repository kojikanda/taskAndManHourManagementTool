package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.*;
import com.example.taskmanagement.security.UserPrincipal;
import com.example.taskmanagement.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * ダッシュボードのコントローラークラス
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    /**
     * ダッシュボードサービス
     */
    private final DashboardService dashboardService;

    /**
     * KPIカードデータ取得
     * 
     * @param principal Spring Securityのプリンシパル
     * @return ダッシュボードのKPIカード用レスポンスDTO
     */
    @GetMapping("/kpi")
    public ResponseEntity<DashboardKpiResponse> getKpi(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getKpi(principal.getUserId()));
    }

    /**
     * 直近の自担当タスク取得
     * 
     * @param principal Spring Securityのプリンシパル
     * @return タスクレスポンスDTOのリスト
     */
    @GetMapping("/recent-tasks")
    public ResponseEntity<List<TaskResponse>> getRecentTasks(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getRecentTasks(principal.getUserId()));
    }

    /**
     * 直近の作業時間履歴取得
     * 
     * @param principal Spring Securityのプリンシパル
     * @return 日ごとの作業時間レスポンスDTOのリスト
     */
    @GetMapping("/work-hours")
    public ResponseEntity<List<DailyWorkHoursResponse>> getWorkHours(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getWorkHoursHistory(principal.getUserId()));
    }

    /**
     * プロジェクト進捗取得
     * 
     * @param principal Spring Securityのプリンシパル
     * @return プロジェクト進捗レスポンスDTOのリスト
     */
    @GetMapping("/project-progress")
    public ResponseEntity<List<ProjectProgressResponse>> getProjectProgress(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getProjectProgress(principal.getUserId()));
    }
}
