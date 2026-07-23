import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { Task, TaskStatus } from '../../../core/models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  templateUrl: './board-column.component.html',
  styleUrl: './board-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColumnComponent {
  @Input({ required: true }) status!: TaskStatus;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tasks!: Task[];

  @Output() dropped = new EventEmitter<CdkDragDrop<Task[]>>();
  @Output() addTask = new EventEmitter<TaskStatus>();
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<Task>();

  trackById(_index: number, task: Task): number {
    return task.id;
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    this.dropped.emit(event);
  }
}
