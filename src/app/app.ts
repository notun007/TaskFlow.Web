import { Component, forwardRef, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskFlowFacade } from './task-flow.facade';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  providers: [{ provide: TaskFlowFacade, useExisting: forwardRef(() => App) }],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None
})
export class App extends TaskFlowFacade {}
