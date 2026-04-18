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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Card,
  CardActionArea,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import { Avatar, Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { loadSavedState } from "@/lib/commonApi";

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
  lockSelfFilter?: boolean;
};

/**
 * タスク一覧ビューコンポーネント
 * @param title 画面タイトル
 * @param tasks タスク一覧
 * @param loading ローディング状態
 * @param refetch 再フェッチメソッド
 * @param createProjectId 表示対象のプロジェクトID。指定がない(undefined)のときはプロジェクトID指定なしで、タスク作成ボタンを表示しない。
 * @returns タスク一覧ビューコンポーネント
 */
export default function TaskListView({
  title,
  tasks,
  loading,
  refetch,
  createProjectId,
  lockSelfFilter = false,
}: TaskListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const storageKey = `taskListState:${pathname}`;
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // モバイル判定
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 初期表示かどうかをクエリで判断する
  const searchParams = useSearchParams();
  const isFresh = searchParams.get("fresh") === "1";

  // 全てのユーザ
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    api.get<User[]>("/users").then((res) => setAllUsers(res.data));
  }, []);

  /*
   * 以下、ソート・フィルタリングの情報は、初期表示以外では、
   * コンポーネントマウント時に1度だけsessionStorageから情報を読み込むようにする。
   */
  // ソート対象のカラム
  const [sortField, setSortField] = useState<SortField>(() =>
    isFresh ? "dueDate" : (loadSavedState(storageKey)?.sortField ?? "dueDate"),
  );
  // ソート順(デフォルト: 昇順)
  const [sortDir, setSortDir] = useState<"asc" | "desc">(() =>
    isFresh ? "asc" : (loadSavedState(storageKey)?.sortDir ?? "asc"),
  );

  // フィルタリングで選択したユーザのID
  const [filterUserIds, setFilterUserIds] = useState<number[]>(() => {
    if (isFresh) return user ? [user.userId] : [];
    const saved = loadSavedState(storageKey)?.filterUserIds;
    const base = saved ?? (user ? [user.userId] : []);
    if (lockSelfFilter && user && !base.includes(user.userId)) {
      return [...base, user.userId];
    }
    return base;
  });
  // フィルタリングで選択したステータス
  const [filterStatuses, setFilterStatuses] = useState<TaskStatus[]>(() =>
    isFresh
      ? ["TODO", "DOING"]
      : (loadSavedState(storageKey)?.filterStatuses ?? ["TODO", "DOING"]),
  );
  // フィルタリングで選択した優先度
  const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>(
    () => (isFresh ? [] : (loadSavedState(storageKey)?.filterPriorities ?? [])),
  );
  // フィルタリングで選択した開始日付
  const [filterDueDateFrom, setFilterDueDateFrom] = useState<Dayjs | null>(
    () => {
      if (isFresh) return null;
      const saved = loadSavedState(storageKey)?.filterDueDateFrom;
      return saved ? dayjs(saved) : null;
    },
  );
  // フィルタリングで選択した終了日付
  const [filterDueDateTo, setFilterDueDateTo] = useState<Dayjs | null>(() => {
    if (isFresh) return null;
    const saved = loadSavedState(storageKey)?.filterDueDateTo;
    return saved ? dayjs(saved) : null;
  });

  // fresh=1のとき、sessionStorageをクリアし、URLから「fresh=1」のクエリを除去
  useEffect(() => {
    if (isFresh) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルタ・ソート状態が変わるたびに sessionStorage に保存
  useEffect(() => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          sortField,
          sortDir,
          filterUserIds,
          filterStatuses,
          filterPriorities,
          filterDueDateFrom: filterDueDateFrom?.format("YYYY-MM-DD") ?? null,
          filterDueDateTo: filterDueDateTo?.format("YYYY-MM-DD") ?? null,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    storageKey,
    sortField,
    sortDir,
    filterUserIds,
    filterStatuses,
    filterPriorities,
    filterDueDateFrom,
    filterDueDateTo,
  ]);

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

  // ︙メニューの表示状態
  const [actionMenu, setActionMenu] = useState<{
    anchor: HTMLElement;
    taskId: number;
  } | null>(null);
  // ︙メニューが開いているか
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  // 削除対象のタスクID
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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
      }
    } catch {
      enqueueSnackbar("更新に失敗しました", { variant: "error" });
    } finally {
      closeMenu();
      await refetch();
    }
  };

  // クリアボタン押下時のイベントハンドラ
  const handleClearFilters = () => {
    // 自タスク一覧から遷移したときは、フィルタ条件に自分を残す。それ以外はクリア。
    setFilterUserIds(lockSelfFilter && user ? [user.userId] : []);
    setFilterStatuses([]);
    setFilterPriorities([]);
    setFilterDueDateFrom(null);
    setFilterDueDateTo(null);
  };

  // 削除確認ダイアログで削除ボタンが押下されたときのイベントハンドラ
  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return;
    try {
      await api.delete(`/tasks/${deleteTargetId}`);
      enqueueSnackbar("タスクを削除しました", { variant: "success" });
      await refetch();
    } catch {
      enqueueSnackbar("削除に失敗しました", { variant: "error" });
    } finally {
      setDeleteTargetId(null);
    }
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
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
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
              onChange={(e) => {
                const newIds = e.target.value as number[];
                // lockSelfFilter のとき、自分の除外を無視する
                if (lockSelfFilter && user && !newIds.includes(user.userId))
                  return;
                setFilterUserIds(newIds);
              }}
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
              disabled={lockSelfFilter}
            >
              {allUsers.map((u) => {
                const isLockedSelf = lockSelfFilter && u.id === user?.userId;
                return (
                  <MenuItem key={u.id} value={u.id} disabled={isLockedSelf}>
                    <Checkbox
                      checked={filterUserIds.includes(u.id)}
                      disabled={isLockedSelf}
                    />
                    <ListItemText
                      primary={
                        u.id === user?.userId ? `${u.name}（自分）` : u.name
                      }
                    />
                  </MenuItem>
                );
              })}
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
      ) : isMobile ? (
        // モバイル: カード表示
        <>
          {/* ソートコントロール */}
          <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>ソート</InputLabel>
              <Select
                value={sortField}
                label="ソート"
                onChange={(e) => setSortField(e.target.value as SortField)}
              >
                {(Object.keys(SORT_LABELS) as SortField[]).map((f) => (
                  <MenuItem key={f} value={f}>
                    {SORT_LABELS[f]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {sortDir === "asc" ? "↑ 昇順" : "↓ 降順"}
            </Button>
          </Box>

          {/* カード一覧 */}
          {filteredSortedTasks.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 6, textAlign: "center" }}
            >
              タスクがありません
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {filteredSortedTasks.map((task) => (
                <Card
                  key={task.id}
                  variant="outlined"
                  sx={{ borderRadius: 2, position: "relative" }}
                >
                  {/* ⋮ ボタンをCardActionArea の外に出してabsolute配置 */}
                  {/* ⋮ ボタンをクリックしたとき、CardActionAreaにイベントが伝播して、リップル効果が二重に出ないようにするため、外に出している */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenu({
                        anchor: e.currentTarget,
                        taskId: task.id,
                      });
                      setActionMenuOpen(true);
                    }}
                    sx={{ position: "absolute", top: 4, right: 4, zIndex: 1 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>

                  <CardActionArea
                    onClick={() =>
                      router.push(
                        `/projects/${task.projectId}/tasks/${task.id}`,
                      )
                    }
                    sx={{ p: 2 }}
                  >
                    {/* タスク名（右の⋮ボタンと被らないよう pr: 4） */}
                    <Typography variant="body2" sx={{ fontWeight: 600, pr: 4 }}>
                      {task.title}
                    </Typography>

                    {/* プロジェクト名 */}
                    <Typography variant="caption" color="text.secondary">
                      {task.projectName}
                    </Typography>

                    {/* ステータス・優先度・期限 */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        mt: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusMenu({
                            anchor: e.currentTarget,
                            taskId: task.id,
                          });
                          setStatusMenuOpen(true);
                        }}
                      />
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          ...PRIORITY_STYLE[task.priority],
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriorityMenu({
                            anchor: e.currentTarget,
                            taskId: task.id,
                          });
                          setPriorityMenuOpen(true);
                        }}
                      />
                      {task.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          期限: {formatDate(task.dueDate)}
                        </Typography>
                      )}
                    </Box>

                    {/* 担当者 */}
                    {task.assignedUsers.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <AssignedUsersCell users={task.assignedUsers} />
                      </Box>
                    )}
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </>
      ) : (
        // モバイル以外: テーブル表示
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
                {/* ⋮ メニュー用 */}
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
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
                    <TableCell
                      onClick={(e) => e.stopPropagation()} // 行クリックを伝播させない
                      sx={{ p: 0.5 }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setActionMenu({
                            anchor: e.currentTarget,
                            taskId: task.id,
                          });
                          setActionMenuOpen(true);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
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

      {/* ⋮ メニュー */}
      <Menu
        anchorEl={actionMenu?.anchor}
        open={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        slotProps={{ transition: { onExited: () => setActionMenu(null) } }}
      >
        <MenuItem
          onClick={() => {
            setDeleteTargetId(actionMenu!.taskId);
            setActionMenuOpen(false);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>

      {createProjectId !== undefined && (
        <CreateTaskModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={refetch}
          projectId={createProjectId}
        />
      )}

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
      >
        <DialogTitle>タスクの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このタスクを削除しますか？
            <br />
            関連するワーク実績もすべて削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTargetId(null)}>キャンセル</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
