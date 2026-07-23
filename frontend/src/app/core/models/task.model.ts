export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new task via POST /api/tasks. */
export type CreateTaskPayload = Pick<Task, 'title'> &
  Partial<Pick<Task, 'description' | 'status' | 'priority' | 'assigneeId'>>;

/** Payload for editing task details via PUT /api/tasks/:id. */
export type UpdateTaskPayload = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'position'>
>;

/** Payload dedicated to drag-and-drop moves via PATCH /api/tasks/:id/status. */
export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  position: number;
}

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export const TASK_PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
];

/** Static mock "current user" used to power the Me / All bonus filter. */
export const CURRENT_USER_ID = 'me';
