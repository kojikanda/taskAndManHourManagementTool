"use client";

import { ReactNode } from "react";
import { SnackbarProvider } from "notistack";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * プロバイダコンポーネント。
 * layout.tsxはサーバコンポーネントのため、"use client"が必要なプロバイダを直接書けないため、
 * プロバイダをまとめたクライアントコンポーネントをこのファイルに作り、layout.tsxから読み込めるようにする。
 * @param children 子コンポーネント
 * @returns プロバイダコンポーネント
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SnackbarProvider
        // 最大3件のトーストを同時表示
        maxSnack={3}
        // トーストの配置指定
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        // 3秒後に自動て閉じる
        autoHideDuration={5000}
      >
        {children}
      </SnackbarProvider>
    </AuthProvider>
  );
}
