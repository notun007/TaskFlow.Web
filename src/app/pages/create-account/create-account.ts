import { Component, inject, ViewEncapsulation } from '@angular/core';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-create-account-page', standalone: true, templateUrl: './create-account.html', styleUrl: './create-account.scss', encapsulation: ViewEncapsulation.None })
export class CreateAccountPage { readonly workspace = inject(TaskFlowFacade); }
