"use client";

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import AppLayout from "@/components/AppLayout";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import { useProjects, ProjectFilter } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { getAvatarColor } from "@/lib/taskStyles";

/**
 * プロジェクト一覧画面ページ
 * @returns プロジェクト一覧画面ページ
 */
export default function ProjectsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { user } = useAuth();

  // フィルタリング内容
  const [filter, setFilter] = useState<ProjectFilter>("assigned");

  // プロジェクトの情報取得
  const { projects, loading, refetch } = useProjects(
    user?.userId ?? null,
    filter,
  );

  // プロジェクト追加のモーダル表示・非表示
  const [modalOpen, setModalOpen] = useState(false);

  // ︙メニューの表示状態
  const [actionMenu, setActionMenu] = useState<{
    anchor: HTMLElement;
    projectId: number;
  } | null>(null);
  // ⋮ メニューが開いているか
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  // 削除対象のプロジェクトID
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // フィルタのトグルボタン押下時イベントハンドラ
  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newFilter: ProjectFilter | null,
  ) => {
    // null（= 選択解除）は許可しない
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  // 削除確認ダイアログで削除ボタンが押下されたときのイベントハンドラ
  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return;
    try {
      await api.delete(`/projects/${deleteTargetId}`);
      enqueueSnackbar("プロジェクトを削除しました", { variant: "success" });
      refetch();
    } catch {
      enqueueSnackbar("削除に失敗しました", { variant: "error" });
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <AppLayout>
      {/* ヘッダー */}
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
          プロジェクト一覧
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          プロジェクト作成
        </Button>
      </Box>

      {/* フィルタ（トグルボタン） */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
        >
          <ToggleButton value="assigned">自担当タスクあり</ToggleButton>
          <ToggleButton value="owner">管理対象</ToggleButton>
          <ToggleButton value="all">全て</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* プロジェクトカード一覧 */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton
                variant="rectangular"
                height={120}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Typography color="text.secondary">プロジェクトがありません</Typography>
      ) : (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  position: "relative",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
                  transition: "box-shadow 0.2s",
                  borderLeft: "4px solid",
                  borderColor: getAvatarColor(project.id),
                }}
              >
                {/* ⋮ メニューボタン */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    // タスク一覧に伝播しないよう伝播を止める
                    e.stopPropagation();
                    setActionMenu({
                      anchor: e.currentTarget,
                      projectId: project.id,
                    });
                    setActionMenuOpen(true);
                  }}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    color: "text.secondary",
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                <CardActionArea
                  sx={{ height: "100%" }}
                  onClick={() =>
                    router.push(`/projects/${project.id}/tasks?fresh=1`)
                  }
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: "bold", pr: 4 }} // ← ⋮ボタンと被らないよう pr: 4 は維持
                    >
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.description || "---"}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ⋮ メニュー */}
      <Menu
        anchorEl={actionMenu?.anchor}
        open={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        slotProps={{ transition: { onExited: () => setActionMenu(null) } }}
      >
        <MenuItem
          onClick={() => {
            setDeleteTargetId(actionMenu!.projectId);
            setActionMenuOpen(false);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>

      {/* プロジェクト作成モーダル */}
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          // 強制的に「管理対象」に切り替えて追加したプロジェクトを表示
          setFilter("owner");
          refetch();
        }}
      />

      {/* プロジェクト削除確認ダイアログ */}
      <Dialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
      >
        <DialogTitle>プロジェクトの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このプロジェクトを削除しますか？
            <br />
            関連するタスク・ワーク実績もすべて削除されます。
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
    </AppLayout>
  );
}
