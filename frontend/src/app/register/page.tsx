"use client";

import { useRouter } from "next/navigation";
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
import { RegisterRequest } from "@/types";

/**
 * ユーザ登録画面ページ
 * @returns ユーザ登録画面ページ
 */
export default function RegisterPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>();

  // 登録ボタン押下時のイベントハンドラ
  const onSubmit = async (data: RegisterRequest) => {
    try {
      // ユーザ登録のAPIリクエスト送信
      await api.post("/auth/register", data);
      enqueueSnackbar("ユーザ登録が完了しました。ログインしてください。", {
        variant: "success",
      });
      router.push("/");
    } catch {
      enqueueSnackbar(
        "登録に失敗しました。すでに使用済みのメールアドレスの可能性があります。",
        {
          variant: "error",
        },
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "primary.50",
        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={4} sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* ヘッダー部分：青背景 */}
          <Box
            sx={{
              bgcolor: "primary.main",
              px: 4,
              py: 3,
              textalign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "white", mt: 0.5 }}>
              タスク工数管理ツール
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              アカウント作成
            </Typography>
          </Box>

          {/* フォーム部分 */}
          <Box sx={{ px: 4, py: 3 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                label="名前"
                fullWidth
                margin="normal"
                {...register("name", { required: "名前を入力してください" })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
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
                  minLength: {
                    value: 6,
                    message: "パスワードは6文字以上で入力してください",
                  },
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
                sx={{ mt: 2, py: 1.5, borderRadius: 2 }}
              >
                {isSubmitting ? "登録中..." : "アカウントを作成する"}
              </Button>
            </Box>

            <Typography
              variant="body2"
              sx={{ textalign: "center", mt: 2, color: "text.secondary" }}
            >
              すでにアカウントをお持ちの方は{" "}
              <MuiLink component={Link} href="/">
                こちら
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
