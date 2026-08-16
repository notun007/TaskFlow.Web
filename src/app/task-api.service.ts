import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type ApiTask = {
  id: string;
  taskNumber: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectName?: string | null;
  epicId?: string | null;
  epicName?: string | null;
  featureId?: string | null;
  featureName?: string | null;
  parentTaskId?: string | null;
  parentTaskNumber?: string | null;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  ownerUserId?: string | null;
  ownerDisplayName?: string | null;
  reporterUserId?: string | null;
  reporterDisplayName?: string | null;
  estimatedEffortMinutes?: number | null;
};
export type PagedTasks = { items: ApiTask[]; totalCount: number; page: number; pageSize: number };
export type TaskListQuery = { search?: string; status?: string; priority?: string; projectId?: string; epicId?: string; epicAssignment?: 'assigned' | 'unassigned'; featureId?: string; featureAssignment?: 'assigned' | 'unassigned'; sortBy?: string; sortDirection?: string; page?: number; pageSize?: number };

export type ReferenceItem = { id: string; name: string };
export type WorkItemTypeReference = { key: string; name: string };
export type WorkItemTypeListItem = { id: string; key: string; name: string; description?: string | null; isActive: boolean; isSystem: boolean; sortOrder: number; workItems: number };
export type CreateWorkItemTypeRequest = { key: string; name: string; description: string | null; sortOrder: number };
export type UpdateWorkItemTypeRequest = { name: string; description: string | null; isActive: boolean; sortOrder: number };
export type CustomFieldOption = { id: string; value: string; label: string; sortOrder: number; isActive: boolean };
export type CustomFieldContext = { id: string; workItemTypeId?: string | null; workItemType: string; isRequired: boolean; defaultValue?: string | null; sectionName: string; showOnCreate: boolean; showOnEdit: boolean; showOnDetails: boolean };
export type CustomFieldItem = { id: string; key: string; name: string; description?: string | null; type: string; isActive: boolean; sortOrder: number; options: CustomFieldOption[]; contexts: CustomFieldContext[] };
export type ApplicableCustomField = { id: string; key: string; name: string; description?: string | null; type: string; isRequired: boolean; defaultValue?: string | null; sectionName: string; showOnCreate: boolean; showOnEdit: boolean; showOnDetails: boolean; options: CustomFieldOption[] };
export type TaskCustomFieldValue = { customFieldDefinitionId: string; key: string; name: string; type: string; value?: string | null; displayValues: string[] };
export type SaveTaskCustomFieldValue = { customFieldDefinitionId: string; value: string | null };
export type SaveCustomFieldOption = { value: string; label: string; sortOrder: number; isActive: boolean };
export type SaveCustomFieldContext = { workItemTypeId: string | null; isRequired: boolean; defaultValue: string | null; sectionName: string; showOnCreate: boolean; showOnEdit: boolean; showOnDetails: boolean };
export type CreateCustomFieldRequest = { key: string; name: string; description: string | null; type: string; sortOrder: number; options: SaveCustomFieldOption[]; contexts: SaveCustomFieldContext[] };
export type UpdateCustomFieldRequest = { name: string; description: string | null; isActive: boolean; sortOrder: number; options: SaveCustomFieldOption[]; contexts: SaveCustomFieldContext[] };
export type WorkflowTransitionItem = { id: string; fromStatus: string; toStatus: string; sortOrder: number };
export type WorkflowDetails = { id: string; name: string; projectId?: string | null; project: string; isDefault: boolean; isInherited: boolean; statuses: string[]; transitions: WorkflowTransitionItem[] };
export type SaveWorkflowRequest = { name: string; transitions: Array<{ fromStatus: string; toStatus: string; sortOrder: number }> };
export type TransitionPermissionItem = { fromStatus: string; toStatus: string; roles: string[] };
export type BoardColumnItem = { id: string; name: string; status: string; sortOrder: number; wipLimit?: number | null; isDefaultDestination: boolean };
export type ProjectBoardDetails = { projectId: string; columns: BoardColumnItem[] };
export type SaveProjectBoardRequest = { columns: Array<{ name: string; status: string; sortOrder: number; wipLimit: number | null; isDefaultDestination: boolean }> };
export type SprintTaskItem = { id: string; taskNumber: string; title: string; type: string; status: string; priority: string; dueDate?: string | null; epicId?: string | null; epicName?: string | null; featureId?: string | null; featureName?: string | null };
export type SprintItem = { id: string; name: string; goal?: string | null; projectId: string; status: string; startDate?: string | null; endDate?: string | null; startedAt?: string | null; completedAt?: string | null; createdAt: string; tasks: SprintTaskItem[] };
export type BacklogDetails = { projectId: string; projectName: string; sprints: SprintItem[]; backlog: SprintTaskItem[] };
export type SaveSprintRequest = { name: string; goal: string | null; projectId: string; startDate: string | null; endDate: string | null };
export type ReleaseTaskItem = { id: string; taskNumber: string; title: string; type: string; status: string; priority: string };
export type ReleaseItem = { id: string; name: string; description?: string | null; projectId: string; status: string; startDate?: string | null; releaseDate?: string | null; releasedAt?: string | null; totalTasks: number; completedTasks: number; tasks: ReleaseTaskItem[] };
export type ReleasePlan = { projectId: string; projectName: string; releases: ReleaseItem[]; unassignedTasks: ReleaseTaskItem[] };
export type SaveReleaseRequest = { name: string; description: string | null; projectId: string; startDate: string | null; releaseDate: string | null };
export type ProjectListItem = { id: string; name: string; projectKey?: string | null; status: string; targetDate?: string | null; projectManager?: string | null; taskCount: number };
export type ProjectDetails = ProjectListItem & { objectives?: string | null; startDate?: string | null; sponsor?: string | null; softwareApplicationId?: string | null; softwareApplicationName?: string | null; createdAt: string; updatedAt?: string | null };
export type UpdateProjectRequest = { name: string; projectKey: string | null; objectives: string | null; status: string; startDate: string | null; targetDate: string | null; projectManager: string | null; sponsor: string | null; softwareApplicationId: string | null };
export type EpicListItem = { id: string; name: string; description?: string | null; projectId: string; projectName: string; status: string; targetDate?: string | null; totalItems: number; completedItems: number; progressPercent: number; createdAt: string };
export type SaveEpicRequest = { name: string; description: string | null; projectId: string; targetDate: string | null };
export type FeatureListItem = { id: string; name: string; description?: string | null; projectId: string; projectName: string; epicId: string; epicName: string; status: string; targetDate?: string | null; totalItems: number; completedItems: number; progressPercent: number; createdAt: string };
export type SaveFeatureRequest = { name: string; description: string | null; projectId: string; epicId: string; targetDate: string | null };
export type ProjectAccessUser = { id: string; email: string; displayName: string; isActive: boolean; roles: string[] };
export type SoftwareListItem = { id: string; name: string; businessOwner?: string | null; technicalOwner?: string | null; supportTeam?: string | null; criticality?: string | null; technology?: string | null; currentVersion?: string | null; isProduction: boolean; isThirdParty: boolean; vendorId?: string | null; vendorName?: string | null; linkedProjects: number; openTasks: number };
export type SaveSoftwareRequest = { name: string; businessOwner: string | null; technicalOwner: string | null; supportTeam: string | null; criticality: string | null; technology: string | null; currentVersion: string | null; isProduction: boolean; isThirdParty: boolean; vendorId: string | null };
export type TeamListItem = { id: string; name: string; departmentId: string; department: string; assignedTasks: number };
export type SaveTeamRequest = { name: string; departmentId: string };
export type DepartmentListItem = { id: string; name: string; description?: string | null; teams: number };
export type SaveDepartmentRequest = { name: string; description: string | null };
export type VendorListItem = { id: string; name: string; supportEmail?: string | null; supportPhone?: string | null; contractReference?: string | null; slaDetails?: string | null; applications: number };
export type SaveVendorRequest = { name: string; supportEmail: string | null; supportPhone: string | null; contractReference: string | null; slaDetails: string | null };
export type AuditListItem = { id: string; entityName: string; entityId: string; action: string; actorReference: string; createdAt: string };
export type ApiTaskAssignment = { id: string; responsibility: string; partyReference: string; displayName?: string | null };
export type ApiTaskComment = { id: string; authorReference: string; body: string; createdAt: string };
export type ApiTaskStatusHistory = { id: string; fromStatus: string; toStatus: string; actorReference: string; comment?: string | null; createdAt: string };
export type ApiTaskLink = { id: string; type: string; isOutgoing: boolean; otherTaskId: string; otherTaskNumber: string; otherTaskTitle: string; otherTaskStatus: string };
export type ApiTaskAttachment = { id: string; fileName: string; contentType: string; size: number; uploadedBy: string; createdAt: string };
export type ApiSubtask = { id: string; taskNumber: string; title: string; type: string; status: string; priority: string; sprintId?: string | null; sprintName?: string | null; ownerUserId?: string | null; ownerDisplayName?: string | null; estimatedEffortMinutes?: number | null };
export type ApiTaskDetails = ApiTask & {
  description?: string | null;
  severity?: string | null;
  projectId: string;
  epicId?: string | null;
  featureId?: string | null;
  projectName: string;
  createdAt: string;
  updatedAt?: string | null;
  allowedTransitions: string[];
  statusHistory: ApiTaskStatusHistory[];
  assignments: ApiTaskAssignment[];
  comments: ApiTaskComment[];
  customFields: TaskCustomFieldValue[];
  links: ApiTaskLink[];
  attachments: ApiTaskAttachment[];
  parentTaskTitle?: string | null;
  subtasks?: ApiSubtask[];
};
export type CreateTaskRequest = {
  title: string;
  description: string | null;
  type: string;
  priority: string;
  severity: string | null;
  projectId: string;
  epicId?: string | null;
  featureId?: string | null;
  softwareApplicationId: string | null;
  dueDate: string | null;
  customFields: SaveTaskCustomFieldValue[];
  ownerUserId?: string | null;
  estimatedEffortMinutes?: number | null;
};
export type UpdateTaskRequest = CreateTaskRequest;
export type CreateSubtaskRequest = { title: string; description: string | null; type: string; priority: string; severity: string | null; dueDate: string | null; sprintId: string | null; customFields: SaveTaskCustomFieldValue[]; ownerUserId?: string | null; estimatedEffortMinutes?: number | null };

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getTasks(query: TaskListQuery = {}): Observable<PagedTasks> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<PagedTasks>(`${this.baseUrl}/tasks`, { params });
  }

  getTask(id: string): Observable<ApiTaskDetails> {
    return this.http.get<ApiTaskDetails>(`${this.baseUrl}/tasks/${id}`).pipe(map(task => ({ ...task, subtasks: task.subtasks ?? [] })));
  }

  getProjects(): Observable<ReferenceItem[]> {
    return this.http.get<ReferenceItem[]>(`${this.baseUrl}/reference-data/projects`);
  }

  getWorkItemTypeReferences(): Observable<WorkItemTypeReference[]> {
    return this.http.get<WorkItemTypeReference[]>(`${this.baseUrl}/reference-data/work-item-types`);
  }

  getWorkItemTypes(): Observable<WorkItemTypeListItem[]> {
    return this.http.get<WorkItemTypeListItem[]>(`${this.baseUrl}/configuration/work-item-types`);
  }

  createWorkItemType(request: CreateWorkItemTypeRequest): Observable<WorkItemTypeListItem> {
    return this.http.post<WorkItemTypeListItem>(`${this.baseUrl}/configuration/work-item-types`, request);
  }

  updateWorkItemType(id: string, request: UpdateWorkItemTypeRequest): Observable<WorkItemTypeListItem> {
    return this.http.put<WorkItemTypeListItem>(`${this.baseUrl}/configuration/work-item-types/${id}`, request);
  }

  getCustomFields(): Observable<CustomFieldItem[]> {
    return this.http.get<CustomFieldItem[]>(`${this.baseUrl}/configuration/custom-fields`);
  }

  getApplicableCustomFields(workItemType: string): Observable<ApplicableCustomField[]> {
    return this.http.get<ApplicableCustomField[]>(`${this.baseUrl}/configuration/custom-fields/applicable/${encodeURIComponent(workItemType)}`);
  }

  createCustomField(request: CreateCustomFieldRequest): Observable<CustomFieldItem> {
    return this.http.post<CustomFieldItem>(`${this.baseUrl}/configuration/custom-fields`, request);
  }

  updateCustomField(id: string, request: UpdateCustomFieldRequest): Observable<CustomFieldItem> {
    return this.http.put<CustomFieldItem>(`${this.baseUrl}/configuration/custom-fields/${id}`, request);
  }

  getWorkflow(projectId?: string | null): Observable<WorkflowDetails> {
    let params = new HttpParams(); if (projectId) params = params.set('projectId', projectId);
    return this.http.get<WorkflowDetails>(`${this.baseUrl}/configuration/workflows`, { params });
  }

  saveWorkflow(projectId: string | null, request: SaveWorkflowRequest): Observable<WorkflowDetails> {
    const url = projectId
      ? `${this.baseUrl}/configuration/workflows/${projectId}`
      : `${this.baseUrl}/configuration/workflows`;
    return this.http.put<WorkflowDetails>(url, request);
  }

  resetWorkflow(projectId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/configuration/workflows`, { params: { projectId } });
  }
  reconcileProjectWorkflowTasks(projectId: string): Observable<{ reconciledCount: number; entryStatus: string }> {
    return this.http.post<{ reconciledCount: number; entryStatus: string }>(`${this.baseUrl}/configuration/workflows/${projectId}/reconcile-tasks`, {});
  }
  getTransitionPermissions(): Observable<TransitionPermissionItem[]> { return this.http.get<TransitionPermissionItem[]>(`${this.baseUrl}/configuration/transition-permissions`); }
  saveTransitionPermissions(transitions: TransitionPermissionItem[]): Observable<TransitionPermissionItem[]> { return this.http.put<TransitionPermissionItem[]>(`${this.baseUrl}/configuration/transition-permissions`, { transitions }); }
  restoreTransitionPermissions(): Observable<TransitionPermissionItem[]> { return this.http.post<TransitionPermissionItem[]>(`${this.baseUrl}/configuration/transition-permissions/restore-defaults`, {}); }

  getProjectBoard(projectId: string): Observable<ProjectBoardDetails> { return this.http.get<ProjectBoardDetails>(`${this.baseUrl}/projects/${projectId}/board-settings`); }
  saveProjectBoard(projectId: string, request: SaveProjectBoardRequest): Observable<ProjectBoardDetails> { return this.http.put<ProjectBoardDetails>(`${this.baseUrl}/projects/${projectId}/board-settings`, request); }

  getBacklog(projectId: string): Observable<BacklogDetails> { return this.http.get<BacklogDetails>(`${this.baseUrl}/sprints/backlog/${projectId}`); }
  createSprint(request: SaveSprintRequest): Observable<SprintItem> { return this.http.post<SprintItem>(`${this.baseUrl}/sprints`, request); }
  updateSprint(id: string, request: SaveSprintRequest): Observable<SprintItem> { return this.http.put<SprintItem>(`${this.baseUrl}/sprints/${id}`, request); }
  startSprint(id: string): Observable<SprintItem> { return this.http.post<SprintItem>(`${this.baseUrl}/sprints/${id}/start`, {}); }
  completeSprint(id: string): Observable<SprintItem> { return this.http.post<SprintItem>(`${this.baseUrl}/sprints/${id}/complete`, {}); }
  assignTaskToSprint(taskId: string, sprintId: string | null): Observable<void> { return this.http.put<void>(`${this.baseUrl}/sprints/tasks/${taskId}/sprint`, { sprintId }); }
  getReleasePlan(projectId: string): Observable<ReleasePlan> { return this.http.get<ReleasePlan>(`${this.baseUrl}/releases/project/${projectId}`); }
  createRelease(request: SaveReleaseRequest): Observable<ReleaseItem> { return this.http.post<ReleaseItem>(`${this.baseUrl}/releases`, request); }
  updateRelease(id: string, request: SaveReleaseRequest): Observable<ReleaseItem> { return this.http.put<ReleaseItem>(`${this.baseUrl}/releases/${id}`, request); }
  publishRelease(id: string): Observable<ReleaseItem> { return this.http.post<ReleaseItem>(`${this.baseUrl}/releases/${id}/release`, {}); }
  archiveRelease(id: string): Observable<ReleaseItem> { return this.http.post<ReleaseItem>(`${this.baseUrl}/releases/${id}/archive`, {}); }
  assignTaskToRelease(taskId: string, releaseId: string | null): Observable<void> { return this.http.put<void>(`${this.baseUrl}/releases/tasks/${taskId}/fix-version`, { releaseId }); }

  getProjectList(): Observable<ProjectListItem[]> {
    return this.http.get<ProjectListItem[]>(`${this.baseUrl}/projects`);
  }

  getProject(id: string): Observable<ProjectDetails> {
    return this.http.get<ProjectDetails>(`${this.baseUrl}/projects/${id}`);
  }

  updateProject(id: string, request: UpdateProjectRequest): Observable<ProjectDetails> {
    return this.http.put<ProjectDetails>(`${this.baseUrl}/projects/${id}`, request);
  }

  archiveProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  getEpics(projectId?: string): Observable<EpicListItem[]> {
    return this.http.get<EpicListItem[]>(`${this.baseUrl}/epics`, { params: projectId ? { projectId } : {} });
  }

  createEpic(request: SaveEpicRequest): Observable<EpicListItem> { return this.http.post<EpicListItem>(`${this.baseUrl}/epics`, request); }
  updateEpic(id: string, request: SaveEpicRequest): Observable<EpicListItem> { return this.http.put<EpicListItem>(`${this.baseUrl}/epics/${id}`, request); }
  changeEpicStatus(id: string, status: string): Observable<EpicListItem> { return this.http.patch<EpicListItem>(`${this.baseUrl}/epics/${id}/status`, { status }); }
  getFeatures(projectId?: string, epicId?: string): Observable<FeatureListItem[]> { let params = new HttpParams(); if (projectId) params = params.set('projectId', projectId); if (epicId) params = params.set('epicId', epicId); return this.http.get<FeatureListItem[]>(`${this.baseUrl}/features`, { params }); }
  createFeature(request: SaveFeatureRequest): Observable<FeatureListItem> { return this.http.post<FeatureListItem>(`${this.baseUrl}/features`, request); }
  updateFeature(id: string, request: SaveFeatureRequest): Observable<FeatureListItem> { return this.http.put<FeatureListItem>(`${this.baseUrl}/features/${id}`, request); }
  changeFeatureStatus(id: string, status: string): Observable<FeatureListItem> { return this.http.patch<FeatureListItem>(`${this.baseUrl}/features/${id}/status`, { status }); }

  getProjectAccess(projectId: string): Observable<ProjectAccessUser[]> {
    return this.http.get<ProjectAccessUser[]>(`${this.baseUrl}/projects/${projectId}/access`);
  }

  addProjectRole(projectId: string, userId: string, role: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/projects/${projectId}/access/roles`, { userId, role });
  }

  removeProjectRole(projectId: string, userId: string, role: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/access/users/${userId}/roles/${encodeURIComponent(role)}`);
  }

  getSoftwareApplications(): Observable<ReferenceItem[]> {
    return this.http.get<ReferenceItem[]>(`${this.baseUrl}/reference-data/software-applications`);
  }

  getDepartments(): Observable<ReferenceItem[]> {
    return this.http.get<ReferenceItem[]>(`${this.baseUrl}/reference-data/departments`);
  }

  getSoftwareList(): Observable<SoftwareListItem[]> {
    return this.http.get<SoftwareListItem[]>(`${this.baseUrl}/operations/software`);
  }

  createSoftware(request: SaveSoftwareRequest): Observable<SoftwareListItem> {
    return this.http.post<SoftwareListItem>(`${this.baseUrl}/operations/software`, request);
  }

  updateSoftware(id: string, request: SaveSoftwareRequest): Observable<SoftwareListItem> {
    return this.http.put<SoftwareListItem>(`${this.baseUrl}/operations/software/${id}`, request);
  }

  getTeams(): Observable<TeamListItem[]> {
    return this.http.get<TeamListItem[]>(`${this.baseUrl}/operations/teams`);
  }

  getDepartmentList(): Observable<DepartmentListItem[]> {
    return this.http.get<DepartmentListItem[]>(`${this.baseUrl}/operations/departments`);
  }

  createDepartment(request: SaveDepartmentRequest): Observable<DepartmentListItem> {
    return this.http.post<DepartmentListItem>(`${this.baseUrl}/operations/departments`, request);
  }

  updateDepartment(id: string, request: SaveDepartmentRequest): Observable<DepartmentListItem> {
    return this.http.put<DepartmentListItem>(`${this.baseUrl}/operations/departments/${id}`, request);
  }

  createTeam(request: SaveTeamRequest): Observable<TeamListItem> {
    return this.http.post<TeamListItem>(`${this.baseUrl}/operations/teams`, request);
  }

  updateTeam(id: string, request: SaveTeamRequest): Observable<TeamListItem> {
    return this.http.put<TeamListItem>(`${this.baseUrl}/operations/teams/${id}`, request);
  }

  getVendors(): Observable<VendorListItem[]> {
    return this.http.get<VendorListItem[]>(`${this.baseUrl}/operations/vendors`);
  }

  createVendor(request: SaveVendorRequest): Observable<VendorListItem> {
    return this.http.post<VendorListItem>(`${this.baseUrl}/operations/vendors`, request);
  }

  updateVendor(id: string, request: SaveVendorRequest): Observable<VendorListItem> {
    return this.http.put<VendorListItem>(`${this.baseUrl}/operations/vendors/${id}`, request);
  }

  getAuditLog(take = 100): Observable<AuditListItem[]> {
    return this.http.get<AuditListItem[]>(`${this.baseUrl}/operations/audit`, { params: { take } });
  }

  createTask(request: CreateTaskRequest): Observable<ApiTask> {
    return this.http.post<ApiTask>(`${this.baseUrl}/tasks`, request);
  }

  createSubtask(parentTaskId: string, request: CreateSubtaskRequest): Observable<ApiTaskDetails> {
    return this.http.post<ApiTaskDetails>(`${this.baseUrl}/tasks/${parentTaskId}/subtasks`, request);
  }

  changeTaskStatus(id: string, status: string, comment: string | null, requireActiveSprint = false): Observable<ApiTaskDetails> {
    return this.http.patch<ApiTaskDetails>(`${this.baseUrl}/tasks/${id}/status`, { status, comment, requireActiveSprint });
  }

  updateTask(id: string, request: UpdateTaskRequest): Observable<ApiTaskDetails> {
    return this.http.put<ApiTaskDetails>(`${this.baseUrl}/tasks/${id}`, request);
  }

  addTaskComment(id: string, body: string): Observable<ApiTaskComment> {
    return this.http.post<ApiTaskComment>(`${this.baseUrl}/tasks/${id}/comments`, { body });
  }

  addTaskAssignment(id: string, responsibility: string, partyReference: string, displayName: string): Observable<ApiTaskAssignment> {
    return this.http.post<ApiTaskAssignment>(`${this.baseUrl}/tasks/${id}/assignments`, {
      responsibility,
      partyReference,
      displayName: displayName || null
    });
  }

  removeTaskAssignment(id: string, assignmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}/assignments/${assignmentId}`);
  }

  addTaskLink(id: string, type: string, targetTaskReference: string): Observable<ApiTaskLink> { return this.http.post<ApiTaskLink>(`${this.baseUrl}/tasks/${id}/links`, { type, targetTaskReference }); }
  removeTaskLink(id: string, linkId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/tasks/${id}/links/${linkId}`); }
  uploadTaskAttachment(id: string, file: File): Observable<ApiTaskAttachment> {
    const body = new FormData(); body.append('file', file);
    return this.http.post<ApiTaskAttachment>(`${this.baseUrl}/tasks/${id}/attachments`, body);
  }
  downloadTaskAttachment(id: string, attachmentId: string): Observable<Blob> { return this.http.get(`${this.baseUrl}/tasks/${id}/attachments/${attachmentId}`, { responseType: 'blob' }); }
  deleteTaskAttachment(id: string, attachmentId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/tasks/${id}/attachments/${attachmentId}`); }

  createProject(name: string, projectKey: string, objectives = ''): Observable<ReferenceItem> {
    return this.http.post<ReferenceItem>(`${this.baseUrl}/projects`, {
      name,
      projectKey: projectKey || null,
      objectives: objectives || null
    });
  }
}
