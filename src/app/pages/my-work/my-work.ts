import { Component, inject, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-my-work-page', standalone: true, imports: [DatePipe], templateUrl: './my-work.html', styleUrl: './my-work.scss', encapsulation: ViewEncapsulation.None })
export class MyWorkPage { readonly workspace = inject(TaskFlowFacade); }
