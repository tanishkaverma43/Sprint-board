import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { combineLatest, map, startWith } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import {
  CURRENT_USER_ID,
  Task,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';
import { BoardColumnComponent } from './board-column/board-column.component';
import {
  TaskFormModalComponent,
  TaskFormSubmitEvent,
} from './task-form-modal/task-form-modal.component';

type AssigneeFilter = 'all' | 'me';
type Columns = Record<TaskStatus, Task[]>;

function emptyColumns(): Columns {
  return { todo: [], 'in-progress': [], done: [] };
}

function groupByStatus(tasks: Task[]): Columns {
  const byStatus = emptyColumns();
  for (const task of tasks) {
    byStatus[task.status].push(task);
  }
  for (const key of Object.keys(byStatus) as TaskStatus[]) {
    byStatus[key].sort((a, b) => a.position - b.position);
  }
  return byStatus;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    BoardColumnComponent,
    TaskFormModalComponent,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;
  readonly currentUserId = CURRENT_USER_ID;

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    priority: [''],
  });

  readonly assigneeFilter = signal<AssigneeFilter>('all');
  readonly isModalOpen = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly modalDefaultStatus = signal<TaskStatus>('todo');
  readonly isLoading = signal(true);

  /** Live filtered task list (search + priority + Me/All). */
  private readonly filteredTasks = toSignal(
    combineLatest([
      this.taskService.tasks$,
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue())),
      toObservable(this.assigneeFilter),
    ]).pipe(
      map(([tasks, filters, assignee]) => {
        const search = (filters.search ?? '').trim().toLowerCase();
        const priority = (filters.priority ?? '') as TaskPriority | '';

        return tasks.filter((task) => {
          const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search) ||
            (task.description ?? '').toLowerCase().includes(search);
          const matchesPriority = !priority || task.priority === priority;
          const matchesAssignee = assignee === 'all' || task.assigneeId === this.currentUserId;
          return matchesSearch && matchesPriority && matchesAssignee;
        });
      })
    ),
    { initialValue: [] as Task[] }
  );

  /**
   * Local column buckets used by CDK drag-drop (mutated in place during a drag).
   * Kept in sync from `filteredTasks` via an explicit rebuild — not an effect —
   * so Angular signal-write restrictions never block UI updates.
   */
  readonly columns = signal<Columns>(emptyColumns());

  constructor() {
    // Rebuild columns whenever the filtered list changes (load, create, update, filters).
    toObservable(this.filteredTasks)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tasks) => {
        this.columns.set(groupByStatus(tasks));
      });
  }

  ngOnInit(): void {
    this.taskService.loadTasks().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

  setAssigneeFilter(filter: AssigneeFilter): void {
    this.assigneeFilter.set(filter);
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    const task: Task = event.item.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    // Notify OnPush after CDK mutates arrays in place.
    this.columns.set({ ...this.columns() });

    const newStatus = event.container.id as TaskStatus;
    const newPosition = event.currentIndex;

    this.taskService.updateTaskStatus(task.id, { status: newStatus, position: newPosition }).subscribe({
      next: () =>
        this.notifications.success(`"${task.title}" moved to ${this.labelFor(newStatus)}.`),
    });
  }

  private labelFor(status: TaskStatus): string {
    return this.statuses.find((s) => s.key === status)?.label ?? status;
  }

  openCreateModal(status: TaskStatus): void {
    this.editingTask.set(null);
    this.modalDefaultStatus.set(status);
    this.isModalOpen.set(true);
  }

  openEditModal(task: Task): void {
    this.editingTask.set(task);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handleSave(event: TaskFormSubmitEvent): void {
    if (event.isEdit && event.taskId) {
      this.taskService.updateTask(event.taskId, event.payload).subscribe({
        next: () => {
          this.notifications.success('Task updated.');
          this.closeModal();
        },
      });
    } else {
      this.taskService.createTask(event.payload).subscribe({
        next: () => {
          this.notifications.success('Task created.');
          this.closeModal();
        },
      });
    }
  }

  handleDelete(task: Task): void {
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => this.notifications.success('Task deleted.'),
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', priority: '' });
    this.assigneeFilter.set('all');
  }
}
