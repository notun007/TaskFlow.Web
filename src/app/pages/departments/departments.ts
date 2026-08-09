import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DepartmentListItem, TaskApiService } from '../../task-api.service';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-departments-page', standalone: true, templateUrl: './departments.html', styleUrl: './departments.scss', encapsulation: ViewEncapsulation.None })
export class DepartmentsPage {
  readonly workspace = inject(TaskFlowFacade);
  private readonly api = inject(TaskApiService);
  readonly showEditor = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly description = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');

  openCreate() { this.editingId.set(null); this.name.set(''); this.description.set(''); this.saveError.set(''); this.showEditor.set(true); }
  openEdit(item: DepartmentListItem) { this.editingId.set(item.id); this.name.set(item.name); this.description.set(item.description ?? ''); this.saveError.set(''); this.showEditor.set(true); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }
  save() {
    if (!this.name().trim()) { this.saveError.set('Department name is required.'); return; }
    this.saving.set(true); this.saveError.set('');
    const request = { name: this.name().trim(), description: this.description().trim() || null };
    const call = this.editingId() ? this.api.updateDepartment(this.editingId()!, request) : this.api.createDepartment(request);
    call.subscribe({ next: saved => { this.workspace.departmentRecords.update(items => [...items.filter(item => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name))); this.workspace.selectedDepartment.set(saved); this.saving.set(false); this.showEditor.set(false); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.saveError.set(error.error?.message || 'Department could not be saved.'); } });
  }
}
