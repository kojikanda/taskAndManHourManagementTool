"use client";

import AppLayout from "@/components/AppLayout";
import TaskListView from "@/components/TaskListView";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";

export default function MyTasksPage() {
  const { user } = useAuth();
  const { tasks, loading, refetch } = useTasks(null, user?.userId ?? null);

  return (
    <AppLayout>
      <TaskListView
        title="自担当タスク"
        tasks={tasks}
        loading={loading}
        refetch={refetch}
        // createProjectId を渡さない → タスク作成ボタンなし
        // lockSelfFilter指定で自担当タスクからの遷移であることを示す
        lockSelfFilter
      />
    </AppLayout>
  );
}
