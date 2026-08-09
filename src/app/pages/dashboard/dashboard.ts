import { Component, inject, ViewEncapsulation } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-dashboard-page', standalone: true, imports: [DatePipe, UpperCasePipe], templateUrl: './dashboard.html', styleUrl: './dashboard.scss', encapsulation: ViewEncapsulation.None })
export class DashboardPage { readonly workspace = inject(TaskFlowFacade); }
