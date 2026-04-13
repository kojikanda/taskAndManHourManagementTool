import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import Providers from "@/components/Providers";
import "./globals.css";

/**
 * メタデータ
 */
export const metadata: Metadata = {
  title: "タスク工数管理ツール",
  description: "タスクと工数を管理するツール",
};

/**
 * ルートレイアウト取得処理
 * @param 子コンポーネント
 * @returns ルートレイアウト
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AppRouterCacheProvider>
          <CssBaseline />
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
