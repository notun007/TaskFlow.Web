import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskFlowFacade } from '../../task-flow.facade';
import { ReferenceItem, TaskApiService, TeamListItem } from '../../task-api.service';

@Component({ selector: 'app-teams-page', standalone: true, templateUrl: './teams.html', styleUrl: './teams.scss', encapsulation: ViewEncapsulation.None })
export class TeamsPage implements OnInit {
  readonly workspace = inject(TaskFlowFacade);
  private readonly api = inject(TaskApiService);
  readonly departments = signal<ReferenceItem[]>([]);
  readonly showEditor = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly departmentId = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');

  ngOnInit() { this.api.getDepartments().subscribe({ next: items => { this.departments.set(items); if (!this.departmentId() && items.length) this.departmentId.set(items[0].id); }, error: () => this.saveError.set('Departments could not be loaded.') }); }
  openCreate() { this.editingId.set(null); this.name.set(''); this.departmentId.set(this.departments()[0]?.id ?? ''); this.saveError.set(''); this.showEditor.set(true); }
  openEdit(item: TeamListItem) { this.editingId.set(item.id); this.name.set(item.name); this.departmentId.set(item.departmentId); this.saveError.set(''); this.showEditor.set(true); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }
  save() {
    if (!this.name().trim()) { this.saveError.set('Team name is required.'); return; }
    if (!this.departmentId()) { this.saveError.set('Select a department.'); return; }
    this.saving.set(true); this.saveError.set('');
    const request = { name: this.name().trim(), departmentId: this.departmentId() };
    const call = this.editingId() ? this.api.updateTeam(this.editingId()!, request) : this.api.createTeam(request);
    call.subscribe({ next: saved => { this.workspace.teamRecords.update(items => [...items.filter(item => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name))); this.workspace.selectedTeam.set(saved); this.saving.set(false); this.showEditor.set(false); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.saveError.set(error.error?.message || 'Team could not be saved.'); } });
  }
}
