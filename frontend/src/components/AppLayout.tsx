"use client";

import { Box } from "@mui/material";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  // 初期化前 or 未ログインは何も表示しない
  if (!initialized || !user) return null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, p: 3, overflow: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}
