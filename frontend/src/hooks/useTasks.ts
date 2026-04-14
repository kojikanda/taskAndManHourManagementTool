"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Task } from "@/types";

/**
 * タスク一覧取得カスタムフック
 * @param projectId  プロジェクトIDで取得する場合に指定
 * @param assignedUserId アサインユーザIDで取得する場合に指定（自担当タスク用）
 */
export function useTasks(
  projectId: number | null,
  assignedUserId?: number | null,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // タスク一覧取得メソッド
  const fetchTasks = useCallback(async () => {
    if (projectId === null && !assignedUserId) return;
    try {
      setLoading(true);
      const url =
        projectId !== null
          ? `/projects/${projectId}/tasks`
          : `/tasks/assigned/${assignedUserId}`;
      const res = await api.get<Task[]>(url);
      setTasks(res.data);
    } catch {
      // エラー処理（必要に応じてトーストなどを追加）
    } finally {
      setLoading(false);
    }
  }, [projectId, assignedUserId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, refetch: fetchTasks };
}
