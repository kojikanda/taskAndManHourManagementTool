"use client";

import { useState } from "react";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DRAWER_WIDTH } from "@/lib/commonStyles";

type Props = {
  children: React.ReactNode;
};

/**
 * サイドバー付きレイアウトコンポーネント。
 * 未ログインの場合はログイン画面へリダイレクトする。
 */
export default function AppLayout({ children }: Props) {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 未ログインはログイン画面へ
  useEffect(() => {
    // initializedがtrueになった後にのみリダイレクト判定する
    // （false のうちに判定すると、ログイン済みユーザが誤ってリダイレクトされる）
    if (!initialized) return;

    if (!user) {
      // ログインしていないときはログインページにリダイレクト
      router.replace("/");
    }
  }, [user, initialized, router]);

  // iOSのSafariで描画崩れを起こす件に対して、強制的に再描画を促す処置
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 軽めの再描画トリガ
        requestAnimationFrame(() => {
          document.body.style.transform = "translateZ(0)";
          void document.body.offsetHeight; // reflow
          document.body.style.transform = "";
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 初期化前 or 未ログインは何も表示しない
  if (!initialized || !user) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        bgcolor: "grey.50",
      }}
    >
      {/* スマホ用ヘッダー（smより小さいときのみ表示） */}
      <AppBar
        position="static" // これによりAppBarの高さが自動計算され、mainが残りの画面を埋める
        sx={{
          display: { sm: "none" },
          bgcolor: "grey.900",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((prev) => !prev)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="subtitle1"
            sx={{ fontSize: 14, fontWeight: 600 }}
          >
            タスク工数管理ツール
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch", // 完成スクロール安定化
            overscrollBehaviorY: "none", // 背後の要素へのスクロール伝播を防ぐ

            // GPUアクセラレーション（標準とWebkit両方併記が確実）
            transform: "translate3d(0,0,0)",
            WebkitTransform: "translate3d(0,0,0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            perspective: 1000,
            WebkitPerspective: 1000,

            willChange: "transform", // ブラウザにレイヤー作成を促す
            height: "100%", // 親のdvhを継承させる
            ml: { sm: DRAWER_WIDTH + "px" },
            bgcolor: "grey.50",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
