import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { DashboardKpi, DailyWorkHours, ProjectProgress, Task } from "@/types";

/**
 * KPIカード用データ取得用フック
 */
export function useDashboardKpi() {
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);

  // fetch実行メソッド
  // useEffectの依存配列にfetchメソッドを書いているので、このフックを使っているコンポーネントが再レンダリングされると
  // このメソッドも再定義され、またuseEffectが実行される。
  // そうすると、また再レンダリングが動作するので、fetchはuseCallbackを利用しないと、無限ループとなってしまう。
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardKpi>("/dashboard/kpi");
      setKpi(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  // fetch実行のuseEffect
  // ESLintのルールとして、useEffectの中で使用している値は、依存配列に全部書くルールがあるので、
  // 依存配列にfetchを書いている。
  useEffect(() => {
    fetch();
  }, [fetch]);
  return { kpi, loading, refetch: fetch };
}

/**
 * 直近の自担当タスクを取得するフック
 */
export function useRecentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Task[]>("/dashboard/recent-tasks")
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { tasks, loading };
}

/**
 * 直近の作業時間を取得するフック
 */
export function useWorkHoursHistory() {
  const [workHours, setWorkHours] = useState<DailyWorkHours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DailyWorkHours[]>("/dashboard/work-hours")
      .then((res) => setWorkHours(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { workHours, loading };
}

/**
 * プロジェクト進捗を取得するフック
 */
export function useProjectProgress() {
  const [progress, setProgress] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ProjectProgress[]>("/dashboard/project-progress")
      .then((res) => setProgress(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { progress, loading };
}
