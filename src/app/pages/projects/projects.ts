import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskFlowFacade } from '../../task-flow.facade';
import { BoardColumnItem, TaskApiService } from '../../task-api.service';
import { ProjectAccessUser } from '../../task-api.service';
import { AuthService } from '../../auth.service';

@Component({ selector: 'app-projects-page', standalone: true, imports: [DatePipe, FormsModule], templateUrl: './projects.html', styleUrl: './projects.scss', encapsulation: ViewEncapsulation.None })
export class ProjectsPage {
  readonly workspace = inject(TaskFlowFacade);
  private readonly api = inject(TaskApiService);
  private readonly auth = inject(AuthService);
  readonly detailTab = signal<'details' | 'board' | 'access'>('details');
  readonly boardColumns = signal<BoardColumnItem[]>([]);
  readonly boardLoading = signal(false);
  readonly boardSaving = signal(false);
  readonly boardMessage = signal('');
  readonly boardError = signal('');
  readonly accessUsers = signal<ProjectAccessUser[]>([]);
  readonly accessLoading = signal(false);
  readonly accessSaving = signal(false);
  readonly accessMessage = signal('');
  readonly accessError = signal('');
  readonly accessUserId = signal('');
  readonly accessRole = signal('Requester');
  readonly projectRoles = [
    { value: 'Requester', label: 'Requester' },
    { value: 'ProductOwner', label: 'Product Owner' },
    { value: 'TeamLead', label: 'Team Lead' },
    { value: 'TeamMember', label: 'Team Member' },
    { value: 'ReviewerTester', label: 'Reviewer / Tester' },
    { value: 'ProjectAdmin', label: 'Project Admin' }
  ];
  readonly canManageAccess = () => this.auth.currentUser()?.roles.includes('Administrator') ?? false;

  openBoardSettings(projectId: string) {
    this.detailTab.set('board'); this.boardLoading.set(true); this.boardError.set(''); this.boardMessage.set('');
    this.api.getProjectBoard(projectId).subscribe({ next: board => { this.boardColumns.set(board.columns); this.boardLoading.set(false); }, error: () => { this.boardLoading.set(false); this.boardError.set('Board settings could not be loaded.'); } });
  }
  updateColumn(index: number, field: 'name' | 'wipLimit', value: string) { this.boardColumns.update(items => items.map((item, i) => i === index ? { ...item, [field]: field === 'wipLimit' ? (value ? Number(value) : null) : value } : item)); }
  moveColumn(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= this.boardColumns().length) return; this.boardColumns.update(items => { const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy.map((item, i) => ({ ...item, sortOrder: (i + 1) * 10 })); }); }
  saveBoard(projectId: string) { this.boardSaving.set(true); this.boardError.set(''); this.boardMessage.set(''); const columns = this.boardColumns().map(({ name, status, sortOrder, wipLimit, isDefaultDestination }) => ({ name, status, sortOrder, wipLimit: wipLimit ?? null, isDefaultDestination })); this.api.saveProjectBoard(projectId, { columns }).subscribe({ next: board => { this.boardColumns.set(board.columns); this.boardSaving.set(false); this.boardMessage.set('Board settings saved.'); }, error: error => { this.boardSaving.set(false); this.boardError.set(error.error?.message || 'Board settings could not be saved.'); } }); }
  openAccess(projectId: string) { this.detailTab.set('access'); this.loadAccess(projectId); }
  loadAccess(projectId: string) { this.accessLoading.set(true); this.accessError.set(''); this.api.getProjectAccess(projectId).subscribe({ next: users => { this.accessUsers.set(users); this.accessLoading.set(false); if (!this.accessUserId() && users.length) this.accessUserId.set(users[0].id); }, error: () => { this.accessLoading.set(false); this.accessError.set('Project access could not be loaded.'); } }); }
  addRole(projectId: string) { if (!this.accessUserId()) return; this.accessSaving.set(true); this.accessError.set(''); this.accessMessage.set(''); this.api.addProjectRole(projectId, this.accessUserId(), this.accessRole()).subscribe({ next: () => { this.accessSaving.set(false); this.accessMessage.set('Project role assigned.'); this.loadAccess(projectId); }, error: error => { this.accessSaving.set(false); this.accessError.set(error.status === 403 ? 'Only a system Administrator can manage project roles.' : error.error?.message || 'Project role could not be assigned.'); } }); }
  removeRole(projectId: string, userId: string, role: string) { this.accessSaving.set(true); this.accessError.set(''); this.accessMessage.set(''); this.api.removeProjectRole(projectId, userId, role).subscribe({ next: () => { this.accessSaving.set(false); this.accessMessage.set('Project role removed.'); this.loadAccess(projectId); }, error: error => { this.accessSaving.set(false); this.accessError.set(error.status === 403 ? 'Only a system Administrator can manage project roles.' : error.error?.message || 'Project role could not be removed.'); } }); }
  roleLabel(value: string) { return this.projectRoles.find(role => role.value === value)?.label || value; }
}
