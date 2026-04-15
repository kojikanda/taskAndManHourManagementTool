import api from "@/lib/api";
import { Task, UpdateTaskRequest } from "@/types";

/**
 * タスクのステータスまたは優先度を更新する。
 *
 * @param task    更新対象のタスク
 * @param updates 変更するフィールド(status or priority)
 * @returns 更新後のタスク。値が同じで更新不要の場合はnullを返す。
 */
export async function updateTaskField(
  task: Task,
  updates: Partial<Pick<UpdateTaskRequest, "status" | "priority">>,
): Promise<Task | null> {
  // 前回値と同じ場合は何もしない
  const isSame =
    (updates.status !== undefined && updates.status === task.status) ||
    (updates.priority !== undefined && updates.priority === task.priority);
  if (isSame) return null;

  // Tasksテーブルを更新
  const res = await api.put<Task>(`/tasks/${task.id}`, {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    ...updates,
  } satisfies UpdateTaskRequest);

  return res.data;
}
