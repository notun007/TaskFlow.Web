import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ProjectListItem, TaskApiService, WorkflowDetails } from '../../task-api.service';

type EditableTransition = { clientId: string; fromStatus: string; toStatus: string; sortOrder: number };

@Component({ selector: 'app-workflows-page', standalone: true, imports: [FormsModule], templateUrl: './workflows.html', styleUrl: './workflows.scss', encapsulation: ViewEncapsulation.None })
export class WorkflowsPage implements OnInit {
  private readonly api = inject(TaskApiService);
  private loadRequestId = 0;
  readonly projects = signal<ProjectListItem[]>([]);
  readonly selectedProjectId = signal('');
  readonly workflow = signal<WorkflowDetails | null>(null);
  readonly name = signal('System default workflow');
  readonly transitions = signal<EditableTransition[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  ngOnInit() {
    this.api.getProjectList().subscribe({ next: projects => this.projects.set(projects) });
    this.load();
  }

  selectProject(id: string) { this.selectedProjectId.set(id ?? ''); this.load(); }

  load() {
    const requestedProjectId = this.selectedProjectId() || null;
    const requestId = ++this.loadRequestId;
    this.loading.set(true); this.error.set(''); this.message.set('');
    this.api.getWorkflow(requestedProjectId).subscribe({
      next: workflow => {
        if (requestId !== this.loadRequestId || (this.selectedProjectId() || null) !== requestedProjectId) return;
        if ((workflow.projectId ?? null) !== requestedProjectId) {
          this.loading.set(false); this.error.set('The API returned a workflow for a different project.'); return;
        }
        this.workflow.set(workflow);
        this.name.set(workflow.isInherited
          ? `${this.projects().find(x => x.id === requestedProjectId)?.name ?? 'Project'} workflow`
          : workflow.name);
        this.transitions.set(workflow.transitions.map(x => ({ clientId: x.id || crypto.randomUUID(), fromStatus: x.fromStatus, toStatus: x.toStatus, sortOrder: x.sortOrder })));
        this.loading.set(false);
      },
      error: () => { if (requestId === this.loadRequestId) { this.loading.set(false); this.error.set('Workflow could not be loaded.'); } }
    });
  }

  addTransition() { const statuses = this.workflow()?.statuses ?? []; if (statuses.length < 2) return; this.transitions.update(items => [...items, { clientId: crypto.randomUUID(), fromStatus: statuses[0], toStatus: statuses[1], sortOrder: (items.at(-1)?.sortOrder ?? 0) + 10 }]); }
  updateTransition(index: number, field: 'fromStatus' | 'toStatus', value: string) { this.transitions.update(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item)); }
  updateSortOrder(index: number, value: number) { this.transitions.update(items => items.map((item, i) => i === index ? { ...item, sortOrder: value } : item)); }
  removeTransition(index: number) { this.transitions.update(items => items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sortOrder: (i + 1) * 10 }))); this.message.set('Transition removed. Save to apply this change.'); }

  save() {
    const transitions = this.transitions();
    if (!transitions.length) { this.error.set('Add at least one transition.'); return; }
    const selfTransition = transitions.find(x => x.fromStatus === x.toStatus);
    if (selfTransition) { this.error.set(`${selfTransition.fromStatus} cannot transition to itself.`); return; }
    const keys = transitions.map(x => `${x.fromStatus}|${x.toStatus}`);
    if (new Set(keys).size !== keys.length) { this.error.set('Remove duplicate workflow transitions before saving.'); return; }
    const projectId = this.selectedProjectId();
    if (!projectId && !window.confirm('This changes the system fallback workflow for projects without a custom workflow. Continue?')) return;
    this.saving.set(true); this.error.set(''); this.message.set('');
    const request = { name: this.name().trim() || 'Workflow', transitions: transitions.map(({ fromStatus, toStatus, sortOrder }) => ({ fromStatus, toStatus, sortOrder })) };
    this.api.saveWorkflow(projectId || null, request).subscribe({
      next: workflow => {
        if ((workflow.projectId ?? null) !== (projectId || null) || (projectId && workflow.isInherited)) { this.saving.set(false); this.error.set('The saved workflow did not match the selected project.'); return; }
        this.workflow.set(workflow); this.transitions.set(workflow.transitions.map(x => ({ clientId: x.id || crypto.randomUUID(), fromStatus: x.fromStatus, toStatus: x.toStatus, sortOrder: x.sortOrder })));
        this.saving.set(false); this.message.set('Project workflow saved. Tasks in removed statuses were moved to the workflow entry stage, and Board transitions now use this workflow.');
      },
      error: (error: HttpErrorResponse) => { this.saving.set(false); this.error.set(error.error?.message || error.error?.detail || error.error?.title || 'Workflow could not be saved.'); }
    });
  }

  reset() {
    const projectId = this.selectedProjectId(); if (!projectId) return;
    if (!window.confirm('Remove this project workflow and restore the system default?')) return;
    this.saving.set(true);
    this.api.resetWorkflow(projectId).subscribe({ next: () => { this.saving.set(false); this.message.set('Project workflow reset to the system default.'); this.load(); }, error: () => { this.saving.set(false); this.error.set('Workflow could not be reset.'); } });
  }
}
