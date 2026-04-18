"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import api from "@/lib/api";
import { CreateProjectRequest } from "@/types";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

/**
 * プロジェクト作成モーダルコンポーネント
 */
export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectRequest>();

  // モーダルの裏の要素をロックするカスタムフック
  useModalScrollLock(open);

  // 登録ボタン押下時のイベントハンドラ
  const onSubmit = async (data: CreateProjectRequest) => {
    try {
      await api.post("/projects", data);
      enqueueSnackbar("プロジェクトを登録しました", { variant: "success" });
      reset();
      onCreated();
      onClose();
    } catch {
      enqueueSnackbar("プロジェクトの登録に失敗しました", { variant: "error" });
    }
  };

  // キャンセルボタン押下時のイベントハンドラ
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>プロジェクト作成</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            label="プロジェクト名"
            fullWidth
            margin="normal"
            {...register("name", {
              required: "プロジェクト名を入力してください",
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="説明"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            {...register("description")}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "登録"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
