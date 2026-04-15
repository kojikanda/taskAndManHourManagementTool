import { TaskStatus, TaskPriority } from "@/types";

/** ステータスのスタイル */
export const STATUS_STYLE: Record<
  TaskStatus,
  { bgcolor: string; color: string }
> = {
  TODO: { bgcolor: "#ECEFF1", color: "#546E7A" },
  DOING: { bgcolor: "#E3F2FD", color: "#1565C0" },
  DONE: { bgcolor: "#E8F5E9", color: "#2E7D32" },
};

/** 優先度のスタイル */
export const PRIORITY_STYLE: Record<
  TaskPriority,
  { bgcolor: string; color: string }
> = {
  HIGH: { bgcolor: "#FFEBEE", color: "#C62828" },
  MEDIUM: { bgcolor: "#FFF3E0", color: "#E65100" },
  LOW: { bgcolor: "#F5F5F5", color: "#757575" },
};

/** アバターの色（ユーザIDで色を固定） */
const AVATAR_COLORS = ["#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#c62828"];

/**
 * アバターの色取得メソッド。
 * idの値によって、5色を順番に回すように色を返す。
 *
 * @param id ID
 * @returns アバターの色
 */
export const getAvatarColor = (id: number) =>
  AVATAR_COLORS[id % AVATAR_COLORS.length];

/**
 * 日付文字列をYYYY/MM/DD形式に変換して返す。
 * ハイフンをスラッシュに置換し、先頭の日付部分のみを取り出して返す。
 *
 * @param dateStr 日付文字列
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return dateStr.substring(0, 10).replace(/-/g, "/");
}
