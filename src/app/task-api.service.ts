import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ApiTask = {
  id: string;
  taskNumber: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectName?: string | null;
};
export type PagedTasks = { items: ApiTask[]; totalCount: number; page: number; pageSize: number };
export type TaskListQuery = { search?: string; status?: string; priority?: string; projectId?: string; sortBy?: string; sortDirection?: string; page?: number; pageSize?: number };

export type ReferenceItem = { id: string; name: string };
export type ProjectListItem = { id: string; name: string; projectKey?: string | null; status: string; targetDate?: string | null; projectManager?: string | null; taskCount: number };
export type ProjectDetails = ProjectListItem & { objectives?: string | null; startDate?: string | null; sponsor?: string | null; softwareApplicationId?: string | null; softwareApplicationName?: string | null; createdAt: string; updatedAt?: string | null };
export type UpdateProjectRequest = { name: string; projectKey: string | null; objectives: string | null; status: string; startDate: string | null; targetDate: string | null; projectManager: string | null; sponsor: string | null; softwareApplicationId: string | null };
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
export type ApiTaskDetails = ApiTask & {
  description?: string | null;
  severity?: string | null;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt?: string | null;
  assignments: ApiTaskAssignment[];
  comments: ApiTaskComment[];
};
export type CreateTaskRequest = {
  title: string;
  description: string | null;
  type: string;
  priority: string;
  severity: string | null;
  projectId: string;
  softwareApplicationId: string | null;
  dueDate: string | null;
};
export type UpdateTaskRequest = CreateTaskRequest;

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getTasks(query: TaskListQuery = {}): Observable<PagedTasks> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<PagedTasks>(`${this.baseUrl}/tasks`, { params });
  }

  getTask(id: string): Observable<ApiTaskDetails> {
    return this.http.get<ApiTaskDetails>(`${this.baseUrl}/tasks/${id}`);
  }

  getProjects(): Observable<ReferenceItem[]> {
    return this.http.get<ReferenceItem[]>(`${this.baseUrl}/reference-data/projects`);
  }

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

  changeTaskStatus(id: string, status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/tasks/${id}/status`, status);
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

  createProject(name: string, projectKey: string, objectives = ''): Observable<ReferenceItem> {
    return this.http.post<ReferenceItem>(`${this.baseUrl}/projects`, {
      name,
      projectKey: projectKey || null,
      objectives: objectives || null
    });
  }
}
