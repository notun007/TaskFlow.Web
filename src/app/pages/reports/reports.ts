import { Component, inject, ViewEncapsulation } from '@angular/core';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-reports-page', standalone: true, templateUrl: './reports.html', styleUrl: './reports.scss', encapsulation: ViewEncapsulation.None })
export class ReportsPage { readonly workspace = inject(TaskFlowFacade); }
