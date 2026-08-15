import { computed, inject, Injectable, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiTask, ApiTaskDetails, ApplicableCustomField, AuditListItem, DepartmentListItem, EpicListItem, FeatureListItem, ProjectDetails, ProjectListItem, ReferenceItem, SaveTaskCustomFieldValue, SoftwareListItem, SprintItem, TaskApiService, TeamListItem, VendorListItem, WorkItemTypeReference } from './task-api.service';
import { environment } from '../environments/environment';

type Task = { apiId: string; id: string; title: string; project: string; epicId: string | null; epicName: string | null; featureId: string | null; featureName: string | null; software: string; owner: string; status: string; priority: string; due: string; dueDateIso: string | null; severity: string };

@Injectable()
export class TaskFlowFacade implements OnInit {
  private readonly taskApi = inject(TaskApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly today = new Date();
  readonly activeNav = signal('Dashboard');
  readonly search = signal('');
  readonly showCreate = signal(false);
  readonly showLogin = signal(false);
  readonly showProjectSetup = signal(false);
  readonly showChangePassword = signal(false);
  readonly showResetPassword = signal(false);
  readonly projects = signal<ReferenceItem[]>([]);
  readonly workItemTypes = signal<WorkItemTypeReference[]>([]);
  readonly taskTitle = signal('');
  readonly taskDescription = signal('');
  readonly taskProjectId = signal('');
  readonly taskEpicId = signal('');
  readonly taskFeatureId = signal('');
  readonly taskSoftwareApplicationId = signal('');
  readonly epics = signal<EpicListItem[]>([]);
  readonly features = signal<FeatureListItem[]>([]);
  readonly createEpics = computed(() => this.epics().filter(x => x.projectId === this.taskProjectId() && x.status === 'Active'));
  readonly createFeatures = computed(() => this.features().filter(x => x.projectId === this.taskProjectId() && (!this.taskEpicId() || x.epicId === this.taskEpicId()) && x.status === 'Active'));
  readonly taskType = signal('Bug');
  readonly taskPriority = signal('Medium');
  readonly taskSeverity = signal('Medium');
  readonly taskDueDate = signal('');
  readonly createCustomFields = signal<ApplicableCustomField[]>([]);
  readonly hasRequiredCreateFields = computed(() => this.createCustomFields().some(field => field.isRequired));
  readonly createCustomFieldValues = signal<Record<string, string | string[]>>({});
  readonly createError = signal('');
  readonly creatingTask = signal(false);
  readonly taskCreateSuccess = signal('');
  readonly taskCreateSuccessTitle = signal('Task saved');
  readonly loginEmail = signal('');
  readonly loginPassword = signal('');
  readonly loginConfirmPassword = signal('');
  readonly loginDisplayName = signal('');
  readonly registering = signal(false);
  readonly loginError = signal('');
  readonly loggingIn = signal(false);
  readonly projectName = signal('');
  readonly projectKey = signal('');
  readonly projectObjectives = signal('');
  readonly projectError = signal('');
  readonly creatingProject = signal(false);
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly passwordMessage = signal('');
  readonly passwordError = signal('');
  readonly savingPassword = signal(false);
  readonly resetEmail = signal('');
  readonly resetToken = signal('');
  readonly resetRequested = signal(false);
  readonly tasks = signal<Task[]>([]);
  readonly dashboardTasks = signal<Task[]>([]);
  readonly loadingDashboard = signal(false);
  readonly dashboardError = signal('');
  readonly loadingTasks = signal(true);
  readonly taskLoadError = signal('');
  readonly taskStatusFilter = signal('');
  readonly taskPriorityFilter = signal('');
  readonly taskProjectFilter = signal('');
  readonly taskEpicFilter = signal('');
  readonly taskFeatureFilter = signal('');
  readonly taskFilterEpics = computed(() => this.epics().filter(epic => !this.taskProjectFilter() || epic.projectId === this.taskProjectFilter()));
  readonly taskFilterFeatures = computed(() => this.features().filter(feature => (!this.taskProjectFilter() || feature.projectId === this.taskProjectFilter()) && (!this.taskEpicFilter() || this.taskEpicFilter().startsWith('__') || feature.epicId === this.taskEpicFilter())));
  readonly taskSort = signal('dueDate:asc');
  readonly taskPage = signal(1);
  readonly taskPageSize = signal(10);
  readonly taskTotal = signal(0);
  readonly selectedTask = signal<ApiTaskDetails | null>(null);
  readonly loadingTaskDetails = signal(false);
  readonly taskDetailsError = signal('');
  readonly savingTaskStatus = signal(false);
  readonly transitionComment = signal('');
  readonly newComment = signal('');
  readonly postingComment = signal(false);
  readonly commentError = signal('');
  readonly commentSuccess = signal('');
  readonly showEditTask = signal(false);
  readonly editTaskTitle = signal('');
  readonly editTaskDescription = signal('');
  readonly editTaskProjectId = signal('');
  readonly editTaskEpicId = signal('');
  readonly editTaskFeatureId = signal('');
  readonly editEpics = computed(() => this.epics().filter(x => x.projectId === this.editTaskProjectId() && x.status === 'Active'));
  readonly editFeatures = computed(() => this.features().filter(x => x.projectId === this.editTaskProjectId() && (!this.editTaskEpicId() || x.epicId === this.editTaskEpicId()) && x.status === 'Active'));
  readonly editTaskType = signal('Bug');
  readonly editTaskPriority = signal('Medium');
  readonly editTaskDueDate = signal('');
  readonly editCustomFields = signal<ApplicableCustomField[]>([]);
  readonly editCustomFieldValues = signal<Record<string, string | string[]>>({});
  readonly savingTaskEdit = signal(false);
  readonly taskEditError = signal('');
  readonly showSubtaskEditor = signal(false);
  readonly subtaskTitle = signal('');
  readonly subtaskDescription = signal('');
  readonly subtaskType = signal('Task');
  readonly subtaskPriority = signal('Medium');
  readonly subtaskSeverity = signal('Medium');
  readonly subtaskDueDate = signal('');
  readonly subtaskSprintId = signal('');
  readonly subtaskSprints = signal<SprintItem[]>([]);
  readonly subtaskCustomFields = signal<ApplicableCustomField[]>([]);
  readonly hasRequiredSubtaskFields = computed(() => this.subtaskCustomFields().some(field => field.isRequired));
  readonly subtaskCustomFieldValues = signal<Record<string, string | string[]>>({});
  readonly savingSubtask = signal(false);
  readonly subtaskError = signal('');
  readonly assignmentResponsibility = signal('Assignee');
  readonly assignmentPartyReference = signal('');
  readonly assignmentDisplayName = signal('');
  readonly showAssignmentModal = signal(false);
  readonly savingAssignment = signal(false);
  readonly assignmentError = signal('');
  readonly linkType = signal('Blocks');
  readonly linkTaskReference = signal('');
  readonly savingLink = signal(false);
  readonly linkError = signal('');
  readonly uploadingAttachment = signal(false);
  readonly attachmentError = signal('');
  readonly previewingAttachmentId = signal<string | null>(null);
  readonly attachmentPreviewId = signal<string | null>(null);
  readonly attachmentPreviewUrl = signal<string | null>(null);
  readonly attachmentPreviewName = signal('');
  readonly projectRecords = signal<ProjectListItem[]>([]);
  readonly selectedProject = signal<ProjectDetails | null>(null);
  readonly projectSearch = signal('');
  readonly projectStatusFilter = signal('');
  readonly loadingProjects = signal(false);
  readonly projectListError = signal('');
  readonly softwareApplications = signal<ReferenceItem[]>([]);
  readonly showEditProject = signal(false);
  readonly showArchiveProject = signal(false);
  readonly projectEditName = signal('');
  readonly projectEditKey = signal('');
  readonly projectEditObjectives = signal('');
  readonly projectEditStatus = signal('Active');
  readonly projectEditStartDate = signal('');
  readonly projectEditTargetDate = signal('');
  readonly projectEditManager = signal('');
  readonly projectEditSponsor = signal('');
  readonly projectEditSoftwareId = signal('');
  readonly savingProjectEdit = signal(false);
  readonly projectEditError = signal('');
  readonly archivingProject = signal(false);
  readonly softwareRecords = signal<SoftwareListItem[]>([]);
  readonly teamRecords = signal<TeamListItem[]>([]);
  readonly departmentRecords = signal<DepartmentListItem[]>([]);
  readonly vendorRecords = signal<VendorListItem[]>([]);
  readonly auditRecords = signal<AuditListItem[]>([]);
  readonly operationalSearch = signal('');
  readonly selectedSoftware = signal<SoftwareListItem | null>(null);
  readonly selectedTeam = signal<TeamListItem | null>(null);
  readonly selectedDepartment = signal<DepartmentListItem | null>(null);
  readonly selectedVendor = signal<VendorListItem | null>(null);
  readonly loadingOperations = signal(false);
  readonly operationsError = signal('');
  readonly taskStatuses = ['Submitted', 'Triaged', 'Approved', 'Assigned', 'InProgress', 'PendingInformation', 'PendingVendor', 'ReadyForTesting', 'Uat', 'Resolved', 'Closed', 'Rejected', 'Cancelled', 'Reopened'];
  readonly filteredTasks = computed(() => this.tasks());
  readonly dashboardPreview = computed(() => this.dashboardTasks().slice(0, 8));
  readonly displayedTasks = computed(() => this.activeNav() === 'Dashboard' ? this.dashboardPreview() : this.filteredTasks());
  readonly displayedTaskTotal = computed(() => this.activeNav() === 'Dashboard' ? this.dashboardTasks().length : this.taskTotal());
  readonly dashboardSummary = computed(() => {
    const tasks = this.dashboardTasks();
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const closed = new Set(['Resolved', 'Closed', 'Rejected', 'Cancelled']);
    const open = tasks.filter(task => !closed.has(task.status));
    const withDueDate = open.filter(task => task.dueDateIso).map(task => ({ task, due: new Date(task.dueDateIso!) }));
    return {
      open: open.length,
      dueThisWeek: withDueDate.filter(item => item.due >= startToday && item.due < endOfWeek).length,
      overdue: withDueDate.filter(item => item.due < startToday).length,
      awaitingApproval: open.filter(task => ['Submitted', 'Triaged', 'Ready For Testing', 'UAT'].includes(task.status)).length
    };
  });
  readonly dashboardWorkload = computed(() => {
    const tasks = this.dashboardTasks();
    const groups = [
      { label: 'In progress', statuses: ['Assigned', 'In Progress'], tone: 'blue' },
      { label: 'In review', statuses: ['Submitted', 'Triaged', 'Approved', 'Ready For Testing', 'UAT'], tone: 'light-blue' },
      { label: 'Waiting', statuses: ['Pending Information', 'Pending Vendor'], tone: 'amber' },
      { label: 'Blocked', statuses: ['Rejected', 'Reopened'], tone: 'red' },
      { label: 'Completed', statuses: ['Resolved', 'Closed', 'Cancelled'], tone: 'green' }
    ];
    return groups.map(group => {
      const count = tasks.filter(task => group.statuses.includes(task.status)).length;
      return { ...group, count, percent: tasks.length ? Math.round(count * 100 / tasks.length) : 0 };
    });
  });
  readonly taskPageCount = computed(() => Math.max(1, Math.ceil(this.taskTotal() / this.taskPageSize())));
  readonly filteredProjects = computed(() => {
    const term = this.projectSearch().trim().toLowerCase();
    const status = this.projectStatusFilter();
    return this.projectRecords().filter(project =>
      (!term || `${project.name} ${project.projectKey || ''} ${project.projectManager || ''}`.toLowerCase().includes(term)) &&
      (!status || project.status === status));
  });
  readonly filteredSoftware = computed(() => this.filterOperational(this.softwareRecords(), item => `${item.name} ${item.businessOwner || ''} ${item.technology || ''}`));
  readonly filteredTeams = computed(() => this.filterOperational(this.teamRecords(), item => `${item.name} ${item.department}`));
  readonly filteredDepartments = computed(() => this.filterOperational(this.departmentRecords(), item => `${item.name} ${item.description || ''}`));
  readonly filteredVendors = computed(() => this.filterOperational(this.vendorRecords(), item => `${item.name} ${item.supportEmail || ''} ${item.contractReference || ''}`));
  readonly filteredAudit = computed(() => this.filterOperational(this.auditRecords(), item => `${item.entityName} ${item.action} ${item.actorReference} ${item.entityId}`));

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (!(event instanceof NavigationEnd)) return;
      const path = event.urlAfterRedirects.split('?')[0].replace(/^\//, '');
      const section = ({ dashboard: 'Dashboard', 'my-work': 'My Work', board: 'Board', backlog: 'Backlog', sprints: 'Sprints', releases: 'Releases', projects: 'Projects', epics: 'Epics', features: 'Features', software: 'Software', teams: 'Teams', departments: 'Departments', vendors: 'Vendors', 'work-item-types': 'Work Item Types', 'custom-fields': 'Custom Fields', workflows: 'Workflows', 'transition-permissions': 'Transition Permissions', reports: 'Reports', 'audit-log': 'Audit Log', 'create-account': 'Create Account' } as Record<string, string>)[path] || 'Dashboard';
      this.activeNav.set(section);
      this.loadSection(section);
    });
    if (this.auth.accessToken()) {
      this.loadCurrentUser();
      this.loadWorkspace();
    }
  }

  private loadCurrentUser() {
    this.auth.loadCurrentUser().subscribe({
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) this.logout();
      }
    });
  }

  private loadWorkspace() {
    this.loadTasks();
    this.loadDashboard();
    this.taskApi.getProjects().subscribe({
      next: projects => {
        this.projects.set(projects);
        if (projects.length && !this.taskProjectId()) this.taskProjectId.set(projects[0].id);
      },
      error: () => this.projects.set([])
    });
    this.taskApi.getWorkItemTypeReferences().subscribe({
      next: types => {
        this.workItemTypes.set(types);
        if (types.length && !types.some(type => type.key === this.taskType())) this.taskType.set(types[0].key);
      },
      error: () => this.workItemTypes.set([])
    });
    this.taskApi.getEpics().subscribe({ next: epics => this.epics.set(epics), error: () => this.epics.set([]) });
    this.taskApi.getFeatures().subscribe({ next: features => this.features.set(features), error: () => this.features.set([]) });
  }

  private loadTasks() {
    this.loadingTasks.set(true);
    this.taskLoadError.set('');
    const [sortBy, sortDirection] = this.taskSort().split(':');
    const epicFilter = this.taskEpicFilter();
    const featureFilter = this.taskFeatureFilter();
    this.taskApi.getTasks({
      search: this.search().trim(),
      status: this.taskStatusFilter(),
      priority: this.taskPriorityFilter(),
      projectId: this.taskProjectFilter(),
      epicId: epicFilter && !epicFilter.startsWith('__') ? epicFilter : undefined,
      epicAssignment: epicFilter === '__assigned' ? 'assigned' : epicFilter === '__unassigned' ? 'unassigned' : undefined,
      featureId: featureFilter && !featureFilter.startsWith('__') ? featureFilter : undefined,
      featureAssignment: featureFilter === '__assigned' ? 'assigned' : featureFilter === '__unassigned' ? 'unassigned' : undefined,
      sortBy,
      sortDirection,
      page: this.taskPage(),
      pageSize: this.taskPageSize()
    }).subscribe({
      next: response => {
        this.tasks.set(response.items.map(task => this.toTask(task)));
        this.taskTotal.set(response.totalCount);
        this.taskPage.set(response.page);
        this.loadingTasks.set(false);
      },
      error: () => {
        this.loadingTasks.set(false);
        this.taskLoadError.set('Tasks could not be loaded. Confirm that TaskFlow.Api is running.');
      }
    });
  }

  private loadDashboard() {
    this.loadingDashboard.set(true);
    this.dashboardError.set('');
    this.taskApi.getTasks({ sortBy: 'dueDate', sortDirection: 'asc', page: 1, pageSize: 100 }).subscribe({
      next: response => {
        this.dashboardTasks.set(response.items.map(task => this.toTask(task)));
        this.loadingDashboard.set(false);
      },
      error: () => {
        this.loadingDashboard.set(false);
        this.dashboardError.set('Dashboard data could not be loaded. Confirm that TaskFlow.Api is running.');
      }
    });
  }

  applyTaskFilters() {
    this.taskPage.set(1);
    this.loadTasks();
  }

  clearTaskFilters() {
    this.search.set('');
    this.taskStatusFilter.set('');
    this.taskPriorityFilter.set('');
    this.taskProjectFilter.set('');
    this.taskEpicFilter.set('');
    this.taskFeatureFilter.set('');
    this.taskSort.set('dueDate:asc');
    this.taskPage.set(1);
    this.loadTasks();
  }

  changeTaskPage(page: number) {
    if (page < 1 || page > this.taskPageCount() || page === this.taskPage()) return;
    this.taskPage.set(page);
    this.loadTasks();
  }

  setNav(item: string) {
    if (item === 'Create Account') {
      this.openRegistration();
      return;
    }
    const route = item.toLowerCase().replaceAll(' ', '-');
    void this.router.navigateByUrl(`/${route}`).then(navigated => {
      if (!navigated) return;
      this.selectedTask.set(null);
      this.operationalSearch.set('');
    });
  }

  private loadSection(item: string) {
    if (item === 'Projects') this.loadProjectWorkspace();
    if (item === 'Dashboard') this.loadDashboard();
    if (item === 'Reports') { this.loadDashboard(); this.loadProjectWorkspace(); }
    if (['Software', 'Teams', 'Departments', 'Vendors', 'Audit Log'].includes(item)) this.loadOperationalWorkspace(item);
  }
  private filterOperational<T>(items: T[], text: (item: T) => string) {
    const term = this.operationalSearch().trim().toLowerCase();
    return term ? items.filter(item => text(item).toLowerCase().includes(term)) : items;
  }

  private loadOperationalWorkspace(section: string) {
    this.loadingOperations.set(true);
    this.operationsError.set('');
    const request = (section === 'Software' ? this.taskApi.getSoftwareList()
      : section === 'Teams' ? this.taskApi.getTeams()
      : section === 'Departments' ? this.taskApi.getDepartmentList()
      : section === 'Vendors' ? this.taskApi.getVendors()
      : this.taskApi.getAuditLog()) as Observable<SoftwareListItem[] | TeamListItem[] | DepartmentListItem[] | VendorListItem[] | AuditListItem[]>;
    request.subscribe({
      next: records => {
        if (section === 'Software') this.softwareRecords.set(records as SoftwareListItem[]);
        if (section === 'Teams') this.teamRecords.set(records as TeamListItem[]);
        if (section === 'Departments') this.departmentRecords.set(records as DepartmentListItem[]);
        if (section === 'Vendors') this.vendorRecords.set(records as VendorListItem[]);
        if (section === 'Audit Log') this.auditRecords.set(records as AuditListItem[]);
        this.loadingOperations.set(false);
      },
      error: () => {
        this.loadingOperations.set(false);
        this.operationsError.set(`${section} data could not be loaded. Confirm that TaskFlow.Api is running.`);
      }
    });
  }
  initials(name: string) { return name.split(' ').map(part => part[0]).join(''); }
  currentUserName() { return this.auth.currentUser()?.displayName || this.auth.currentUser()?.email || 'TaskFlow user'; }
  currentUserInitials() { return this.initials(this.currentUserName()).slice(0, 2).toUpperCase(); }
  statusClass(status: string) { return status.toLowerCase().replaceAll(' ', '-'); }
  formatEnum(value: string) {
    return value === 'Uat' ? 'UAT' : value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  private toTask(task: ApiTask): Task {
    return {
      apiId: task.id,
      id: task.taskNumber,
      title: task.title,
      project: task.projectName ?? 'Unassigned project',
      epicId: task.epicId ?? null,
      epicName: task.epicName ?? null,
      featureId: task.featureId ?? null,
      featureName: task.featureName ?? null,
      software: this.formatEnum(task.type),
      owner: 'Unassigned',
      status: this.formatEnum(task.status),
      priority: task.priority,
      due: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
      dueDateIso: task.dueDate ?? null,
      severity: task.priority
    };
  }

  openTask(id: string) {
    this.loadingTaskDetails.set(true);
    this.taskDetailsError.set('');
    this.taskApi.getTask(id).subscribe({
      next: task => {
        this.selectedTask.set(task);
        this.activeNav.set('My Work');
        void this.router.navigateByUrl('/my-work');
        this.loadingTaskDetails.set(false);
      },
      error: () => {
        this.loadingTaskDetails.set(false);
        this.taskDetailsError.set('Task details could not be loaded.');
      }
    });
  }

  closeTask() {
    this.selectedTask.set(null);
    this.taskDetailsError.set('');
    this.newComment.set('');
    this.commentError.set('');
    this.showAssignmentModal.set(false);
    this.showSubtaskEditor.set(false);
  }

  openSubtaskEditor() {
    const task = this.selectedTask();
    if (!task || task.parentTaskId) return;
    this.subtaskTitle.set(''); this.subtaskDescription.set(''); this.subtaskType.set(this.workItemTypes().some(x => x.key === 'Task') ? 'Task' : (this.workItemTypes()[0]?.key || 'Task'));
    this.subtaskPriority.set('Medium'); this.subtaskSeverity.set('Medium'); this.subtaskDueDate.set(''); this.subtaskSprintId.set(''); this.subtaskError.set(''); this.showSubtaskEditor.set(true);
    this.loadSubtaskCustomFields(this.subtaskType());
    this.taskApi.getBacklog(task.projectId).subscribe({ next: result => this.subtaskSprints.set(result.sprints.filter(x => x.status !== 'Completed')), error: () => this.subtaskSprints.set([]) });
  }

  createSubtask() {
    const parent = this.selectedTask(); const title = this.subtaskTitle().trim();
    if (!parent || parent.parentTaskId || !title) { this.subtaskError.set('Enter a subtask title.'); return; }
    if (this.hasMissingRequiredFields(this.subtaskCustomFields(), this.subtaskCustomFieldValues())) { this.subtaskError.set('Complete all required additional fields.'); return; }
    this.savingSubtask.set(true); this.subtaskError.set('');
    this.taskApi.createSubtask(parent.id, { title, description: this.subtaskDescription().trim() || null, type: this.subtaskType(), priority: this.subtaskPriority(), severity: this.subtaskType().toLowerCase() === 'bug' ? this.subtaskSeverity() : null, dueDate: this.subtaskDueDate() || null, sprintId: this.subtaskSprintId() || null, customFields: this.serializeCustomFields(this.subtaskCustomFields(), this.subtaskCustomFieldValues()) }).subscribe({
      next: created => {
        this.savingSubtask.set(false);
        this.subtaskTitle.set(''); this.subtaskDescription.set(''); this.subtaskDueDate.set('');
        this.subtaskCustomFieldValues.set(this.defaultCustomFieldValues(this.subtaskCustomFields()));
        this.showTaskCreateSuccess('Subtask saved', `${created.taskNumber} created successfully. You can add another subtask.`);
        this.taskApi.getTask(parent.id).subscribe({ next: updated => this.selectedTask.set(updated), error: () => undefined });
        this.loadTasks();
      },
      error: (error: HttpErrorResponse) => { this.savingSubtask.set(false); this.subtaskError.set(error.error?.message || 'Subtask could not be created.'); }
    });
  }

  openAssignmentModal() {
    this.assignmentError.set('');
    this.showAssignmentModal.set(true);
  }

  closeAssignmentModal() {
    if (this.savingAssignment()) return;
    this.assignmentError.set('');
    this.showAssignmentModal.set(false);
  }

  changeTaskStatus(status: string) {
    const task = this.selectedTask();
    if (!task || task.status === status) return;
    this.savingTaskStatus.set(true);
    this.taskDetailsError.set('');
    this.taskApi.changeTaskStatus(task.id, status, this.transitionComment().trim() || null).subscribe({
      next: updated => {
        this.savingTaskStatus.set(false);
        this.selectedTask.set(updated);
        this.transitionComment.set('');
        this.tasks.update(tasks => tasks.map(item => item.apiId === task.id ? { ...item, status: this.formatEnum(status) } : item));
        this.loadDashboard();
      },
      error: (error: HttpErrorResponse) => {
        this.savingTaskStatus.set(false);
        this.taskDetailsError.set(error.status === 409 ? (error.error?.message || 'This workflow transition is not allowed.') : 'Task status could not be changed.');
      }
    });
  }

  addComment() {
    const task = this.selectedTask();
    const body = this.newComment().trim();
    if (!task || !body) {
      this.commentError.set('Enter a comment before posting.');
      return;
    }
    this.postingComment.set(true);
    this.commentError.set('');
    this.commentSuccess.set('');
    this.taskApi.addTaskComment(task.id, body).subscribe({
      next: comment => {
        this.newComment.set('');
        const currentTask = this.selectedTask();
        if (currentTask?.id === task.id) currentTask.comments.push(comment);
        this.postingComment.set(false);
        this.showCommentSuccess();
      },
      error: () => {
        this.postingComment.set(false);
        this.commentError.set('The comment could not be posted.');
      }
    });
  }

  private commentSuccessTimer: ReturnType<typeof setTimeout> | null = null;

  private showCommentSuccess() {
    if (this.commentSuccessTimer) clearTimeout(this.commentSuccessTimer);
    this.commentSuccess.set('Comment saved successfully.');
    this.commentSuccessTimer = setTimeout(() => this.dismissCommentSuccess(), 3500);
  }

  dismissCommentSuccess() {
    if (this.commentSuccessTimer) clearTimeout(this.commentSuccessTimer);
    this.commentSuccessTimer = null;
    this.commentSuccess.set('');
  }

  openTaskEditor() {
    const task = this.selectedTask();
    if (!task) return;
    this.editTaskTitle.set(task.title);
    this.editTaskDescription.set(task.description || '');
    this.editTaskProjectId.set(task.projectId);
    this.editTaskEpicId.set(task.epicId || '');
    this.editTaskFeatureId.set(task.featureId || '');
    this.editTaskType.set(task.type);
    this.editTaskPriority.set(task.priority);
    this.editTaskDueDate.set(task.dueDate ? task.dueDate.slice(0, 10) : '');
    this.taskEditError.set('');
    this.showEditTask.set(true);
    this.taskApi.getFeatures(task.projectId).subscribe({ next: features => this.features.set(features), error: () => undefined });
    this.loadEditCustomFields(task.type, task);
  }

  saveTaskEdit() {
    const task = this.selectedTask();
    if (!task || !this.editTaskTitle().trim() || !this.editTaskProjectId()) {
      this.taskEditError.set('Task title and project are required.');
      return;
    }
    if (this.hasMissingRequiredFields(this.editCustomFields(), this.editCustomFieldValues())) { this.taskEditError.set('Complete all required additional fields.'); return; }
    this.savingTaskEdit.set(true);
    this.taskEditError.set('');
    this.taskApi.updateTask(task.id, {
      title: this.editTaskTitle().trim(),
      description: this.editTaskDescription().trim() || null,
      type: this.editTaskType(),
      priority: this.editTaskPriority(),
      severity: this.editTaskPriority(),
      projectId: this.editTaskProjectId(),
      epicId: this.editTaskEpicId() || null,
      featureId: this.editTaskFeatureId() || null,
      softwareApplicationId: null,
      dueDate: this.editTaskDueDate() || null
      ,customFields: this.serializeCustomFields(this.editCustomFields(), this.editCustomFieldValues())
    }).subscribe({
      next: updated => {
        this.savingTaskEdit.set(false);
        this.showEditTask.set(false);
        this.selectedTask.set(updated);
        this.tasks.update(tasks => tasks.map(item => item.apiId === updated.id ? this.toTask(updated) : item));
        this.loadDashboard();
      },
      error: () => {
        this.savingTaskEdit.set(false);
        this.taskEditError.set('The task could not be updated.');
      }
    });
  }

  addAssignment() {
    const task = this.selectedTask();
    const partyReference = this.assignmentPartyReference().trim();
    if (!task || !partyReference) {
      this.assignmentError.set('Enter an email, user ID, team, or vendor reference.');
      return;
    }
    this.savingAssignment.set(true);
    this.assignmentError.set('');
    this.taskApi.addTaskAssignment(task.id, this.assignmentResponsibility(), partyReference, this.assignmentDisplayName().trim()).subscribe({
      next: assignment => {
        this.savingAssignment.set(false);
        this.assignmentPartyReference.set('');
        this.assignmentDisplayName.set('');
        this.showAssignmentModal.set(false);
        this.selectedTask.update(current => current && !current.assignments.some(item => item.id === assignment.id)
          ? { ...current, assignments: [...current.assignments, assignment] }
          : current);
      },
      error: () => {
        this.savingAssignment.set(false);
        this.assignmentError.set('The assignment could not be added.');
      }
    });
  }

  removeAssignment(assignmentId: string) {
    const task = this.selectedTask();
    if (!task) return;
    this.assignmentError.set('');
    this.taskApi.removeTaskAssignment(task.id, assignmentId).subscribe({
      next: () => this.selectedTask.update(current => current ? { ...current, assignments: current.assignments.filter(item => item.id !== assignmentId) } : current),
      error: () => this.assignmentError.set('The assignment could not be removed.')
    });
  }

  addTaskLink() {
    const task = this.selectedTask(); const reference = this.linkTaskReference().trim();
    if (!task || !reference) { this.linkError.set('Enter a task number such as TF-2026...'); return; }
    this.savingLink.set(true); this.linkError.set('');
    this.taskApi.addTaskLink(task.id, this.linkType(), reference).subscribe({ next: link => { this.savingLink.set(false); this.linkTaskReference.set(''); this.selectedTask.update(current => current ? { ...current, links: [...current.links, link] } : current); }, error: (error: HttpErrorResponse) => { this.savingLink.set(false); this.linkError.set(error.error?.message || 'Task link could not be added.'); } });
  }

  removeTaskLink(linkId: string) {
    const task = this.selectedTask(); if (!task) return; this.linkError.set('');
    this.taskApi.removeTaskLink(task.id, linkId).subscribe({ next: () => this.selectedTask.update(current => current ? { ...current, links: current.links.filter(link => link.id !== linkId) } : current), error: () => this.linkError.set('Task link could not be removed.') });
  }

  taskLinkLabel(type: string, outgoing: boolean) {
    if (type === 'Blocks') return outgoing ? 'blocks' : 'is blocked by';
    if (type === 'ParentOf') return outgoing ? 'parent of' : 'child of';
    if (type === 'Duplicates') return outgoing ? 'duplicates' : 'is duplicated by';
    return 'relates to';
  }

  uploadAttachment(files: FileList | null) {
    const task = this.selectedTask(); const file = files?.item(0);
    if (!task || !file) return;
    this.uploadingAttachment.set(true); this.attachmentError.set('');
    this.taskApi.uploadTaskAttachment(task.id, file).subscribe({
      next: attachment => { this.uploadingAttachment.set(false); this.selectedTask.update(current => current ? { ...current, attachments: [attachment, ...current.attachments] } : current); },
      error: (error: HttpErrorResponse) => { this.uploadingAttachment.set(false); this.attachmentError.set(error.error?.message || 'The attachment could not be uploaded.'); }
    });
  }

  downloadAttachment(attachmentId: string, fileName: string) {
    const task = this.selectedTask(); if (!task) return;
    this.attachmentError.set('');
    this.taskApi.downloadTaskAttachment(task.id, attachmentId).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url); },
      error: () => this.attachmentError.set('The attachment could not be downloaded.')
    });
  }

  isImageAttachment(contentType: string, fileName: string) {
    return contentType.toLowerCase().startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
  }

  viewAttachment(attachmentId: string, fileName: string) {
    const task = this.selectedTask(); if (!task) return;
    this.closeAttachmentPreview();
    this.previewingAttachmentId.set(attachmentId); this.attachmentError.set('');
    this.taskApi.downloadTaskAttachment(task.id, attachmentId).subscribe({
      next: blob => {
        this.previewingAttachmentId.set(null);
        this.attachmentPreviewId.set(attachmentId);
        this.attachmentPreviewName.set(fileName);
        this.attachmentPreviewUrl.set(URL.createObjectURL(blob));
      },
      error: () => { this.previewingAttachmentId.set(null); this.attachmentError.set('The image preview could not be loaded.'); }
    });
  }

  closeAttachmentPreview() {
    const url = this.attachmentPreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.attachmentPreviewId.set(null);
    this.attachmentPreviewUrl.set(null);
    this.attachmentPreviewName.set('');
  }

  deleteAttachment(attachmentId: string) {
    const task = this.selectedTask(); if (!task) return;
    this.attachmentError.set('');
    this.taskApi.deleteTaskAttachment(task.id, attachmentId).subscribe({
      next: () => this.selectedTask.update(current => current ? { ...current, attachments: current.attachments.filter(item => item.id !== attachmentId) } : current),
      error: () => this.attachmentError.set('The attachment could not be removed.')
    });
  }

  formatFileSize(size: number) { return size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }

  openCreate() {
    this.createError.set('');
    if (!this.auth.accessToken()) {
      this.showLogin.set(true);
      return;
    }
    this.showCreate.set(true);
    if (!this.softwareApplications().length) this.taskApi.getSoftwareApplications().subscribe({ next: items => this.softwareApplications.set(items), error: () => this.softwareApplications.set([]) });
    this.taskApi.getEpics().subscribe({ next: epics => this.epics.set(epics), error: () => undefined });
    this.taskApi.getFeatures().subscribe({ next: features => this.features.set(features), error: () => undefined });
    this.loadCreateCustomFields(this.taskType());
  }

  openLogin() {
    this.registering.set(false);
    this.loginError.set('');
    this.loginConfirmPassword.set('');
    this.showLogin.set(false);
  }

  openRegistration() {
    this.registering.set(true);
    this.loginError.set('');
    this.loginPassword.set('');
    this.loginConfirmPassword.set('');
    this.showLogin.set(false);
    this.activeNav.set('Create Account');
    if (this.auth.accessToken()) void this.router.navigateByUrl('/create-account');
  }

  toggleRegistration() {
    this.registering.update(registering => !registering);
    this.loginError.set('');
    this.loginConfirmPassword.set('');
  }

  openChangePassword() {
    this.passwordError.set('');
    this.passwordMessage.set('');
    this.showChangePassword.set(true);
  }

  openResetPassword() {
    this.showLogin.set(false);
    this.passwordError.set('');
    this.passwordMessage.set('');
    this.resetRequested.set(false);
    this.resetEmail.set(this.loginEmail());
    this.showResetPassword.set(true);
  }

  logout() {
    this.auth.logout();
    this.showCreate.set(false);
    this.showProjectSetup.set(false);
    this.showChangePassword.set(false);
    this.activeNav.set('Dashboard');
    this.registering.set(false);
    this.loginPassword.set('');
    this.loginError.set('');
    this.tasks.set([]);
    this.projects.set([]);
  }

  createTask() {
    if (!this.taskTitle().trim() || !this.taskProjectId()) {
      this.createError.set('A title and project are required.');
      return;
    }
    if (this.hasMissingRequiredFields(this.createCustomFields(), this.createCustomFieldValues())) { this.createError.set('Complete all required additional fields.'); return; }
    this.creatingTask.set(true);
    this.createError.set('');
    this.taskApi.createTask({
      title: this.taskTitle().trim(),
      description: this.taskDescription().trim() || null,
      type: this.taskType(),
      priority: this.taskPriority(),
      severity: this.taskType().toLowerCase() === 'bug' ? this.taskSeverity() : null,
      projectId: this.taskProjectId(),
      epicId: this.taskEpicId() || null,
      featureId: this.taskFeatureId() || null,
      softwareApplicationId: this.taskSoftwareApplicationId() || null,
      dueDate: this.taskDueDate() || null
      ,customFields: this.serializeCustomFields(this.createCustomFields(), this.createCustomFieldValues())
    }).subscribe({
      next: created => {
        this.creatingTask.set(false);
        this.taskTitle.set('');
        this.taskDescription.set('');
        this.taskDueDate.set('');
        this.createCustomFieldValues.set({});
        this.showTaskCreateSuccess('Task saved', `${created.taskNumber} created successfully. You can add another task.`);
        this.loadTasks();
        this.loadDashboard();
      },
      error: (error: HttpErrorResponse) => {
        this.creatingTask.set(false);
        if (error.status === 401) {
          this.auth.logout();
          this.showCreate.set(false);
          this.showLogin.set(false);
          this.registering.set(false);
          this.loginError.set('Your session expired. Please sign in again.');
        } else {
          this.createError.set(error.error?.message || 'The task could not be created. Please check the highlighted information and try again.');
        }
      }
    });
  }

  private taskCreateSuccessTimer: ReturnType<typeof setTimeout> | null = null;
  private showTaskCreateSuccess(title: string, message: string) { if (this.taskCreateSuccessTimer) clearTimeout(this.taskCreateSuccessTimer); this.taskCreateSuccessTitle.set(title); this.taskCreateSuccess.set(message); this.taskCreateSuccessTimer = setTimeout(() => this.dismissTaskCreateSuccess(), 4000); }
  dismissTaskCreateSuccess() { if (this.taskCreateSuccessTimer) clearTimeout(this.taskCreateSuccessTimer); this.taskCreateSuccessTimer = null; this.taskCreateSuccess.set(''); }

  changeCreateTaskType(type: string) { this.taskType.set(type); this.loadCreateCustomFields(type); }
  changeSubtaskType(type: string) { this.subtaskType.set(type); this.loadSubtaskCustomFields(type); }
  changeEditTaskType(type: string) { this.editTaskType.set(type); this.loadEditCustomFields(type); }
  changeTaskProjectFilter(id: string) { this.taskProjectFilter.set(id); this.taskEpicFilter.set(''); this.taskFeatureFilter.set(''); }
  changeTaskEpicFilter(value: string) { this.taskEpicFilter.set(value); this.taskFeatureFilter.set(''); this.taskPage.set(1); this.loadTasks(); }
  changeTaskFeatureFilter(value: string) { this.taskFeatureFilter.set(value); this.taskPage.set(1); this.loadTasks(); }
  changeCreateTaskProject(id: string) { this.taskProjectId.set(id); this.taskEpicId.set(''); this.taskFeatureId.set(''); }
  changeCreateTaskEpic(id: string) { this.taskEpicId.set(id); this.taskFeatureId.set(''); }
  changeCreateTaskFeature(id: string) { this.taskFeatureId.set(id); const feature = this.features().find(x => x.id === id); if (feature) this.taskEpicId.set(feature.epicId); }
  changeEditTaskProject(id: string) { this.editTaskProjectId.set(id); this.editTaskEpicId.set(''); this.editTaskFeatureId.set(''); }
  changeEditTaskEpic(id: string) { this.editTaskEpicId.set(id); this.editTaskFeatureId.set(''); }
  changeEditTaskFeature(id: string) { this.editTaskFeatureId.set(id); const feature = this.features().find(x => x.id === id); if (feature) this.editTaskEpicId.set(feature.epicId); }
  setCreateCustomField(id: string, value: string | string[]) { this.createCustomFieldValues.update(values => ({ ...values, [id]: value })); }
  setSubtaskCustomField(id: string, value: string | string[]) { this.subtaskCustomFieldValues.update(values => ({ ...values, [id]: value })); }
  setEditCustomField(id: string, value: string | string[]) { this.editCustomFieldValues.update(values => ({ ...values, [id]: value })); }
  customFieldValue(values: Record<string, string | string[]>, id: string) { const value = values[id]; return Array.isArray(value) ? '' : value ?? ''; }
  customFieldSelected(values: Record<string, string | string[]>, id: string, option: string) { const value = values[id]; return Array.isArray(value) && value.includes(option); }
  toggleCustomFieldOption(target: 'create' | 'edit' | 'subtask', id: string, option: string, checked: boolean) {
    const source = target === 'create' ? this.createCustomFieldValues : target === 'subtask' ? this.subtaskCustomFieldValues : this.editCustomFieldValues;
    const current = source()[id]; const selected = Array.isArray(current) ? current : [];
    source.update(values => ({ ...values, [id]: checked ? [...selected, option] : selected.filter(x => x !== option) }));
  }

  private loadCreateCustomFields(type: string) {
    this.taskApi.getApplicableCustomFields(type).subscribe({ next: fields => { const visible = fields.filter(field => field.showOnCreate); this.createCustomFields.set(visible); this.createCustomFieldValues.set(this.defaultCustomFieldValues(visible)); }, error: () => { this.createCustomFields.set([]); this.createError.set('Custom fields could not be loaded.'); } });
  }

  private loadSubtaskCustomFields(type: string) {
    this.taskApi.getApplicableCustomFields(type).subscribe({ next: fields => { const visible = fields.filter(field => field.showOnCreate); this.subtaskCustomFields.set(visible); this.subtaskCustomFieldValues.set(this.defaultCustomFieldValues(visible)); }, error: () => { this.subtaskCustomFields.set([]); this.subtaskCustomFieldValues.set({}); this.subtaskError.set('Custom fields could not be loaded.'); } });
  }

  private loadEditCustomFields(type: string, task: ApiTaskDetails | null = null) {
    this.taskApi.getApplicableCustomFields(type).subscribe({ next: fields => { const visible = fields.filter(field => field.showOnEdit); this.editCustomFields.set(visible); const values = this.defaultCustomFieldValues(visible); for (const item of task?.customFields ?? []) if (visible.some(field => field.id === item.customFieldDefinitionId)) values[item.customFieldDefinitionId] = item.type === 'MultiSelect' ? item.displayValues.length ? this.parseMultiSelect(item.value) : [] : item.value ?? ''; this.editCustomFieldValues.set(values); }, error: () => { this.editCustomFields.set([]); this.taskEditError.set('Custom fields could not be loaded.'); } });
  }

  private defaultCustomFieldValues(fields: ApplicableCustomField[]) { return Object.fromEntries(fields.map(field => [field.id, field.type === 'MultiSelect' ? this.parseMultiSelect(field.defaultValue) : field.defaultValue ?? ''])) as Record<string, string | string[]>; }
  private parseMultiSelect(value?: string | null): string[] { try { return value ? JSON.parse(value) : []; } catch { return []; } }
  private serializeCustomFields(fields: ApplicableCustomField[], values: Record<string, string | string[]>): SaveTaskCustomFieldValue[] { return fields.map(field => { const value = values[field.id]; return { customFieldDefinitionId: field.id, value: Array.isArray(value) ? JSON.stringify(value) : value?.trim() || null }; }); }
  private hasMissingRequiredFields(fields: ApplicableCustomField[], values: Record<string, string | string[]>) { return fields.some(field => field.isRequired && (!values[field.id] || (Array.isArray(values[field.id]) && !values[field.id].length))); }

  login() {
    const isRegistering = this.registering();
    if (!this.loginEmail().trim() || !this.loginPassword() || (isRegistering && (!this.loginDisplayName().trim() || !this.loginConfirmPassword()))) {
      this.loginError.set(isRegistering ? 'Name, email, password, and confirmation are required.' : 'Email and password are required.');
      return;
    }
    if (isRegistering && this.loginPassword() !== this.loginConfirmPassword()) {
      this.loginError.set('Passwords do not match.');
      return;
    }
    this.loggingIn.set(true);
    this.loginError.set('');
    const email = this.loginEmail().trim();
    const password = this.loginPassword();
    const request = isRegistering
      ? this.auth.register(email, password, this.loginDisplayName().trim()).pipe(
          switchMap(() => this.auth.login(email, password)))
      : this.auth.login(email, password);
    request.subscribe({
      next: () => {
        this.loggingIn.set(false);
        this.showLogin.set(false);
        this.loginPassword.set('');
        this.loginConfirmPassword.set('');
        if (isRegistering) this.activeNav.set('Dashboard');
        this.loadCurrentUser();
        this.loadWorkspace();
        if (isRegistering) this.showProjectSetup.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loggingIn.set(false);
        if (error.status === 0 || [500, 502, 503, 504].includes(error.status)) {
          this.loginError.set(`TaskFlow.Api is unavailable or returned a server error. Check the API on ${environment.apiServerUrl} and try again.`);
        } else if (isRegistering) {
          this.loginError.set(error.status === 409
            ? 'An account with this email already exists.'
            : 'Account creation failed. Use a valid email and a stronger password.');
        } else {
          this.loginError.set(error.status === 401
            ? 'Sign-in failed. Check your email and password.'
            : 'Sign-in could not be completed. Please try again.');
        }
      }
    });
  }

  createProject() {
    if (!this.projectName().trim()) {
      this.projectError.set('Project name is required.');
      return;
    }
    this.creatingProject.set(true);
    this.projectError.set('');
    this.taskApi.createProject(this.projectName().trim(), this.projectKey().trim(), this.projectObjectives().trim()).subscribe({
      next: project => {
        this.creatingProject.set(false);
        this.projects.update(projects => [...projects, project]);
        this.taskProjectId.set(project.id);
        this.projectName.set('');
        this.projectKey.set('');
        this.projectObjectives.set('');
        this.showProjectSetup.set(false);
        if (this.activeNav() === 'Projects') {
          this.loadProjectWorkspace(project.id);
        } else {
          this.showCreate.set(true);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.creatingProject.set(false);
        this.projectError.set(error.status === 409
          ? 'A project with this name already exists.'
          : 'The project could not be created. Please try again.');
      }
    });
  }

  private loadProjectWorkspace(selectId?: string) {
    this.loadingProjects.set(true);
    this.projectListError.set('');
    this.taskApi.getProjectList().subscribe({
      next: projects => {
        this.projectRecords.set(projects);
        this.loadingProjects.set(false);
        if (selectId) this.openProject(selectId);
        else if (this.selectedProject() && !projects.some(project => project.id === this.selectedProject()?.id)) this.selectedProject.set(null);
      },
      error: () => {
        this.loadingProjects.set(false);
        this.projectListError.set('Projects could not be loaded.');
      }
    });
    if (!this.softwareApplications().length) this.taskApi.getSoftwareApplications().subscribe({ next: items => this.softwareApplications.set(items), error: () => this.softwareApplications.set([]) });
  }

  openNewProject() {
    this.projectName.set('');
    this.projectKey.set('');
    this.projectObjectives.set('');
    this.projectError.set('');
    this.showProjectSetup.set(true);
  }

  openProject(id: string) {
    this.projectListError.set('');
    this.taskApi.getProject(id).subscribe({ next: project => this.selectedProject.set(project), error: () => this.projectListError.set('Project details could not be loaded.') });
  }

  closeProject() { this.selectedProject.set(null); }

  openProjectEditor() {
    const project = this.selectedProject();
    if (!project) return;
    this.projectEditName.set(project.name);
    this.projectEditKey.set(project.projectKey || '');
    this.projectEditObjectives.set(project.objectives || '');
    this.projectEditStatus.set(project.status);
    this.projectEditStartDate.set(project.startDate || '');
    this.projectEditTargetDate.set(project.targetDate || '');
    this.projectEditManager.set(project.projectManager || '');
    this.projectEditSponsor.set(project.sponsor || '');
    this.projectEditSoftwareId.set(project.softwareApplicationId || '');
    this.projectEditError.set('');
    this.showEditProject.set(true);
  }

  saveProjectEdit() {
    const project = this.selectedProject();
    if (!project || !this.projectEditName().trim()) { this.projectEditError.set('Project name is required.'); return; }
    this.savingProjectEdit.set(true);
    this.projectEditError.set('');
    this.taskApi.updateProject(project.id, {
      name: this.projectEditName().trim(), projectKey: this.projectEditKey().trim() || null,
      objectives: this.projectEditObjectives().trim() || null, status: this.projectEditStatus(),
      startDate: this.projectEditStartDate() || null, targetDate: this.projectEditTargetDate() || null,
      projectManager: this.projectEditManager().trim() || null, sponsor: this.projectEditSponsor().trim() || null,
      softwareApplicationId: this.projectEditSoftwareId() || null
    }).subscribe({
      next: updated => { this.savingProjectEdit.set(false); this.showEditProject.set(false); this.selectedProject.set(updated); this.loadProjectWorkspace(); },
      error: error => { this.savingProjectEdit.set(false); this.projectEditError.set(error.status === 409 ? 'A project with this name already exists.' : 'The project could not be updated.'); }
    });
  }

  archiveSelectedProject() {
    const project = this.selectedProject();
    if (!project) return;
    this.archivingProject.set(true);
    this.taskApi.archiveProject(project.id).subscribe({
      next: () => { this.archivingProject.set(false); this.showArchiveProject.set(false); this.selectedProject.set(null); this.loadProjectWorkspace(); },
      error: () => { this.archivingProject.set(false); this.showArchiveProject.set(false); this.projectListError.set('The project could not be archived.'); }
    });
  }

  changePassword() {
    if (!this.currentPassword() || !this.newPassword() || this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('Complete all fields and make sure the new passwords match.');
      return;
    }
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.auth.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordMessage.set('Your password has been changed successfully.');
        this.currentPassword.set(''); this.newPassword.set(''); this.confirmPassword.set('');
      },
      error: () => { this.savingPassword.set(false); this.passwordError.set('Password change failed. Check your current password and password policy.'); }
    });
  }

  requestPasswordReset() {
    if (!this.resetEmail().trim()) { this.passwordError.set('Enter your email address.'); return; }
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.auth.requestPasswordReset(this.resetEmail().trim()).subscribe({
      next: response => {
        this.savingPassword.set(false);
        this.resetRequested.set(true);
        if (response.resetToken) this.resetToken.set(response.resetToken);
        this.passwordMessage.set(response.message);
      },
      error: () => { this.savingPassword.set(false); this.passwordError.set('Reset instructions could not be requested.'); }
    });
  }

  resetPassword() {
    if (!this.resetToken() || !this.newPassword() || this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('Enter the reset token and matching new passwords.');
      return;
    }
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.auth.resetPassword(this.resetEmail().trim(), this.resetToken(), this.newPassword()).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.showResetPassword.set(false);
        this.newPassword.set(''); this.confirmPassword.set(''); this.resetToken.set('');
        this.loginEmail.set(this.resetEmail().trim());
        this.showLogin.set(true);
        this.passwordMessage.set('');
      },
      error: () => { this.savingPassword.set(false); this.passwordError.set('The reset token is invalid or expired.'); }
    });
  }
}
