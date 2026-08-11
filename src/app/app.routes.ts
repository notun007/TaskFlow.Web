import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage) },
  { path: 'my-work', loadComponent: () => import('./pages/my-work/my-work').then(m => m.MyWorkPage) },
  { path: 'board', loadComponent: () => import('./pages/board/board').then(m => m.BoardPage) },
  { path: 'backlog', loadComponent: () => import('./pages/backlog/backlog').then(m => m.BacklogPage) },
  { path: 'sprints', loadComponent: () => import('./pages/sprints/sprints').then(m => m.SprintsPage) },
  { path: 'releases', loadComponent: () => import('./pages/releases/releases').then(m => m.ReleasesPage) },
  { path: 'projects', loadComponent: () => import('./pages/projects/projects').then(m => m.ProjectsPage) },
  { path: 'software', loadComponent: () => import('./pages/software/software').then(m => m.SoftwarePage) },
  { path: 'teams', loadComponent: () => import('./pages/teams/teams').then(m => m.TeamsPage) },
  { path: 'departments', loadComponent: () => import('./pages/departments/departments').then(m => m.DepartmentsPage) },
  { path: 'vendors', loadComponent: () => import('./pages/vendors/vendors').then(m => m.VendorsPage) },
  { path: 'work-item-types', loadComponent: () => import('./pages/work-item-types/work-item-types').then(m => m.WorkItemTypesPage) },
  { path: 'custom-fields', loadComponent: () => import('./pages/custom-fields/custom-fields').then(m => m.CustomFieldsPage) },
  { path: 'workflows', loadComponent: () => import('./pages/workflows/workflows').then(m => m.WorkflowsPage) },
  { path: 'reports', loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsPage) },
  { path: 'audit-log', loadComponent: () => import('./pages/audit-log/audit-log').then(m => m.AuditLogPage) },
  { path: 'create-account', loadComponent: () => import('./pages/create-account/create-account').then(m => m.CreateAccountPage) },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
