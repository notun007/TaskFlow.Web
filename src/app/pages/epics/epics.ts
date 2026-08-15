import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EpicListItem, ReferenceItem, SaveEpicRequest, TaskApiService } from '../../task-api.service';

@Component({ selector: 'app-epics-page', standalone: true, templateUrl: './epics.html', styleUrl: './epics.scss' })
export class EpicsPage implements OnInit {
  private readonly api = inject(TaskApiService);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  readonly projects = signal<ReferenceItem[]>([]); readonly projectId = signal(''); readonly epics = signal<EpicListItem[]>([]);
  readonly loading = signal(false); readonly saving = signal(false); readonly error = signal(''); readonly message = signal('');
  readonly showEditor = signal(false); readonly editingId = signal<string | null>(null); readonly name = signal(''); readonly description = signal(''); readonly targetDate = signal(''); readonly editorProjectId = signal('');
  ngOnInit() { this.api.getProjects().subscribe({ next: projects => { this.projects.set(projects); if (projects.length) this.selectProject(projects[0].id); }, error: () => this.error.set('Projects could not be loaded.') }); }
  selectProject(id: string) { this.projectId.set(id); this.load(); }
  load() { this.loading.set(true); this.error.set(''); this.api.getEpics(this.projectId() || undefined).subscribe({ next: items => { this.epics.set(items); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set('Epics could not be loaded.'); } }); }
  openCreate() { this.editingId.set(null); this.name.set(''); this.description.set(''); this.targetDate.set(''); this.editorProjectId.set(this.projectId()); this.showEditor.set(true); }
  openEdit(epic: EpicListItem) { this.editingId.set(epic.id); this.name.set(epic.name); this.description.set(epic.description ?? ''); this.targetDate.set(epic.targetDate ?? ''); this.editorProjectId.set(epic.projectId); this.showEditor.set(true); }
  save() { if (!this.name().trim() || !this.editorProjectId()) { this.error.set('Project and Epic name are required.'); return; } const request: SaveEpicRequest = { name: this.name().trim(), description: this.description().trim() || null, projectId: this.editorProjectId(), targetDate: this.targetDate() || null }; this.saving.set(true); const call = this.editingId() ? this.api.updateEpic(this.editingId()!, request) : this.api.createEpic(request); call.subscribe({ next: () => { this.saving.set(false); this.showEditor.set(false); this.showSuccess(this.editingId() ? 'Epic updated successfully.' : 'Epic created successfully.'); this.projectId.set(request.projectId); this.load(); }, error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e.error?.message || 'Epic could not be saved. Check your project role.'); } }); }
  changeStatus(epic: EpicListItem, status: string) { const incomplete = epic.totalItems - epic.completedItems; if (status === 'Completed' && incomplete > 0 && !confirm(`${incomplete} child item(s) are unfinished. Complete this Epic anyway?`)) return; this.api.changeEpicStatus(epic.id, status).subscribe({ next: () => { this.showSuccess(`Epic marked ${status}.`); this.load(); }, error: (e: HttpErrorResponse) => this.error.set(e.error?.message || 'Epic status could not be changed.') }); }
  dismissToast() { this.message.set(''); this.error.set(''); if (this.toastTimer) clearTimeout(this.toastTimer); this.toastTimer = null; }
  private showSuccess(message: string) { this.dismissToast(); this.message.set(message); this.toastTimer = setTimeout(() => this.dismissToast(), 4000); }
}
