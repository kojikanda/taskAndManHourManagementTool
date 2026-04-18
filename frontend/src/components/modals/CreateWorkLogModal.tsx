"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useForm, Controller } from "react-hook-form";
import { useSnackbar } from "notistack";
import api from "@/lib/api";
import { CreateWorkLogRequest } from "@/types";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  taskId: number;
};

/**
 * ワーク実績入力モーダルコンポーネント
 */
export default function CreateWorkLogModal({
  open,
  onClose,
  onCreated,
  taskId,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkLogRequest>({
    defaultValues: {
      taskId,
      workDate: dayjs().format("YYYY-MM-DD"), // 初期値: 今日
      hours: undefined,
      memo: "",
    },
  });

  // モーダルの裏の要素をロックするカスタムフック
  useModalScrollLock(open);

  // 登録ボタン押下時のイベントハンドラ
  const onSubmit = async (data: CreateWorkLogRequest) => {
    try {
      await api.post("/work-logs", { ...data, taskId });
      enqueueSnackbar("ワーク実績を登録しました", { variant: "success" });
      reset();
      onCreated();
      onClose();
    } catch {
      enqueueSnackbar("ワーク実績の登録に失敗しました", { variant: "error" });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>ワーク実績登録</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {/* 作業日 */}
          <Controller
            name="workDate"
            control={control}
            rules={{ required: "作業日を入力してください" }}
            render={({ field, fieldState }) => (
              <DatePicker
                label="作業日"
                value={field.value ? dayjs(field.value) : null}
                onChange={(newValue: Dayjs | null) => {
                  field.onChange(
                    newValue ? newValue.format("YYYY-MM-DD") : null,
                  );
                }}
                format="YYYY/MM/DD"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
          {/* 作業時間 */}
          <TextField
            label="作業時間（h）"
            type="number"
            fullWidth
            size="small"
            {...register("hours", {
              required: "作業時間を入力してください",
              min: { value: 0.5, message: "0.5h以上で入力してください" },
            })}
            slotProps={{ input: { inputProps: { min: 0.5, step: 0.5 } } }}
            error={!!errors.hours}
            helperText={errors.hours?.message}
          />
          {/* メモ */}
          <TextField
            label="メモ"
            fullWidth
            multiline
            rows={2}
            {...register("memo")}
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
