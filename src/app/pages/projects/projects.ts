import { Component, inject, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-projects-page', standalone: true, imports: [DatePipe], templateUrl: './projects.html', styleUrl: './projects.scss', encapsulation: ViewEncapsulation.None })
export class ProjectsPage { readonly workspace = inject(TaskFlowFacade); }
