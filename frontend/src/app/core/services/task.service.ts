import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateTaskPayload,
  Task,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from '../models/task.model';

interface TaskListResponse {
  data: Task[];
  count: number;
}

interface TaskResponse {
  data: Task;
}

/**
 * Owns the authoritative task list as a BehaviorSubject so every component
 * that subscribes (board, columns, cards) reacts automatically to CRUD
 * operations without manual re-fetching or event plumbing.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadTasks(): Observable<TaskListResponse> {
    return this.http
      .get<TaskListResponse>(this.baseUrl)
      .pipe(tap((res) => this.tasksSubject.next(res.data)));
  }

  createTask(payload: CreateTaskPayload): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.baseUrl, payload).pipe(
      tap((res) => {
        this.tasksSubject.next([...this.tasksSubject.value, res.data]);
      })
    );
  }

  updateTask(id: number, payload: UpdateTaskPayload): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.baseUrl}/${id}`, payload).pipe(
      tap((res) => {
        this.replaceTask(res.data);
      })
    );
  }

  updateTaskStatus(id: number, payload: UpdateTaskStatusPayload): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${this.baseUrl}/${id}/status`, payload).pipe(
      tap((res) => {
        this.replaceTask(res.data);
      })
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.tasksSubject.next(this.tasksSubject.value.filter((t) => t.id !== id));
      })
    );
  }

  /** Optimistically reorders/moves a task locally; used while a drag-drop PATCH is in flight. */
  applyOptimisticMove(tasks: Task[]): void {
    this.tasksSubject.next(tasks);
  }

  private replaceTask(updated: Task): void {
    this.tasksSubject.next(
      this.tasksSubject.value.map((t) => (t.id === updated.id ? updated : t))
    );
  }
}
