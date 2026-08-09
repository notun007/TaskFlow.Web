import { Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiTask, ReferenceItem, TaskApiService } from '../../task-api.service';

@Component({ selector: 'app-board-page', standalone: true, imports: [DatePipe], templateUrl: './board.html', styleUrl: './board.scss', encapsulation: ViewEncapsulation.None })
export class BoardPage implements OnInit {
  private readonly api = inject(TaskApiService);
  readonly statuses = ['Submitted', 'Triaged', 'Approved', 'Assigned', 'InProgress', 'PendingInformation', 'PendingVendor', 'ReadyForTesting', 'Uat', 'Resolved', 'Closed', 'Rejected', 'Cancelled', 'Reopened'];
  readonly tasks = signal<ApiTask[]>([]); readonly projects = signal<ReferenceItem[]>([]); readonly search = signal(''); readonly projectId = signal('');
  readonly loading = signal(false); readonly moving = signal(false); readonly error = signal(''); readonly message = signal(''); readonly draggedTask = signal<ApiTask | null>(null); readonly dragTarget = signal('');
  readonly visibleCount = computed(() => this.tasks().length);
  ngOnInit() { this.api.getProjects().subscribe({ next: projects => this.projects.set(projects) }); this.load(); }
  load() { this.loading.set(true); this.error.set(''); this.message.set(''); this.api.getTasks({ search: this.search().trim(), projectId: this.projectId(), page: 1, pageSize: 100, sortBy: 'priority', sortDirection: 'desc' }).subscribe({ next: result => { this.tasks.set(result.items); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set('Board tasks could not be loaded.'); } }); }
  clearFilters() { this.search.set(''); this.projectId.set(''); this.load(); }
  tasksFor(status: string) { return this.tasks().filter(task => task.status === status); }
  startDrag(task: ApiTask, event: DragEvent) { if (this.moving()) return; this.draggedTask.set(task); event.dataTransfer?.setData('text/plain', task.id); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'; }
  allowDrop(status: string, event: DragEvent) { event.preventDefault(); this.dragTarget.set(status); if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; }
  leaveDrop(status: string) { if (this.dragTarget() === status) this.dragTarget.set(''); }
  drop(status: string, event: DragEvent) { event.preventDefault(); const task = this.draggedTask(); this.dragTarget.set(''); this.draggedTask.set(null); if (!task || task.status === status) return; this.move(task, status); }
  endDrag() { this.dragTarget.set(''); this.draggedTask.set(null); }
  move(task: ApiTask, status: string) { this.moving.set(true); this.error.set(''); this.message.set(''); this.api.changeTaskStatus(task.id, status, `Moved on board from ${task.status} to ${status}`).subscribe({ next: updated => { this.tasks.update(tasks => tasks.map(item => item.id === task.id ? { ...item, status: updated.status } : item)); this.moving.set(false); this.message.set(`${task.taskNumber} moved to ${this.label(status)}.`); }, error: (error: HttpErrorResponse) => { this.moving.set(false); this.error.set(error.status === 409 ? `Move not allowed. Valid next statuses: ${(error.error?.allowedTransitions ?? []).map((value: string) => this.label(value)).join(', ') || 'none'}.` : 'Task could not be moved.'); } }); }
  label(value: string) { return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace('Uat', 'UAT'); }
  priorityClass(priority: string) { return priority.toLowerCase(); }
}
