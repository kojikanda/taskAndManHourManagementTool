"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Tooltip } from "@mui/material";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import AppLayout from "@/components/AppLayout";
import CreateWorkLogModal from "@/components/modals/CreateWorkLogModal";
import { useWorkLogs } from "@/hooks/useWorkLogs";
import api from "@/lib/api";
import { Task, TaskStatus, TaskPriority, UpdateTaskRequest } from "@/types";
import { useEffect } from "react";
import {
  STATUS_STYLE,
  PRIORITY_STYLE,
  getAvatarColor,
  formatDate,
} from "@/lib/taskStyles";
import { updateTaskField } from "@/lib/taskApi";

/**
 * タスク詳細画面コンポーネント
 * @returns タスク詳細画面コンポーネント
 */
export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // URLからタスクIDを取り出す
  const taskId = Number(params.taskId);

  // タスク詳細のローカルstate
  const [task, setTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);

  // ワークログ・工数集計
  const {
    workLogs,
    hoursSummary,
    loading: logsLoading,
    refetch: refetchLogs,
  } = useWorkLogs(taskId);

  // ワーク実績入力モーダルの表示状態
  const [workLogModalOpen, setWorkLogModalOpen] = useState(false);

  // ステータスのドロップダウン表示を行う対象の要素
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  // ステータスのドロップダウン表示が開いているか
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // 優先度のドロップダウン表示を行う対象の要素
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(
    null,
  );
  // 優先度のドロップダウン表示が開いているか
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  // タスク詳細取得
  useEffect(() => {
    api
      .get<Task>(`/tasks/${taskId}`)
      .then((res) => setTask(res.data))
      .catch(() =>
        enqueueSnackbar("タスクの取得に失敗しました", { variant: "error" }),
      )
      .finally(() => setTaskLoading(false));
  }, [taskId, enqueueSnackbar]);

  // ステータス・優先度のドロップダウンがクリックされたときのイベントハンドラ
  const handleTaskUpdate = async (
    updates: Partial<Pick<UpdateTaskRequest, "status" | "priority">>,
    closeMenu: () => void,
  ) => {
    if (!task) return;
    try {
      // Tasksテーブルを更新
      const updated = await updateTaskField(task, updates);
      if (updated !== null) {
        setTask(updated);
        enqueueSnackbar(
          updates.status !== undefined
            ? "ステータスを更新しました"
            : "優先度を更新しました",
          { variant: "success" },
        );
      }
    } catch {
      enqueueSnackbar("更新に失敗しました", { variant: "error" });
    } finally {
      closeMenu();
    }
  };

  // タスク取得中はローディング中表示を行う
  if (taskLoading) {
    return (
      <AppLayout>
        <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  // タスクが取れないときは「見つからない」の表示を行う
  if (!task) {
    return (
      <AppLayout>
        <Typography color="error">タスクが見つかりませんでした</Typography>
      </AppLayout>
    );
  }

  // 差分の表示色: 正 → 緑(見積内)、負 → 赤(見積を超過)
  const diffColor =
    hoursSummary?.diffHours == null
      ? "text.primary"
      : hoursSummary.diffHours < 0
        ? "error.main"
        : "success.main";

  return (
    <AppLayout>
      {/* 戻るボタン */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.back()}
        sx={{ mb: 2 }}
      >
        タスク一覧に戻る
      </Button>

      {/* タスク詳細カード */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          {/* タイトル + バッジ行 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", flexGrow: 1 }}>
              {task.title}
            </Typography>

            {/* ステータスバッジ */}
            <Chip
              label={task.status}
              sx={{
                ...STATUS_STYLE[task.status],
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={(e) => {
                setStatusAnchor(e.currentTarget);
                setStatusMenuOpen(true);
              }}
            />

            {/* 優先度バッジ */}
            <Chip
              label={task.priority}
              sx={{
                ...PRIORITY_STYLE[task.priority],
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={(e) => {
                setPriorityAnchor(e.currentTarget);
                setPriorityMenuOpen(true);
              }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 詳細情報グリッド */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {/* 説明 */}
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography variant="caption" color="text.secondary">
                説明
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
              >
                {task.description || "-"}
              </Typography>
            </Box>

            {/* 担当者 */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                担当者
              </Typography>
              <Box
                sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}
              >
                {task.assignedUsers.length === 0 ? (
                  <Typography variant="body2">-</Typography>
                ) : (
                  task.assignedUsers.map((u) => (
                    <Tooltip key={u.id} title={u.name}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: 11,
                            bgcolor: getAvatarColor(u.id),
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2">{u.name}</Typography>
                      </Box>
                    </Tooltip>
                  ))
                )}
              </Box>
            </Box>

            {/* 期限 */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                期限
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {formatDate(task.dueDate)}
              </Typography>
            </Box>

            {/* 見積時間 */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                見積時間
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {task.estimatedHours != null ? `${task.estimatedHours}h` : "-"}
              </Typography>
            </Box>

            {/* 実績時間 */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                実績時間
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {logsLoading ? "..." : `${hoursSummary?.actualHours ?? 0}h`}
              </Typography>
            </Box>

            {/* 差分（見積 - 実績） */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                差分（見積 ー 実績）
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 0.5, color: diffColor, fontWeight: 600 }}
              >
                {logsLoading
                  ? "..."
                  : hoursSummary?.diffHours == null
                    ? "-"
                    : `${hoursSummary.diffHours > 0 ? "+" : ""}${hoursSummary.diffHours}h`}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ワーク実績セクション */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          ワーク実績
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setWorkLogModalOpen(true)}
        >
          実績を登録
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell>作業日</TableCell>
              <TableCell>時間</TableCell>
              <TableCell>担当者</TableCell>
              <TableCell>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : workLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  ワークログがありません
                </TableCell>
              </TableRow>
            ) : (
              // バックエンドがDESC順で返してくるため、そのまま表示
              workLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(log.workDate)}
                  </TableCell>
                  <TableCell>{log.hours}h</TableCell>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>{log.memo || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ステータス変更ドロップダウン */}
      <Menu
        anchorEl={statusAnchor}
        open={statusMenuOpen}
        onClose={() => setStatusMenuOpen(false)}
        slotProps={{
          transition: { onExited: () => setStatusAnchor(null) },
        }}
      >
        {(["TODO", "DOING", "DONE"] as TaskStatus[]).map((s) => (
          <MenuItem
            key={s}
            onClick={() =>
              handleTaskUpdate({ status: s }, () => setStatusMenuOpen(false))
            }
          >
            <Chip
              label={s}
              size="small"
              sx={{ ...STATUS_STYLE[s], fontWeight: 600 }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* 優先度変更ドロップダウン */}
      <Menu
        anchorEl={priorityAnchor}
        open={priorityMenuOpen}
        onClose={() => setPriorityMenuOpen(false)}
        slotProps={{
          transition: { onExited: () => setPriorityAnchor(null) },
        }}
      >
        {(["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((p) => (
          <MenuItem
            key={p}
            onClick={() =>
              handleTaskUpdate({ priority: p }, () =>
                setPriorityMenuOpen(false),
              )
            }
          >
            <Chip
              label={p}
              size="small"
              sx={{ ...PRIORITY_STYLE[p], fontWeight: 600 }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* ワーク実績入力モーダル */}
      <CreateWorkLogModal
        open={workLogModalOpen}
        onClose={() => setWorkLogModalOpen(false)}
        onCreated={refetchLogs}
        taskId={taskId}
      />
    </AppLayout>
  );
}
