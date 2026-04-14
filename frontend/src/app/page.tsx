"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { LoginRequest, LoginResponse } from "@/types";

/**
 * ログインページコンポーネント
 * @returns ログインページコンポーネント
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>();

  // すでにログイン済みの場合はプロジェクト一覧へリダイレクト
  useEffect(() => {
    if (user) {
      router.replace("/projects");
    }
  }, [user, router]);

  // ログインボタンが押下されたときのイベントハンドラ
  const onSubmit = async (data: LoginRequest) => {
    try {
      // loginのAPIリクエスト送信
      const response = await api.post<LoginResponse>("/auth/login", data);
      // ローカルストレージにユーザの情報を設定
      login(response.data);
      enqueueSnackbar("ログインしました", { variant: "success" });
      router.push("/projects");
    } catch {
      enqueueSnackbar("メールアドレスまたはパスワードが正しくありません", {
        variant: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}
          >
            タスク工数管理ツール
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="メールアドレス"
              type="email"
              fullWidth
              margin="normal"
              {...register("email", {
                required: "メールアドレスを入力してください",
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="パスワード"
              type="password"
              fullWidth
              margin="normal"
              {...register("password", {
                required: "パスワードを入力してください",
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }}>
            アカウントをお持ちでない方は{" "}
            <MuiLink component={Link} href="/register">
              こちら
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
