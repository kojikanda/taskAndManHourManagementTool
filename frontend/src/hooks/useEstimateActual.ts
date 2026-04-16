import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { ProjectEstimateActual } from "@/types";

/**
 * プロジェクトの見積・実績比較データを取得するフック
 * @param projectId プロジェクトID
 * @returns プロジェクトの見積・実績比較データを取得するフック
 */
export function useEstimateActual(projectId: number) {
  const [data, setData] = useState<ProjectEstimateActual | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true); // useCallback の中なので直接 useEffect の本体ではない
    try {
      const res = await api.get<ProjectEstimateActual>(
        `/projects/${projectId}/estimate-actual`,
      );
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading };
}
