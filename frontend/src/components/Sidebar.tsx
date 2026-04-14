"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";

/**
 * サイドバーコンポーネント
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    logout();
    enqueueSnackbar("ログアウトしました", { variant: "info" });
    router.push("/");
  };

  return (
    <Box
      sx={{
        width: 220,
        flexShrink: 0,
        bgcolor: "grey.900",
        color: "white",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* アプリ名, ログインしているユーザ名 */}
      <Box sx={{ px: 2, py: 2.5 }}>
        <Typography
          variant="subtitle2"
          sx={{ color: "grey.400", fontSize: 11, letterSpacing: 1 }}
        >
          タスク工数管理ツール
        </Typography>
        {user && (
          <Typography
            variant="body2"
            sx={{ color: "white", mt: 0.5, fontWeight: 600 }}
          >
            {user.name}
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: "grey.700" }} />

      {/* ナビゲーションリンク */}
      <List sx={{ flex: 1, py: 1 }}>
        <ListItemButton component={Link} href="/projects" sx={listItemSx}>
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <FolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="プロジェクト一覧"
            slotProps={{ primary: { sx: { fontSize: 14 } } }}
          />
        </ListItemButton>

        <ListItemButton component={Link} href="/tasks/my" sx={listItemSx}>
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <AssignmentIndIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="自担当タスク"
            slotProps={{ primary: { sx: { fontSize: 14 } } }}
          />
        </ListItemButton>
      </List>

      <Divider sx={{ borderColor: "grey.700" }} />

      {/* ログアウト */}
      <List sx={{ py: 1 }}>
        <ListItemButton onClick={handleLogout} sx={listItemSx}>
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="ログアウト"
            slotProps={{ primary: { sx: { fontSize: 14 } } }}
          />
        </ListItemButton>
      </List>
    </Box>
  );
}

// リストアイテムの共通スタイル
const listItemSx = {
  color: "grey.300",
  borderRadius: 1,
  mx: 1,
  "&:hover": { bgcolor: "grey.800", color: "white" },
};
