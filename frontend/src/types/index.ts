// ===========================
// Enum
// ===========================

/**
 * タスクのステータスを文字列リテラル型で定義
 */
export type TaskStatus = "TODO" | "DOING" | "DONE";

/**
 * タスクの優先度を文字列リテラル型で定義
 */
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

// ===========================
// エンティティ型
// ===========================

/**
 * ユーザのエンティティ
 */
export type User = {
  id: number;
  name: string;
  email: string;
};

/**
 * タスクにアサインされたユーザのエンティティ
 */
export type AssignedUser = {
  id: number;
  name: string;
};

/**
 * プロジェクトのエンティティ
 */
export type Project = {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * タスクのエンティティ
 */
export type Task = {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedHours: number | null;
  assignedUsers: AssignedUser[];
  createdAt: string;
  updatedAt: string;
};

/**
 * 作業ログのエンティティ
 */
export type WorkLog = {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  workDate: string;
  hours: number;
  memo: string;
  createdAt: string;
};

/**
 * タスクの時間集計(見積時間、実績時間、差分)のエンティティ
 */
export type HoursSummary = {
  taskId: number;
  taskTitle: string;
  estimatedHours: number | null;
  actualHours: number;
  diffHours: number | null;
};

// ===========================
// APIリクエスト・レスポンス型
// ===========================

/**
 * ユーザ登録のリクエスト
 */
export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

/**
 * ログインのリクエスト
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * ログインのレスポンス
 */
export type LoginResponse = {
  token: string;
  userId: number;
  name: string;
  email: string;
};

/**
 * プロジェクト作成のリクエスト
 */
export type CreateProjectRequest = {
  name: string;
  description: string;
};

/**
 * タスク作成のリクエスト
 */
export type CreateTaskRequest = {
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedHours: number | null;
  assignedUserIds: number[];
};

/**
 * タスク更新のリクエスト
 */
export type UpdateTaskRequest = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  estimatedHours?: number | null;
};

/**
 * 作業ログ作成のリクエスト
 */
export type CreateWorkLogRequest = {
  taskId: number;
  workDate: string;
  hours: number;
  memo: string;
};

// ===========================
// ダッシュボード関連
// ===========================

export type DashboardKpi = {
  incompleteTaskCount: number;
  todayWorkHours: number;
  monthlyWorkHours: number;
  overdueTaskCount: number;
  activeProjectCount: number;
};

export type DailyWorkHours = {
  date: string;
  hours: number;
};

export type ProjectProgress = {
  projectId: number;
  projectName: string;
  totalTaskCount: number;
  doneTaskCount: number;
  progressRate: number;
};

// ===========================
// 見積・実績比較関連
// ===========================

export type TaskEstimateActual = {
  taskId: number;
  taskTitle: string;
  estimated: number;
  actual: number;
  diff: number;
  status: TaskStatus;
  dueDate: string | null;
};

export type ProjectEstimateActual = {
  estimatedTotal: number;
  actualTotal: number;
  diff: number;
  actualRate: number;
  tasks: TaskEstimateActual[];
};
