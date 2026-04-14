"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Project } from "@/types";

export type ProjectFilter = "assigned" | "owner" | "all";

/**
 * プロジェクト一覧取得カスタムフック
 */
export function useProjects(userId: number | null, filter: ProjectFilter) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プロジェクト一覧取得メソッド
  const fetchProjects = useCallback(async () => {
    if (userId === null) return;
    try {
      setLoading(true);
      const response = await api.get<Project[]>("/projects", {
        params: { filter, userId },
      });
      setProjects(response.data);
    } catch {
      setError("プロジェクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}
