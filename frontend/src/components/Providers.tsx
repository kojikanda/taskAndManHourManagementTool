"use client";

import { SnackbarProvider } from "notistack";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { AuthProvider } from "@/contexts/AuthContext";

// dayjs本体に日本語使用を指定
dayjs.locale("ja");

/**
 * プロバイダコンポーネント。
 * layout.tsxはサーバコンポーネントのため、"use client"が必要なプロバイダを直接書けないため、
 * プロバイダをまとめたクライアントコンポーネントをこのファイルに作り、layout.tsxから読み込めるようにする。
 * @param children 子コンポーネント
 * @returns プロバイダコンポーネント
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <AuthProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {children}
        </SnackbarProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}
