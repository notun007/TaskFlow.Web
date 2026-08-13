import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { catchError, of, switchMap } from 'rxjs';
import { ApiTask, BoardColumnItem, ReferenceItem, SprintItem, TaskApiService } from '../../task-api.service';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  encapsulation: ViewEncapsulation.None,
})
export class BoardPage implements OnInit {
  private readonly api = inject(TaskApiService);
  private loadRequestId = 0;

  readonly fallbackStatuses = [
    'Submitted',
    'Triaged',
    'Approved',
    'Assigned',
    'InProgress',
    'PendingInformation',
    'PendingVendor',
    'ReadyForTesting',
    'Uat',
    'Resolved',
    'Closed',
    'Rejected',
    'Cancelled',
    'Reopened',
  ];
  readonly columns = signal<BoardColumnItem[]>(this.fallbackStatuses.map((status, index) => ({ id: '', name: this.label(status), status, sortOrder: (index + 1) * 10, wipLimit: null, isDefaultDestination: true })));
  readonly tasks = signal<ApiTask[]>([]);
  readonly projects = signal<ReferenceItem[]>([]);
  readonly search = signal('');
  readonly projectId = signal('');
  readonly sprints = signal<SprintItem[]>([]);
  readonly sprintId = signal('');
  readonly typeFilter = signal('');
  readonly loading = signal(false);
  readonly moving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly draggedTask = signal<ApiTask | null>(null);
  readonly dragTarget = signal('');
  readonly allowedDropStatuses = signal<string[] | null>(null);
  readonly loadingTransitions = signal(false);
  readonly visibleTasks = computed(() => this.typeFilter() ? this.tasks().filter(task => task.type === this.typeFilter()) : this.tasks());
  readonly taskTypes = computed(() => [...new Set(this.tasks().map(task => task.type))].sort());
  readonly visibleCount = computed(() => this.visibleTasks().length);
  readonly allowedDropLabels = computed(() =>
    (this.allowedDropStatuses() ?? []).map((status) => this.label(status)).join(', '),
  );
  readonly selectedSprint = computed(() => this.sprints().find(sprint => sprint.id === this.sprintId()));
  readonly boardReadOnly = computed(() => this.selectedSprint()?.status !== 'Active');

  ngOnInit() {
    this.api.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        if (!this.projectId() && projects.length) this.projectId.set(projects[0].id);
        this.load();
      },
      error: () => this.error.set('Projects could not be loaded.'),
    });
  }

  load() {
    const selectedProjectId = this.projectId();
    if (!selectedProjectId) {
      this.tasks.set([]); this.columns.set([]); this.error.set('Select a project to load its board.'); return;
    }
    const requestId = ++this.loadRequestId;
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.api.getProjectBoard(selectedProjectId).subscribe({
      next: board => { if (requestId === this.loadRequestId && this.projectId() === selectedProjectId) this.columns.set(board.columns); },
      error: () => { if (requestId === this.loadRequestId) this.error.set('This project\'s Board settings could not be loaded.'); },
    });
    this.api.reconcileProjectWorkflowTasks(selectedProjectId).pipe(
      catchError(() => of(null)),
      switchMap(reconciliation => {
        if (reconciliation && reconciliation.reconciledCount > 0) this.message.set(`${reconciliation.reconciledCount} task${reconciliation.reconciledCount === 1 ? '' : 's'} restored to ${this.label(reconciliation.entryStatus)}.`);
        return this.api.getBacklog(selectedProjectId);
      }),
    ).subscribe({
        next: (result) => {
          if (requestId !== this.loadRequestId || this.projectId() !== selectedProjectId) return;
          this.sprints.set([...result.sprints].sort((a, b) => {
            const rank = (status: string) => status === 'Active' ? 0 : status === 'Planned' ? 1 : 2;
            return rank(a.status) - rank(b.status) || Date.parse(b.createdAt) - Date.parse(a.createdAt);
          }));
          const selectedSprint = result.sprints.find(sprint => sprint.id === this.sprintId())
            ?? result.sprints.find(sprint => sprint.status === 'Active')
            ?? result.sprints.find(sprint => sprint.status === 'Planned');
          this.sprintId.set(selectedSprint?.id ?? '');
          this.setSprintTasks(selectedSprint, result.projectName);
          this.loading.set(false);
        },
        error: () => {
          if (requestId !== this.loadRequestId) return;
          this.loading.set(false);
          this.error.set('Board tasks could not be loaded.');
        },
      });
  }

  clearFilters() {
    this.search.set('');
    this.typeFilter.set('');
    this.load();
  }

  selectProject(projectId: string) { this.projectId.set(projectId); this.sprintId.set(''); this.typeFilter.set(''); this.tasks.set([]); this.load(); }
  selectSprint(sprintId: string) { this.sprintId.set(sprintId); this.typeFilter.set(''); const sprint = this.sprints().find(x => x.id === sprintId); const projectName = this.projects().find(x => x.id === this.projectId())?.name ?? ''; this.setSprintTasks(sprint, projectName); }
  private setSprintTasks(sprint: SprintItem | undefined, projectName: string) {
    const search = this.search().trim().toLowerCase();
    this.tasks.set((sprint?.tasks ?? []).filter(task => !search || task.title.toLowerCase().includes(search) || task.taskNumber.toLowerCase().includes(search)).map(task => ({ ...task, projectName })));
  }

  tasksFor(status: string) {
    return this.visibleTasks().filter((task) => task.status === status);
  }

  startDrag(task: ApiTask, event: DragEvent) {
    if (this.moving() || this.boardReadOnly()) { event.preventDefault(); return; }
    this.draggedTask.set(task);
    this.allowedDropStatuses.set(null);
    this.loadingTransitions.set(true);
    this.error.set('');
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';

    this.api.getTask(task.id).subscribe({
      next: (details) => {
        if (this.draggedTask()?.id !== task.id) return;
        this.allowedDropStatuses.set(details.allowedTransitions);
        this.loadingTransitions.set(false);
      },
      error: () => {
        if (this.draggedTask()?.id !== task.id) return;
        this.allowedDropStatuses.set([]);
        this.loadingTransitions.set(false);
        this.error.set(`Available transitions for ${task.taskNumber} could not be loaded.`);
      },
    });
  }

  isAllowedDrop(status: string) {
    return !this.boardReadOnly() && !!this.draggedTask() && (this.allowedDropStatuses() ?? []).includes(status);
  }

  isInvalidDrop(status: string) {
    return (
      !!this.draggedTask() &&
      !this.loadingTransitions() &&
      this.draggedTask()?.status !== status &&
      !this.isAllowedDrop(status)
    );
  }

  allowDrop(status: string, event: DragEvent) {
    if (!this.isAllowedDrop(status)) {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      return;
    }
    event.preventDefault();
    this.dragTarget.set(status);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  leaveDrop(status: string) {
    if (this.dragTarget() === status) this.dragTarget.set('');
  }

  drop(status: string, event: DragEvent) {
    event.preventDefault();
    const task = this.draggedTask();
    if (!task || !this.isAllowedDrop(status)) return;
    this.dragTarget.set('');
    this.draggedTask.set(null);
    this.allowedDropStatuses.set(null);
    this.loadingTransitions.set(false);
    this.move(task, status);
  }

  endDrag() {
    this.dragTarget.set('');
    this.draggedTask.set(null);
    this.allowedDropStatuses.set(null);
    this.loadingTransitions.set(false);
  }

  move(task: ApiTask, status: string) {
    this.moving.set(true);
    this.error.set('');
    this.message.set('');
    this.api
      .changeTaskStatus(task.id, status, `Moved on board from ${task.status} to ${status}`, true)
      .subscribe({
        next: (updated) => {
          this.tasks.update((tasks) =>
            tasks.map((item) =>
              item.id === task.id ? { ...item, status: updated.status } : item,
            ),
          );
          this.moving.set(false);
          this.message.set(`${task.taskNumber} moved to ${this.label(status)}.`);
        },
        error: (error: HttpErrorResponse) => {
          this.moving.set(false);
          this.error.set(
            error.status === 403
              ? `Your project role cannot move this task to ${this.label(status)}. Required role: ${(error.error?.requiredRoles ?? [])
                  .map((value: string) => this.label(value).replace('Reviewer Tester', 'Reviewer / Tester'))
                  .join(' or ') || 'not configured'}.`
              : error.status === 409
              ? error.error?.message === 'This workflow transition is not allowed.'
                ? `Move not allowed from ${this.label(task.status)}. Valid next statuses: ${(error.error?.allowedTransitions ?? [])
                    .map((value: string) => this.label(value))
                    .join(', ') || 'none'}.`
                : error.error?.message || 'Task movement is not allowed for this sprint.'
              : error.error?.message || 'Task could not be moved.',
          );
        },
      });
  }

  label(value: string) {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace('Uat', 'UAT');
  }

  priorityClass(priority: string) {
    return priority.toLowerCase();
  }
}
