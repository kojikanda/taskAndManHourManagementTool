"use client";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  Task,
  TaskStatus,
  TaskPriority,
  User,
  UpdateTaskRequest,
} from "@/types";
import {
  STATUS_STYLE,
  PRIORITY_STYLE,
  getAvatarColor,
  formatDate,
} from "@/lib/taskStyles";
import { updateTaskField } from "@/lib/taskApi";

// ソート対象のカラム
type SortField =
  | "title"
  | "projectName"
  | "assignedUsers"
  | "status"
  | "priority"
  | "dueDate"
  | "estimatedHours"
  | "updatedAt";

// ソートするカラムの名前
const SORT_LABELS: Record<SortField, string> = {
  title: "タスク名",
  projectName: "プロジェクト名",
  assignedUsers: "担当者",
  status: "ステータス",
  priority: "優先度",
  dueDate: "期限",
  estimatedHours: "見積時間",
  updatedAt: "更新日時",
};

// タスクの各項目の比較メソッド
// ソートで使用する
function compareTaskValues(a: Task, b: Task, field: SortField): number {
  switch (field) {
    case "title":
      return a.title.localeCompare(b.title, "ja");
    case "projectName":
      return a.projectName.localeCompare(b.projectName, "ja");
    case "assignedUsers": {
      const nameA = a.assignedUsers[0]?.name ?? "";
      const nameB = b.assignedUsers[0]?.name ?? "";
      return nameA.localeCompare(nameB, "ja");
    }
    case "status":
      return a.status.localeCompare(b.status);
    case "priority": {
      const order: Record<TaskPriority, number> = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2,
      };
      return order[a.priority] - order[b.priority];
    }
    case "dueDate": {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    case "estimatedHours":
      return (a.estimatedHours ?? 0) - (b.estimatedHours ?? 0);
    case "updatedAt":
      return a.updatedAt.localeCompare(b.updatedAt);
    default:
      return 0;
  }
}

// Props
type TaskListViewProps = {
  title: string;
  tasks: Task[];
  loading: boolean;
  refetch: () => void;
  createProjectId?: number; // 指定あり → タスク作成ボタンを表示
};

/**
 * タスク一覧ビューコンポーネント
 * @param title 画面タイトル
 * @param tasks タスク一覧
 * @param loading ローディング状態
 * @param refetch 再フェッチメソッド
 * @param createProjectId 表示対象のプロジェクトID。指定がない(undefined)のときはプロジェクトID指定なしで、タスク作成ボタンを表示しない。
 * @returns
 */
export default function TaskListView({
  title,
  tasks,
  loading,
  refetch,
  createProjectId,
}: TaskListViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // 全てのユーザ
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    api.get<User[]>("/users").then((res) => setAllUsers(res.data));
  }, []);

  // ソート対象のカラム
  const [sortField, setSortField] = useState<SortField>("dueDate");
  // ソート順(デフォルト: 昇順)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // フィルタリングで選択したユーザのID
  const [filterUserIds, setFilterUserIds] = useState<number[]>(
    user ? [user.userId] : [],
  );
  // フィルタリングで選択したステータス
  const [filterStatuses, setFilterStatuses] = useState<TaskStatus[]>([
    "TODO",
    "DOING",
  ]);
  // フィルタリングで選択した優先度
  const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([]);
  // フィルタリングで選択した開始日付
  const [filterDueDateFrom, setFilterDueDateFrom] = useState<Dayjs | null>(
    null,
  );
  // フィルタリングで選択した終了日付
  const [filterDueDateTo, setFilterDueDateTo] = useState<Dayjs | null>(null);

  // ステータスのバッジがクリックされたときのドロップダウン表示に使う情報
  const [statusMenu, setStatusMenu] = useState<{
    anchor: HTMLElement;
    taskId: number;
  } | null>(null);
  // ステータスのドロップダウン表示が開いているか
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // 優先度のバッジがクリックされたときのドロップダウン表示に使う情報
  const [priorityMenu, setPriorityMenu] = useState<{
    anchor: HTMLElement;
    taskId: number;
  } | null>(null);
  // 優先度のドロップダウン表示が開いているか
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  // タスク作成モーダルが表示しているか
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // タスク一覧に対して、フィルタリング＆ソートした結果をmemoで保持
  const filteredSortedTasks = useMemo(() => {
    const fromStr = filterDueDateFrom?.format("YYYY-MM-DD") ?? "";
    const toStr = filterDueDateTo?.format("YYYY-MM-DD") ?? "";

    const filtered = tasks.filter((task) => {
      if (
        filterUserIds.length > 0 &&
        !task.assignedUsers.some((u) => filterUserIds.includes(u.id))
      ) {
        return false;
      }
      if (filterStatuses.length > 0 && !filterStatuses.includes(task.status)) {
        return false;
      }
      if (
        filterPriorities.length > 0 &&
        !filterPriorities.includes(task.priority)
      ) {
        return false;
      }

      if (fromStr && task.dueDate && task.dueDate < fromStr) {
        return false;
      }
      if (toStr && task.dueDate && task.dueDate > toStr) {
        return false;
      }

      return true;
    });
    return [...filtered].sort((a, b) => {
      const cmp = compareTaskValues(a, b, sortField);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    tasks,
    filterUserIds,
    filterStatuses,
    filterPriorities,
    filterDueDateFrom,
    filterDueDateTo,
    sortField,
    sortDir,
  ]);

  // テーブルヘッダがクリックされたときのイベントハンドラ
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同じカラムがクリックされたときは、ソート順を変更
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // 初めてクリックされたときは、対象のカラムを設定し、ソート順は昇順に設定
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ステータス・優先度のドロップダウンがクリックされたときのイベントハンドラ
  const handleTaskUpdate = async (
    taskId: number,
    updates: Partial<Pick<UpdateTaskRequest, "status" | "priority">>, // ステータス・優先度のみが対象
    closeMenu: () => void,
  ) => {
    const task = tasks.find((t) => t.id === taskId)!;
    try {
      // Tasksテーブルを更新
      const updated = await updateTaskField(task, updates);
      if (updated !== null) {
        enqueueSnackbar(
          updates.status !== undefined
            ? "タスクのステータスを更新しました"
            : "タスクの優先度を更新しました",
          { variant: "success" },
        );
        await refetch();
      }
    } catch {
      enqueueSnackbar("更新に失敗しました", { variant: "error" });
    } finally {
      closeMenu();
    }
  };

  // クリアボタン押下時のイベントハンドラ
  const handleClearFilters = () => {
    setFilterUserIds([]);
    setFilterStatuses([]);
    setFilterPriorities([]);
    setFilterDueDateFrom(null);
    setFilterDueDateTo(null);
  };

  // フィルタリングを行っている対象
  const activeFilterChips: string[] = [];
  if (filterUserIds.length > 0) {
    const names = filterUserIds.map((id) =>
      id === user?.userId
        ? "自分"
        : (allUsers.find((u) => u.id === id)?.name ?? String(id)),
    );
    activeFilterChips.push(names.join(", "));
  }
  if (filterStatuses.length > 0)
    activeFilterChips.push(filterStatuses.join("/"));
  if (filterPriorities.length > 0)
    activeFilterChips.push(filterPriorities.join("/"));
  if (filterDueDateFrom || filterDueDateTo) {
    const from = filterDueDateFrom?.format("YYYY/MM/DD") ?? "";
    const to = filterDueDateTo?.format("YYYY/MM/DD") ?? "";
    activeFilterChips.push(`期限: ${from} 〜 ${to}`);
  }

  // テーブルヘッダのコンポーネント生成メソッド
  const renderHeaderCell = (field: SortField) => {
    const isActive = sortField === field;
    return (
      <TableCell
        key={field}
        onClick={() => handleSort(field)}
        sx={{
          cursor: "pointer",
          whiteSpace: "nowrap",
          userSelect: "none",
          fontWeight: isActive ? "bold" : "normal",
          color: isActive ? "primary.main" : "inherit",
        }}
      >
        {isActive
          ? `${SORT_LABELS[field]} ${sortDir === "asc" ? "↑" : "↓"}`
          : SORT_LABELS[field]}
      </TableCell>
    );
  };

  // 担当者の表示コンポーネント
  function AssignedUsersCell({
    users,
  }: {
    users: { id: number; name: string }[];
  }) {
    // 0人のときはハイフン表示
    if (users.length === 0) return <>-</>;
    // 1人のときは名前を表示
    if (users.length === 1) {
      return <Typography variant="body2">{users[0].name}</Typography>;
    }

    const MAX_VISIBLE = 3;
    const visibleUsers = users.slice(0, MAX_VISIBLE);
    const overflowCount = users.length - MAX_VISIBLE;

    // 2人以上はアバター表示
    // 4人以上は+Nの表示になる
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        {visibleUsers.map((u) => (
          <Tooltip key={u.id} title={u.name}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: 12,
                bgcolor: getAvatarColor(u.id),
              }}
            >
              <PersonIcon />
            </Avatar>
          </Tooltip>
        ))}
        {overflowCount > 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary", ml: 0.5 }}>
            +{overflowCount}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <>
      {/* ヘッダ */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>
        {createProjectId !== undefined && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            タスク作成
          </Button>
        )}
      </Box>

      {/* フィルタリング指定 */}
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "flex-end",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>担当者</InputLabel>
            <Select
              multiple
              value={filterUserIds}
              onChange={(e) => setFilterUserIds(e.target.value as number[])}
              input={<OutlinedInput label="担当者" />}
              renderValue={(selected) =>
                (selected as number[])
                  .map((id) =>
                    id === user?.userId
                      ? "自分"
                      : (allUsers.find((u) => u.id === id)?.name ?? ""),
                  )
                  .join(", ")
              }
            >
              {allUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  <Checkbox checked={filterUserIds.includes(u.id)} />
                  <ListItemText
                    primary={
                      u.id === user?.userId ? `${u.name}（自分）` : u.name
                    }
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              multiple
              value={filterStatuses}
              onChange={(e) =>
                setFilterStatuses(e.target.value as TaskStatus[])
              }
              input={<OutlinedInput label="ステータス" />}
              renderValue={(selected) => (selected as string[]).join(", ")}
            >
              {(["TODO", "DOING", "DONE"] as TaskStatus[]).map((s) => (
                <MenuItem key={s} value={s}>
                  <Checkbox checked={filterStatuses.includes(s)} />
                  <ListItemText primary={s} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>優先度</InputLabel>
            <Select
              multiple
              value={filterPriorities}
              onChange={(e) =>
                setFilterPriorities(e.target.value as TaskPriority[])
              }
              input={<OutlinedInput label="優先度" />}
              renderValue={(selected) => (selected as string[]).join(", ")}
            >
              {(["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((p) => (
                <MenuItem key={p} value={p}>
                  <Checkbox checked={filterPriorities.includes(p)} />
                  <ListItemText primary={p} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="期限 From"
            value={filterDueDateFrom}
            onChange={(newValue) => setFilterDueDateFrom(newValue)}
            format="YYYY/MM/DD"
            slotProps={{
              field: { clearable: true }, // × ボタンを表示
              textField: { size: "small" },
            }}
          />
          <DatePicker
            label="期限 To"
            value={filterDueDateTo}
            onChange={(newValue) => setFilterDueDateTo(newValue)}
            format="YYYY/MM/DD"
            slotProps={{
              field: { clearable: true },
              textField: { size: "small" },
            }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
          >
            クリア
          </Button>
        </Box>

        {activeFilterChips.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
            {activeFilterChips.map((label, i) => (
              <Chip
                key={i}
                label={label}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Paper>

      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                {(
                  [
                    "title",
                    "projectName",
                    "assignedUsers",
                    "status",
                    "priority",
                    "dueDate",
                    "estimatedHours",
                    "updatedAt",
                  ] as SortField[]
                ).map(renderHeaderCell)}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    タスクがありません
                  </TableCell>
                </TableRow>
              ) : (
                filteredSortedTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    // task.projectId を使うことで、どちらのページでも同じナビゲーションが使える
                    onClick={() =>
                      router.push(
                        `/projects/${task.projectId}/tasks/${task.id}`,
                      )
                    }
                  >
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.projectName}</TableCell>
                    <TableCell>
                      <AssignedUsersCell users={task.assignedUsers} />
                    </TableCell>
                    <TableCell
                      onClick={(e) => {
                        // バッジをクリックしたとき、タスク詳細画面に遷移しないように伝播を止める
                        e.stopPropagation();
                        setStatusMenu({
                          anchor: e.currentTarget,
                          taskId: task.id,
                        });
                        setStatusMenuOpen(true);
                      }}
                    >
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ...STATUS_STYLE[task.status],
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      />
                    </TableCell>
                    <TableCell
                      onClick={(e) => {
                        // バッジをクリックしたとき、タスク詳細画面に遷移しないように伝播を止める
                        e.stopPropagation();
                        setPriorityMenu({
                          anchor: e.currentTarget,
                          taskId: task.id,
                        });
                        setPriorityMenuOpen(true);
                      }}
                    >
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          ...PRIORITY_STYLE[task.priority],
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(task.dueDate)}
                    </TableCell>
                    <TableCell>
                      {task.estimatedHours != null
                        ? `${task.estimatedHours}h`
                        : "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(task.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ステータスのドロップダウン表示 */}
      <Menu
        // 表示位置をanchorで指定
        anchorEl={statusMenu?.anchor}
        open={statusMenuOpen}
        onClose={() => setStatusMenuOpen(false)}
        slotProps={{
          transition: {
            // アニメーション後にanchorをクリア
            onExited: () => setStatusMenu(null),
          },
        }}
      >
        {(["TODO", "DOING", "DONE"] as TaskStatus[]).map((s) => (
          <MenuItem
            key={s}
            onClick={() =>
              // DB更新を実行
              handleTaskUpdate(statusMenu!.taskId, { status: s }, () =>
                setStatusMenuOpen(false),
              )
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

      {/* 優先度のドロップダウン表示 */}
      <Menu
        // 表示位置をanchorで指定
        anchorEl={priorityMenu?.anchor}
        open={priorityMenuOpen}
        onClose={() => setPriorityMenuOpen(false)}
        slotProps={{
          transition: {
            // アニメーション後にanchorをクリア
            onExited: () => setPriorityMenu(null),
          },
        }}
      >
        {(["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((p) => (
          <MenuItem
            key={p}
            onClick={() =>
              // DB更新を実行
              handleTaskUpdate(priorityMenu!.taskId, { priority: p }, () =>
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

      {createProjectId !== undefined && (
        <CreateTaskModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={refetch}
          projectId={createProjectId}
        />
      )}
    </>
  );
}
