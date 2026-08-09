import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskApiService, WorkflowDetails, WorkItemTypeListItem } from '../../task-api.service';

type EditableTransition = { fromStatus: string; toStatus: string; sortOrder: number };

@Component({ selector: 'app-workflows-page', standalone: true, templateUrl: './workflows.html', styleUrl: './workflows.scss', encapsulation: ViewEncapsulation.None })
export class WorkflowsPage implements OnInit {
  private readonly api = inject(TaskApiService);
  readonly workItemTypes = signal<WorkItemTypeListItem[]>([]); readonly selectedTypeId = signal(''); readonly workflow = signal<WorkflowDetails | null>(null);
  readonly name = signal('Default workflow'); readonly transitions = signal<EditableTransition[]>([]); readonly loading = signal(false); readonly saving = signal(false); readonly message = signal(''); readonly error = signal('');
  ngOnInit() { this.api.getWorkItemTypes().subscribe({ next: types => this.workItemTypes.set(types.filter(x => x.isActive)) }); this.load(); }
  selectType(id: string) { this.selectedTypeId.set(id); this.load(); }
  load() { this.loading.set(true); this.error.set(''); this.message.set(''); this.api.getWorkflow(this.selectedTypeId() || null).subscribe({ next: workflow => { this.workflow.set(workflow); this.name.set(workflow.isInherited ? `${this.workItemTypes().find(x => x.id === this.selectedTypeId())?.name ?? 'Work item'} workflow` : workflow.name); this.transitions.set(workflow.transitions.map(x => ({ fromStatus: x.fromStatus, toStatus: x.toStatus, sortOrder: x.sortOrder }))); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set('Workflow could not be loaded.'); } }); }
  addTransition() { const statuses = this.workflow()?.statuses ?? []; if (statuses.length < 2) return; this.transitions.update(items => [...items, { fromStatus: statuses[0], toStatus: statuses[1], sortOrder: (items.at(-1)?.sortOrder ?? 0) + 10 }]); }
  updateTransition(index: number, field: 'fromStatus' | 'toStatus', value: string) { this.transitions.update(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item)); }
  updateSortOrder(index: number, value: number) { this.transitions.update(items => items.map((item, i) => i === index ? { ...item, sortOrder: value } : item)); }
  removeTransition(index: number) { this.transitions.update(items => items.filter((_, i) => i !== index)); }
  save() { if (!this.transitions().length) { this.error.set('Add at least one transition.'); return; } this.saving.set(true); this.error.set(''); this.message.set(''); this.api.saveWorkflow(this.selectedTypeId() || null, { name: this.name().trim() || 'Workflow', transitions: this.transitions() }).subscribe({ next: workflow => { this.workflow.set(workflow); this.transitions.set(workflow.transitions); this.saving.set(false); this.message.set('Workflow saved. New task transitions use this configuration immediately.'); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.error.set(error.error?.message || 'Workflow could not be saved.'); } }); }
  reset() { const id = this.selectedTypeId(); if (!id) return; this.saving.set(true); this.api.resetWorkflow(id).subscribe({ next: () => { this.saving.set(false); this.message.set('Workflow reset to the inherited default.'); this.load(); }, error: () => { this.saving.set(false); this.error.set('Workflow could not be reset.'); } }); }
}
