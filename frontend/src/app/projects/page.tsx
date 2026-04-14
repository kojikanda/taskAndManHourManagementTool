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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import { useProjects, ProjectFilter } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";

/**
 * プロジェクト一覧ページ
 */
export default function ProjectsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ProjectFilter>("assigned"); // 初期値は「自担当タスクあり」
  const { projects, loading, refetch } = useProjects(
    user?.userId ?? null,
    filter,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  // フィルタのトグルボタン押下イベントハンドラ
  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newFilter: ProjectFilter | null,
  ) => {
    // null（= 選択解除）は許可しない
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  return (
    <AppLayout>
      {/* ヘッダー */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
                  transition: "box-shadow 0.2s",
                }}
              >
                <CardActionArea
                  sx={{ height: "100%" }}
                  onClick={() => router.push(`/projects/${project.id}/tasks`)}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
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

      {/* プロジェクト作成モーダル */}
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refetch}
      />
    </AppLayout>
  );
}
