import { Component, inject, ViewEncapsulation } from '@angular/core';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-dashboard-page', standalone: true, templateUrl: './dashboard.html', styleUrl: './dashboard.scss', encapsulation: ViewEncapsulation.None })
export class DashboardPage { readonly workspace = inject(TaskFlowFacade); }
