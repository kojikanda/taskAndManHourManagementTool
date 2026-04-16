"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import AppLayout from "@/components/AppLayout";
import TaskListView from "@/components/TaskListView";
import EstimateActualView from "@/components/EstimateActualView";
import { useTasks } from "@/hooks/useTasks";

/**
 * タスク一覧画面ページ
 * @returns タスク一覧画面ページ
 */
export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { tasks, loading, refetch } = useTasks(projectId);
  const [tab, setTab] = useState(0); // 0: タスク一覧, 1: 見積・実績比較

  return (
    <AppLayout>
      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="タスク一覧" />
          <Tab label="見積・実績比較" />
        </Tabs>
      </Box>

      {/* タスク一覧タブ */}
      {tab === 0 && (
        <TaskListView
          title="タスク一覧"
          tasks={tasks}
          loading={loading}
          refetch={refetch}
          createProjectId={projectId}
        />
      )}
      {/* 見積・実績比較タブ */}
      {tab === 1 && <EstimateActualView projectId={projectId} />}
    </AppLayout>
  );
}
