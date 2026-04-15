"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { WorkLog, HoursSummary } from "@/types";

/**
 * ワークログ取得カスタムフック
 * @param taskId 対象タスクのID
 */
export function useWorkLogs(taskId: number) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [hoursSummary, setHoursSummary] = useState<HoursSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkLogs = useCallback(async () => {
    try {
      setLoading(true);
      // 2つのAPIを並列で叩く（Promise.all）
      const [logsRes, summaryRes] = await Promise.all([
        api.get<WorkLog[]>(`/tasks/${taskId}/work-logs`),
        api.get<HoursSummary>(`/tasks/${taskId}/hours-summary`),
      ]);
      setWorkLogs(logsRes.data);
      setHoursSummary(summaryRes.data);
    } catch {
      // エラー処理
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  return { workLogs, hoursSummary, loading, refetch: fetchWorkLogs };
}
