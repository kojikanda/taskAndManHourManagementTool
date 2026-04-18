"use client";

import {
  Box,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  InputLabel,
  Button,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { BarChart } from "@mui/x-charts/BarChart";
import { Dayjs } from "dayjs";
import { useState, useMemo } from "react";
import { STATUS_STYLE, formatDate } from "@/lib/taskStyles";
import { useEstimateActual } from "@/hooks/useEstimateActual";

// タスク別実績のソートフィールド
type TaskSortField =
  | "taskTitle"
  | "estimated"
  | "actual"
  | "diff"
  | "status"
  | "dueDate";

// タスク別実績のラベル
const TASK_LABELS: Record<TaskSortField, string> = {
  taskTitle: "タスク名",
  estimated: "見積",
  actual: "実績",
  diff: "見積 - 実績",
  status: "ステータス",
  dueDate: "期限",
};

// 差分の色（0以上: 緑、マイナス: 赤）
const diffColor = (diff: number) => (diff >= 0 ? "#2e7d32" : "#c62828");

// Props
type Props = {
  projectId: number;
};

/**
 * 見積・実績比較画面コンポーネント
 * @param projectId プロジェクトID
 * @returns 見積・実績比較画面コンポーネント
 */
export default function EstimateActualView({ projectId }: Props) {
  // 表示データ取得フック
  const { data, loading } = useEstimateActual(projectId);

  // モバイル判定
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // タスク別テーブルのソート
  const [taskSortField, setTaskSortField] = useState<TaskSortField>("dueDate");
  const [taskSortDir, setTaskSortDir] = useState<"asc" | "desc">("asc");

  // 期限フィルタ
  const [dueDateFrom, setDueDateFrom] = useState<Dayjs | null>(null);
  const [dueDateTo, setDueDateTo] = useState<Dayjs | null>(null);

  // ソートハンドラ生成
  const makeHandleSort =
    <T extends string>(
      field: T,
      currentField: T,
      setField: (f: T) => void,
      currentDir: "asc" | "desc",
      setDir: (d: "asc" | "desc") => void,
    ) =>
    () => {
      if (currentField === field) {
        setDir(currentDir === "asc" ? "desc" : "asc");
      } else {
        setField(field);
        setDir("asc");
      }
    };

  // ヘッダセル生成
  const renderSortHeader = <T extends string>(
    field: T,
    label: string,
    currentField: T,
    currentDir: "asc" | "desc",
    onClick: () => void,
    align?: "left" | "right",
  ) => {
    const isActive = currentField === field;
    return (
      <TableCell
        key={field}
        align={align ?? "left"}
        onClick={onClick}
        sx={{
          cursor: "pointer",
          userSelect: "none",
          whiteSpace: "nowrap",
          fontWeight: isActive ? "bold" : "normal",
          color: isActive ? "primary.main" : "inherit",
        }}
      >
        {isActive ? `${label} ${currentDir === "asc" ? "↑" : "↓"}` : label}
      </TableCell>
    );
  };

  // 期限フィルタを適用したタスク一覧
  const filteredTasks = useMemo(() => {
    if (!data) return [];
    const fromStr = dueDateFrom?.format("YYYY-MM-DD") ?? "";
    const toStr = dueDateTo?.format("YYYY-MM-DD") ?? "";
    return data.tasks.filter((t) => {
      if (fromStr && (!t.dueDate || t.dueDate < fromStr)) return false;
      if (toStr && (!t.dueDate || t.dueDate > toStr)) return false;
      return true;
    });
  }, [data, dueDateFrom, dueDateTo]);

  // タスク別テーブルのソート済みリスト
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let cmp = 0;
      switch (taskSortField) {
        case "taskTitle":
          cmp = a.taskTitle.localeCompare(b.taskTitle, "ja");
          break;
        case "estimated":
          cmp = a.estimated - b.estimated;
          break;
        case "actual":
          cmp = a.actual - b.actual;
          break;
        case "diff":
          cmp = a.diff - b.diff;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "dueDate": {
          if (!a.dueDate && !b.dueDate) {
            cmp = 0;
            break;
          }
          if (!a.dueDate) {
            cmp = 1;
            break;
          }
          if (!b.dueDate) {
            cmp = -1;
            break;
          }
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        }
      }
      return taskSortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredTasks, taskSortField, taskSortDir]);

  if (loading) {
    return (
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
    );
  }
  if (!data) return null;

  return (
    <Box>
      {/* サマリ */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
        サマリ
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell align="right">見積合計</TableCell>
              <TableCell align="right">実績合計</TableCell>
              <TableCell align="right">見積 - 実績</TableCell>
              <TableCell align="right">実績割合</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="right">{data.estimatedTotal}h</TableCell>
              <TableCell align="right">{data.actualTotal}h</TableCell>
              <TableCell
                align="right"
                sx={{ color: diffColor(data.diff), fontWeight: "bold" }}
              >
                {data.diff > 0 ? "+" : ""}
                {data.diff}h
              </TableCell>
              <TableCell align="right">{data.actualRate.toFixed(1)}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* タスク別実績 */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
        タスク別実績
      </Typography>

      {/* 期限フィルタ */}
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <DatePicker
            label="期限 From"
            value={dueDateFrom}
            onChange={setDueDateFrom}
            format="YYYY/MM/DD"
            slotProps={{
              field: { clearable: true },
              textField: { size: "small" },
            }}
          />
          <DatePicker
            label="期限 To"
            value={dueDateTo}
            onChange={setDueDateTo}
            format="YYYY/MM/DD"
            slotProps={{
              field: { clearable: true },
              textField: { size: "small" },
            }}
          />
        </Box>
      </Paper>

      {isMobile ? (
        // モバイル: カード表示
        <>
          {/* ソートコントロール */}
          <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>並び替え</InputLabel>
              <Select
                value={taskSortField}
                label="並び替え"
                onChange={(e) =>
                  setTaskSortField(e.target.value as TaskSortField)
                }
              >
                {(Object.keys(TASK_LABELS) as TaskSortField[]).map((f) => (
                  <MenuItem key={f} value={f}>
                    {TASK_LABELS[f]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                setTaskSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {taskSortDir === "asc" ? "↑ 昇順" : "↓ 降順"}
            </Button>
          </Box>

          {/* カード一覧 */}
          {sortedTasks.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              タスクがありません
            </Typography>
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}
            >
              {sortedTasks.map((task) => (
                <Paper
                  key={task.taskId}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {task.taskTitle}
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                  >
                    {[
                      {
                        label: "見積",
                        value: `${task.estimated}h`,
                        color: "inherit",
                      },
                      {
                        label: "実績",
                        value: `${task.actual}h`,
                        color: "inherit",
                      },
                      {
                        label: "見積 - 実績",
                        value: `${task.diff > 0 ? "+" : ""}${task.diff}h`,
                        color: diffColor(task.diff),
                      },
                    ].map(({ label, value, color }) => (
                      <Box
                        key={label}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 1,
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{ ...STATUS_STYLE[task.status], fontWeight: 600 }}
                    />
                    {task.dueDate && (
                      <Typography variant="caption" color="text.secondary">
                        期限: {formatDate(task.dueDate)}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </>
      ) : (
        // モバイル以外: テーブル表示
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                {(
                  [
                    "taskTitle",
                    "estimated",
                    "actual",
                    "diff",
                    "status",
                    "dueDate",
                  ] as TaskSortField[]
                ).map((f) =>
                  renderSortHeader(
                    f,
                    TASK_LABELS[f],
                    taskSortField,
                    taskSortDir,
                    makeHandleSort(
                      f,
                      taskSortField,
                      setTaskSortField,
                      taskSortDir,
                      setTaskSortDir,
                    ),
                    f === "taskTitle" || f === "status" || f === "dueDate"
                      ? "left"
                      : "right",
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    タスクがありません
                  </TableCell>
                </TableRow>
              ) : (
                sortedTasks.map((task) => (
                  <TableRow key={task.taskId} hover>
                    <TableCell>{task.taskTitle}</TableCell>
                    <TableCell align="right">{task.estimated}h</TableCell>
                    <TableCell align="right">{task.actual}h</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: diffColor(task.diff), fontWeight: "bold" }}
                    >
                      {task.diff > 0 ? "+" : ""}
                      {task.diff}h
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{ ...STATUS_STYLE[task.status], fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(task.dueDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* グラフ */}
      <Grid container spacing={2}>
        {/* タスク実績グラフ（フィルタあり） */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              タスク実績グラフ
            </Typography>
            {sortedTasks.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                データがありません
              </Typography>
            ) : (
              <BarChart
                layout="horizontal"
                yAxis={[
                  {
                    data: sortedTasks.map((t) => t.taskTitle),
                    scaleType: "band",
                    // タスク名の文字数に応じてラベルの広さを決定する。ただし最大は250px。
                    width: Math.min(
                      250,
                      Math.max(...sortedTasks.map((p) => p.taskTitle.length)) *
                        15,
                    ),
                  },
                ]}
                xAxis={[{ scaleType: "linear" }]}
                series={[
                  {
                    data: sortedTasks.map((t) => t.estimated),
                    label: "見積 (h)",
                    color: "#1976d2",
                  },
                  {
                    data: sortedTasks.map((t) => t.actual),
                    label: "実績 (h)",
                    color: "#f57c00",
                  },
                ]}
                height={Math.max(200, sortedTasks.length * 50 + 80)}
                margin={{ left: 0, right: 20, top: 30, bottom: 40 }}
              />
            )}
          </Paper>
        </Grid>

        {/* サマリグラフ（フィルタなし） */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              サマリグラフ（プロジェクト全体）
            </Typography>
            <BarChart
              layout="horizontal"
              yAxis={[
                {
                  data: ["プロジェクト全体"],
                  scaleType: "band",
                  width: 120,
                },
              ]}
              xAxis={[{ scaleType: "linear" }]}
              series={[
                {
                  data: [data.estimatedTotal],
                  label: "見積合計 (h)",
                  color: "#1976d2",
                },
                {
                  data: [data.actualTotal],
                  label: "実績合計 (h)",
                  color: "#f57c00",
                },
              ]}
              height={150}
              margin={{ left: 0, right: 20, top: 30, bottom: 40 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
