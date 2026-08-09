import { Component, inject, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-audit-log-page', standalone: true, imports: [DatePipe], templateUrl: './audit-log.html', styleUrl: './audit-log.scss', encapsulation: ViewEncapsulation.None })
export class AuditLogPage { readonly workspace = inject(TaskFlowFacade); }
