package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.WorkLogResponse;
import com.example.taskmanagement.entity.Task;
import com.example.taskmanagement.entity.User;
import com.example.taskmanagement.entity.WorkLog;
import com.example.taskmanagement.repository.TaskRepository;
import com.example.taskmanagement.repository.UserRepository;
import com.example.taskmanagement.repository.WorkLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * ワークログのサービスクラス
 */
@Service
@RequiredArgsConstructor
public class WorkLogService {

        /**
         * ワークログリポジトリ
         */
        private final WorkLogRepository workLogRepository;

        /**
         * タスクリポジトリ
         */
        private final TaskRepository taskRepository;

        /**
         * ユーザリポジトリ
         */
        private final UserRepository userRepository;

        /**
         * ワークログを作成する
         * 
         * @param taskId   タスクID
         * @param workDate 作業日
         * @param hours    時間
         * @param memo     備考
         * @return 作成されたワークログのレスポンスDTO
         */
        @Transactional
        public WorkLogResponse createWorkLog(Long taskId, String email, LocalDate workDate, BigDecimal hours,
                        String memo) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found: " + email));

                WorkLog workLog = new WorkLog();
                workLog.setTask(task);
                workLog.setUser(user);
                workLog.setWorkDate(workDate);
                workLog.setHours(hours);
                workLog.setMemo(memo);

                return WorkLogResponse.from(workLogRepository.save(workLog));
        }

        /**
         * タスクIDでワークログを取得する
         * 
         * @param taskId タスクID
         * @return ワークログのレスポンスDTOのリスト
         */
        @Transactional(readOnly = true)
        public List<WorkLogResponse> getWorkLogsByTaskId(Long taskId) {
                return workLogRepository.findByTaskId(taskId).stream()
                                .map(WorkLogResponse::from)
                                .toList();
        }
}
