import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Task,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';

export interface TaskFormValues {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
}

export interface TaskFormSubmitEvent {
  isEdit: boolean;
  taskId?: number;
  payload: TaskFormValues;
}

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form-modal.component.html',
  styleUrl: './task-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormModalComponent implements OnChanges {
  @Input() open = false;
  @Input() task: Task | null = null;
  @Input() defaultStatus: TaskStatus = 'todo';

  @Output() save = new EventEmitter<TaskFormSubmitEvent>();
  @Output() close = new EventEmitter<void>();

  readonly statuses = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;

  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    status: this.fb.nonNullable.control<TaskStatus>('todo'),
    priority: this.fb.nonNullable.control<TaskPriority>('medium'),
    assigneeId: this.fb.nonNullable.control<'me' | 'teammate'>('me'),
  });

  get isEdit(): boolean {
    return !!this.task;
  }

  ngOnChanges(): void {
    if (!this.open) {
      return;
    }

    if (this.task) {
      this.form.reset({
        title: this.task.title,
        description: this.task.description ?? '',
        status: this.task.status,
        priority: this.task.priority,
        assigneeId: this.task.assigneeId === 'me' ? 'me' : 'teammate',
      });
    } else {
      this.form.reset({
        title: '',
        description: '',
        status: this.defaultStatus,
        priority: 'medium',
        assigneeId: 'me',
      });
    }
  }

  get titleControl() {
    return this.form.controls.title;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.error(this.firstValidationMessage());
      return;
    }

    const value = this.form.getRawValue();
    const title = value.title.trim();

    if (!title) {
      this.notifications.error('Title is required.');
      return;
    }

    const payload: TaskFormValues = {
      title,
      description: value.description.trim() || null,
      status: value.status,
      priority: value.priority,
      assigneeId: value.assigneeId,
    };

    this.save.emit({
      isEdit: this.isEdit,
      taskId: this.task?.id,
      payload,
    });
  }

  private firstValidationMessage(): string {
    const title = this.form.controls.title;

    if (title.hasError('required')) {
      return 'Title is required.';
    }
    if (title.hasError('maxlength')) {
      return 'Title must be 120 characters or fewer.';
    }

    return 'Please fix the form errors before saving.';
  }
}
