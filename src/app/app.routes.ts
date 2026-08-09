import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage) },
  { path: 'my-work', loadComponent: () => import('./pages/my-work/my-work').then(m => m.MyWorkPage) },
  { path: 'projects', loadComponent: () => import('./pages/projects/projects').then(m => m.ProjectsPage) },
  { path: 'software', loadComponent: () => import('./pages/software/software').then(m => m.SoftwarePage) },
  { path: 'teams', loadComponent: () => import('./pages/teams/teams').then(m => m.TeamsPage) },
  { path: 'departments', loadComponent: () => import('./pages/departments/departments').then(m => m.DepartmentsPage) },
  { path: 'vendors', loadComponent: () => import('./pages/vendors/vendors').then(m => m.VendorsPage) },
  { path: 'reports', loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsPage) },
  { path: 'audit-log', loadComponent: () => import('./pages/audit-log/audit-log').then(m => m.AuditLogPage) },
  { path: 'create-account', loadComponent: () => import('./pages/create-account/create-account').then(m => m.CreateAccountPage) },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
