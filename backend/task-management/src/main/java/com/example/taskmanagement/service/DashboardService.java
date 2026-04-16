package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.*;
import com.example.taskmanagement.entity.TaskStatus;
import com.example.taskmanagement.repository.ProjectRepository;
import com.example.taskmanagement.repository.TaskRepository;
import com.example.taskmanagement.repository.WorkLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ダッシュボードのサービスクラス
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    /**
     * 自担当タスクの取得数
     */
    private static final int RECENT_TASKS_COUNT = 5;

    /**
     * 直近の作業時間の取得数
     */
    private static final int RECENT_WORK_HOUR_HISTORY_COUNT = 7;

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
     * KPIカード用のデータを取得する
     */
    @Transactional(readOnly = true)
    public DashboardKpiResponse getKpi(Long userId) {
        LocalDate today = LocalDate.now();

        // 未完了タスク数（TODOとDOING）
        long incompleteTaskCount = taskRepository.countByAssignedUserIdAndStatuses(userId,
                List.of(TaskStatus.TODO, TaskStatus.DOING));

        // 今日の作業時間
        BigDecimal todayWorkHours = workLogRepository.sumHoursByUserIdAndDate(userId, today);

        // 今月の作業時間
        BigDecimal monthlyWorkHours = workLogRepository.sumHoursByUserIdAndYearMonth(userId, today.getYear(),
                today.getMonthValue());

        // 遅延タスク数
        long overdueTaskCount = taskRepository.countOverdueByAssignedUserId(userId, today, TaskStatus.DONE);

        // 進行中プロジェクト数（自担当タスクが存在するプロジェクト）
        long activeProjectCount = projectRepository.findByAssignedUserId(userId).size();

        return new DashboardKpiResponse(incompleteTaskCount, todayWorkHours, monthlyWorkHours, overdueTaskCount,
                activeProjectCount);
    }

    /**
     * 自担当タスクを取得する<br>
     * 取得する件数はRECENT_TASKS_COUNTで指定する。<br>
     * 期限の昇順でソートする。
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getRecentTasks(Long userId) {
        return taskRepository
                .findRecentByAssignedUserIdOrderByDueDate(userId, TaskStatus.DONE,
                        PageRequest.of(0, RECENT_TASKS_COUNT))
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    /**
     * 直近の日毎の作業時間を取得する<br>
     * 取得する日数はRECENT_WORK_HOUR_HISTORY_COUNTで指定する。<br>
     * ワークログが存在しない日はhours=0で補完する。
     */
    @Transactional(readOnly = true)
    public List<DailyWorkHoursResponse> getWorkHoursHistory(Long userId) {
        LocalDate today = LocalDate.now();
        // 開始日時は(取得日数 - 1)の日付を指定し、取得日数分取るようにする
        LocalDate from = today.minusDays(RECENT_WORK_HOUR_HISTORY_COUNT - 1);

        // DBから実績がある日付のみ取得
        List<Object[]> rows = workLogRepository.sumHoursByUserIdGroupByDate(userId, from, today);
        Map<LocalDate, BigDecimal> hoursMap = rows.stream()
                .collect(Collectors.toMap(
                        r -> (LocalDate) r[0],
                        r -> (BigDecimal) r[1]));

        // 取得日数分の実績の中で実績がない日は0で補完
        List<DailyWorkHoursResponse> result = new ArrayList<>();
        for (int i = 0; i < RECENT_WORK_HOUR_HISTORY_COUNT; i++) {
            LocalDate date = from.plusDays(i);
            result.add(new DailyWorkHoursResponse(date, hoursMap.getOrDefault(date, BigDecimal.ZERO)));
        }
        return result;
    }

    /**
     * プロジェクト進捗（自担当タスクが存在するプロジェクト）を取得する
     */
    @Transactional(readOnly = true)
    public List<ProjectProgressResponse> getProjectProgress(Long userId) {
        return taskRepository.findProjectProgressByAssignedUserId(userId, TaskStatus.DONE).stream()
                .map(row -> {
                    Long projectId = (Long) row[0];
                    String projectName = (String) row[1];
                    long total = (long) row[2];
                    // SUM(CASE...) は Long で返る
                    long done = row[3] != null ? ((Number) row[3]).longValue() : 0L;
                    double rate = total == 0 ? 0.0 : (double) done / total;
                    return new ProjectProgressResponse(projectId, projectName, total, done, rate);
                })
                .toList();
    }
}
