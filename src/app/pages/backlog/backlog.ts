import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { BacklogDetails, ReferenceItem, SaveSprintRequest, SprintItem, SprintTaskItem, TaskApiService } from '../../task-api.service';

@Component({ selector: 'app-backlog-page', standalone: true, imports: [DatePipe], templateUrl: './backlog.html', styleUrl: './backlog.scss', encapsulation: ViewEncapsulation.None })
export class BacklogPage implements OnInit {
  private readonly api = inject(TaskApiService);
  readonly projects = signal<ReferenceItem[]>([]); readonly projectId = signal(''); readonly data = signal<BacklogDetails | null>(null); readonly loading = signal(false); readonly saving = signal(false); readonly error = signal(''); readonly message = signal('');
  readonly showEditor = signal(false); readonly editingId = signal<string | null>(null); readonly sprintName = signal(''); readonly sprintGoal = signal(''); readonly sprintStart = signal(''); readonly sprintEnd = signal(''); readonly draggedTask = signal<SprintTaskItem | null>(null); readonly dropTarget = signal('');
  ngOnInit() { this.api.getProjects().subscribe({ next: projects => { this.projects.set(projects); if (projects.length) { this.projectId.set(projects[0].id); this.load(); } } }); }
  selectProject(id: string) { this.projectId.set(id); this.data.set(null); if (id) this.load(); }
  load() { if (!this.projectId()) return; this.loading.set(true); this.error.set(''); this.api.getBacklog(this.projectId()).subscribe({ next: data => { this.data.set(data); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set('Backlog could not be loaded.'); } }); }
  openCreate() { this.editingId.set(null); this.sprintName.set(`Sprint ${(this.data()?.sprints.length ?? 0) + 1}`); this.sprintGoal.set(''); this.sprintStart.set(''); this.sprintEnd.set(''); this.error.set(''); this.showEditor.set(true); }
  openEdit(sprint: SprintItem) { this.editingId.set(sprint.id); this.sprintName.set(sprint.name); this.sprintGoal.set(sprint.goal ?? ''); this.sprintStart.set(sprint.startDate ?? ''); this.sprintEnd.set(sprint.endDate ?? ''); this.error.set(''); this.showEditor.set(true); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }
  saveSprint() { if (!this.sprintName().trim()) { this.error.set('Sprint name is required.'); return; } const request: SaveSprintRequest = { name: this.sprintName().trim(), goal: this.sprintGoal().trim() || null, projectId: this.projectId(), startDate: this.sprintStart() || null, endDate: this.sprintEnd() || null }; this.saving.set(true); this.error.set(''); const call = this.editingId() ? this.api.updateSprint(this.editingId()!, request) : this.api.createSprint(request); call.subscribe({ next: () => { this.saving.set(false); this.showEditor.set(false); this.message.set(this.editingId() ? 'Sprint updated.' : 'Sprint created.'); this.load(); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.error.set(error.error?.message || 'Sprint could not be saved.'); } }); }
  start(sprint: SprintItem) { this.saving.set(true); this.error.set(''); this.api.startSprint(sprint.id).subscribe({ next: () => { this.saving.set(false); this.message.set(`${sprint.name} started.`); this.load(); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.error.set(error.error?.message || 'Sprint could not be started.'); } }); }
  complete(sprint: SprintItem) { this.saving.set(true); this.error.set(''); this.api.completeSprint(sprint.id).subscribe({ next: () => { this.saving.set(false); this.message.set(`${sprint.name} completed. Unfinished tasks returned to the backlog.`); this.load(); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.error.set(error.error?.message || 'Sprint could not be completed.'); } }); }
  startDrag(task: SprintTaskItem, event: DragEvent) { this.draggedTask.set(task); event.dataTransfer?.setData('text/plain', task.id); }
  allowDrop(target: string, event: DragEvent) { event.preventDefault(); this.dropTarget.set(target); }
  endDrag() { this.draggedTask.set(null); this.dropTarget.set(''); }
  drop(sprintId: string | null, event: DragEvent) { event.preventDefault(); const task = this.draggedTask(); this.endDrag(); if (!task) return; this.saving.set(true); this.api.assignTaskToSprint(task.id, sprintId).subscribe({ next: () => { this.saving.set(false); this.message.set(sprintId ? `${task.taskNumber} assigned to sprint.` : `${task.taskNumber} moved to backlog.`); this.load(); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.error.set(error.error?.message || 'Task could not be moved.'); } }); }
  activeSprintExists() { return this.data()?.sprints.some(x => x.status === 'Active') ?? false; }
}
