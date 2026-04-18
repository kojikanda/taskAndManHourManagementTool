"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { STATUS_STYLE, PRIORITY_STYLE, formatDate } from "@/lib/taskStyles";
import {
  useDashboardKpi,
  useRecentTasks,
  useWorkHoursHistory,
  useProjectProgress,
} from "@/hooks/useDashboard";

/**
 * ダッシュボード画面ページ
 * @returns ダッシュボード画面ページ
 */
export default function DashboardPage() {
  const router = useRouter();
  const { kpi, loading: kpiLoading } = useDashboardKpi();
  const { tasks, loading: tasksLoading } = useRecentTasks();
  const { workHours, loading: workHoursLoading } = useWorkHoursHistory();
  const { progress, loading: progressLoading } = useProjectProgress();

  // モバイル判定
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const kpiCards = kpi
    ? [
        {
          label: "未完了タスク",
          value: kpi.incompleteTaskCount,
          unit: "件",
          icon: <AssignmentIcon />,
          color: "#1976d2",
          bgcolor: "#e3f2fd",
        },
        {
          label: "今日の作業時間",
          value: kpi.todayWorkHours,
          unit: "h",
          icon: <AccessTimeIcon />,
          color: "#2e7d32",
          bgcolor: "#e8f5e9",
        },
        {
          label: "今月の作業時間",
          value: kpi.monthlyWorkHours,
          unit: "h",
          icon: <CalendarMonthIcon />,
          color: "#6a1b9a",
          bgcolor: "#f3e5f5",
        },
        {
          label: "遅延タスク",
          value: kpi.overdueTaskCount,
          unit: "件",
          icon: <WarningAmberIcon />,
          color: "#c62828",
          bgcolor: "#ffebee",
        },
        {
          label: "進行中プロジェクト",
          value: kpi.activeProjectCount,
          unit: "件",
          icon: <FolderOpenIcon />,
          color: "#e65100",
          bgcolor: "#fff3e0",
        },
      ]
    : [];

  return (
    <AppLayout>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        ダッシュボード
      </Typography>

      {/* KPIカード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiLoading
          ? [...Array(5)].map((_, i) => (
              <Grid
                size={{ xs: 12, sm: 6, lg: "auto" }}
                key={i}
                sx={{ flexGrow: { lg: 1 } }}
              >
                <Skeleton
                  variant="rectangular"
                  height={90}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))
          : kpiCards.map((card, i) => (
              <Grid
                size={{ xs: 12, sm: 6, lg: "auto" }}
                key={i}
                sx={{ flexGrow: { lg: 1 } }}
              >
                <Card
                  sx={{
                    borderRadius: 2,
                    bgcolor: card.bgcolor,
                    boxShadow: "none",
                    border: `1px solid ${card.color}30`,
                    height: "100%",
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: "12px 16px !important",
                    }}
                  >
                    <Box sx={{ color: card.color, display: "flex" }}>
                      {card.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          lineHeight: 1.2,
                        }}
                      >
                        {card.label}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: "bold",
                            color: card.color,
                            lineHeight: 1.3,
                          }}
                        >
                          {card.value}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {card.unit}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      {/* 自担当タスク（直近） */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1.5 }}>
          自担当タスク（直近）
        </Typography>
        {tasksLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} height={40} />)
        ) : isMobile ? (
          // モバイル: カード表示
          tasks.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              タスクがありません
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {tasks.map((task) => (
                <Card key={task.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardActionArea
                    onClick={() =>
                      router.push(
                        `/projects/${task.projectId}/tasks/${task.id}`,
                      )
                    }
                    sx={{ p: 2 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.projectName}
                    </Typography>
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
                        sx={{ ...STATUS_STYLE[task.status], fontWeight: 600 }}
                      />
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          ...PRIORITY_STYLE[task.priority],
                          fontWeight: 600,
                        }}
                      />
                      {task.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          期限: {formatDate(task.dueDate)}
                        </Typography>
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )
        ) : (
          // モバイル以外: テーブル表示
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell>タスク名</TableCell>
                  <TableCell>プロジェクト</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>優先度</TableCell>
                  <TableCell>期限</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      タスクがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(
                          `/projects/${task.projectId}/tasks/${task.id}`,
                        )
                      }
                    >
                      <TableCell
                        sx={{
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.title}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.projectName}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status}
                          size="small"
                          sx={{
                            ...STATUS_STYLE[task.status],
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            ...PRIORITY_STYLE[task.priority],
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {task.dueDate ? formatDate(task.dueDate) : "---"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 作業時間グラフ + プロジェクト進捗グラフ */}
      <Grid container spacing={2}>
        {/* 作業時間グラフ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              作業時間（直近7日）
            </Typography>
            {workHoursLoading ? (
              <Skeleton
                variant="rectangular"
                height={230}
                sx={{ borderRadius: 1 }}
              />
            ) : (
              <LineChart
                xAxis={[
                  {
                    data: workHours.map((d) =>
                      d.date.slice(5).replace("-", "/"),
                    ),
                    scaleType: "point",
                  },
                ]}
                series={[
                  {
                    data: workHours.map((d) => Number(d.hours)),
                    label: "作業時間 (h)",
                    area: true,
                    color: "#1976d2",
                    curve: "linear",
                  },
                ]}
                height={230}
                margin={{ left: 45, right: 20, top: 20, bottom: 30 }}
              />
            )}
          </Paper>
        </Grid>

        {/* プロジェクト進捗グラフ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              プロジェクト進捗
            </Typography>
            {progressLoading ? (
              <Skeleton
                variant="rectangular"
                height={230}
                sx={{ borderRadius: 1 }}
              />
            ) : progress.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                データがありません
              </Typography>
            ) : (
              <BarChart
                layout="horizontal"
                yAxis={[
                  {
                    data: progress.map((p) => p.projectName),
                    scaleType: "band",
                    // プロジェクト名の文字数に応じてラベルの広さを決定する。ただし最大は200px。
                    width: Math.min(
                      200,
                      Math.max(...progress.map((p) => p.projectName.length)) *
                        15,
                    ),
                  },
                ]}
                xAxis={[{ min: 0, max: 100 }]}
                series={[
                  {
                    data: progress.map((p) => Math.round(p.progressRate * 100)),
                    label: "進捗率 (%)",
                    color: "#2e7d32",
                  },
                ]}
                height={Math.max(200, progress.length * 60)}
                margin={{ left: 0, right: 40, top: 20, bottom: 40 }}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </AppLayout>
  );
}
