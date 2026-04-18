"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useForm, Controller } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CreateTaskRequest, User } from "@/types";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  projectId: number;
};

/**
 * タスク作成モーダルコンポーネント
 */
export default function CreateTaskModal({
  open,
  onClose,
  onCreated,
  projectId,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskRequest>({
    defaultValues: {
      projectId,
      status: "TODO",
      priority: "MEDIUM",
      assignedUserIds: [],
    },
  });

  // モーダルの裏の要素をロックするカスタムフック
  useModalScrollLock(open);

  // モーダルを開いたときにユーザ一覧を取得
  useEffect(() => {
    if (open) {
      api.get<User[]>("/users").then((res) => setUsers(res.data));
    }
  }, [open]);

  // 登録ボタン押下時のイベントハンドラ
  const onSubmit = async (data: CreateTaskRequest) => {
    try {
      await api.post("/tasks", { ...data, projectId });
      enqueueSnackbar("タスクを登録しました", { variant: "success" });
      reset();
      onCreated();
      onClose();
    } catch {
      enqueueSnackbar("タスクの登録に失敗しました", { variant: "error" });
    }
  };

  // キャンセルボタン押下時のイベントハンドラ
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>タスク作成</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="タスク名"
            fullWidth
            {...register("title", {
              required: "タスク名を入力してください",
            })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <TextField
            label="説明"
            fullWidth
            multiline
            rows={2}
            {...register("description")}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* ステータス: MUIのSelectはregisterを渡すことができないため、Controllerを使う */}
            <FormControl fullWidth size="small">
              <InputLabel>ステータス</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="ステータス">
                    <MenuItem value="TODO">TODO</MenuItem>
                    <MenuItem value="DOING">DOING</MenuItem>
                    <MenuItem value="DONE">DONE</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
            {/* 優先度 */}
            <FormControl fullWidth size="small">
              <InputLabel>優先度</InputLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="優先度">
                    <MenuItem value="HIGH">HIGH</MenuItem>
                    <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                    <MenuItem value="LOW">LOW</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="期限"
                  // フォームの文字列値 → Dayjs に変換してDatePickerに渡す
                  value={field.value ? dayjs(field.value) : null}
                  // DatePickerの選択値（Dayjs）→ 文字列に変換してフォームに戻す
                  onChange={(newValue: Dayjs | null) => {
                    field.onChange(
                      newValue ? newValue.format("YYYY-MM-DD") : null,
                    );
                  }}
                  format="YYYY/MM/DD"
                  slotProps={{
                    field: { clearable: true },
                    textField: { size: "small", fullWidth: true },
                  }}
                />
              )}
            />
            <TextField
              label="見積時間（h）"
              type="number"
              fullWidth
              size="small"
              {...register("estimatedHours", { valueAsNumber: true })}
              slotProps={{ input: { inputProps: { min: 0, step: 0.5 } } }}
            />
          </Box>
          {/* 担当者（複数選択）*/}
          <FormControl fullWidth size="small">
            <InputLabel>担当者</InputLabel>
            <Controller
              name="assignedUserIds"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  multiple
                  input={<OutlinedInput label="担当者" />}
                  renderValue={(selected) =>
                    (selected as number[])
                      .map((id) => users.find((u) => u.id === id)?.name ?? "")
                      .join(", ")
                  }
                >
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      <Checkbox
                        checked={(field.value as number[]).includes(u.id)}
                      />
                      <ListItemText primary={u.name} />
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
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
