import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EpicListItem, FeatureListItem, ReferenceItem, SaveFeatureRequest, TaskApiService } from '../../task-api.service';

@Component({ selector: 'app-features-page', standalone: true, templateUrl: './features.html', styleUrl: './features.scss' })
export class FeaturesPage implements OnInit {
  private readonly api = inject(TaskApiService);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  readonly projects = signal<ReferenceItem[]>([]); readonly epics = signal<EpicListItem[]>([]); readonly features = signal<FeatureListItem[]>([]);
  readonly projectId = signal(''); readonly epicId = signal(''); readonly loading = signal(false); readonly saving = signal(false); readonly error = signal(''); readonly message = signal('');
  readonly showEditor = signal(false); readonly editingId = signal<string | null>(null); readonly name = signal(''); readonly description = signal(''); readonly targetDate = signal(''); readonly editorProjectId = signal(''); readonly editorEpicId = signal('');
  readonly activeEpics = computed(() => this.epics().filter(x => x.projectId === this.editorProjectId() && x.status === 'Active'));

  ngOnInit() { this.api.getProjects().subscribe({ next: projects => { this.projects.set(projects); if (projects.length) this.selectProject(projects[0].id); }, error: () => this.error.set('Projects could not be loaded.') }); }
  selectProject(id: string, selectedEpicId = '') { this.projectId.set(id); this.epicId.set(selectedEpicId); this.api.getEpics(id).subscribe({ next: epics => { this.epics.set(epics); this.load(); }, error: () => this.error.set('Epics could not be loaded.') }); }
  selectEpic(id: string) { this.epicId.set(id); this.load(); }
  load() { if (!this.projectId()) return; this.loading.set(true); this.error.set(''); this.api.getFeatures(this.projectId(), this.epicId() || undefined).subscribe({ next: items => { this.features.set(items); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set('Features could not be loaded.'); } }); }
  openCreate() { this.editingId.set(null); this.name.set(''); this.description.set(''); this.targetDate.set(''); this.editorProjectId.set(this.projectId()); this.editorEpicId.set(this.epicId() || this.activeEpics()[0]?.id || ''); this.showEditor.set(true); }
  openEdit(feature: FeatureListItem) { this.editingId.set(feature.id); this.name.set(feature.name); this.description.set(feature.description ?? ''); this.targetDate.set(feature.targetDate ?? ''); this.editorProjectId.set(feature.projectId); this.editorEpicId.set(feature.epicId); this.showEditor.set(true); }
  changeEditorProject(id: string) { this.editorProjectId.set(id); this.editorEpicId.set(''); this.api.getEpics(id).subscribe({ next: epics => this.epics.set(epics), error: () => this.error.set('Epics could not be loaded.') }); }
  save() { if (!this.name().trim() || !this.editorProjectId() || !this.editorEpicId()) { this.error.set('Project, Epic, and Feature name are required.'); return; } const request: SaveFeatureRequest = { name: this.name().trim(), description: this.description().trim() || null, projectId: this.editorProjectId(), epicId: this.editorEpicId(), targetDate: this.targetDate() || null }; this.saving.set(true); const updating = !!this.editingId(); const call = updating ? this.api.updateFeature(this.editingId()!, request) : this.api.createFeature(request); call.subscribe({ next: () => { this.saving.set(false); this.showEditor.set(false); this.showSuccess(updating ? 'Feature updated successfully.' : 'Feature created successfully.'); this.selectProject(request.projectId, request.epicId); }, error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e.error?.message || 'Feature could not be saved. Check your project role.'); } }); }
  changeStatus(feature: FeatureListItem, status: string) { const incomplete = feature.totalItems - feature.completedItems; if (status === 'Completed' && incomplete > 0 && !confirm(`${incomplete} child task(s) are unfinished. Complete this Feature anyway?`)) return; this.api.changeFeatureStatus(feature.id, status).subscribe({ next: () => { this.showSuccess(`Feature marked ${status}.`); this.load(); }, error: (e: HttpErrorResponse) => this.error.set(e.error?.message || 'Feature status could not be changed.') }); }
  dismissToast() { this.message.set(''); this.error.set(''); if (this.toastTimer) clearTimeout(this.toastTimer); this.toastTimer = null; }
  private showSuccess(message: string) { this.dismissToast(); this.message.set(message); this.toastTimer = setTimeout(() => this.dismissToast(), 4000); }
}
