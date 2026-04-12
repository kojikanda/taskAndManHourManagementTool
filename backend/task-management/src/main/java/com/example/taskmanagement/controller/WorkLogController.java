package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.WorkLogRequest;
import com.example.taskmanagement.dto.WorkLogResponse;
import com.example.taskmanagement.service.WorkLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ワークログのコントローラークラス
 */
@RestController
@RequiredArgsConstructor
public class WorkLogController {

    private final WorkLogService workLogService;

    /**
     * ワークログを作成する
     *
     * @param request ワークログ作成リクエスト
     * @return 作成されたワークログのレスポンスDTO
     */
    @PostMapping("/work-logs")
    public ResponseEntity<WorkLogResponse> createWorkLog(@RequestBody WorkLogRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        WorkLogResponse workLog = workLogService.createWorkLog(
                request.getTaskId(),
                userDetails.getUsername(),
                request.getWorkDate(),
                request.getHours(),
                request.getMemo());
        return ResponseEntity.ok(workLog);
    }

    /**
     * タスクに紐付いたワークログ一覧を取得する
     *
     * @param taskId タスクID
     * @return ワークログのレスポンスDTOのリスト
     */
    @GetMapping("/tasks/{taskId}/work-logs")
    public ResponseEntity<List<WorkLogResponse>> getWorkLogs(@PathVariable Long taskId) {
        return ResponseEntity.ok(workLogService.getWorkLogsByTaskId(taskId));
    }
}
