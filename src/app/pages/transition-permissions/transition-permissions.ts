import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskApiService, TransitionPermissionItem } from '../../task-api.service';

@Component({ selector: 'app-transition-permissions-page', standalone: true, templateUrl: './transition-permissions.html', styleUrl: './transition-permissions.scss', encapsulation: ViewEncapsulation.None })
export class TransitionPermissionsPage implements OnInit {
  private readonly api = inject(TaskApiService);
  readonly roles = [
    { value: 'Requester', label: 'Requester' }, { value: 'ProductOwner', label: 'Product Owner' },
    { value: 'TeamLead', label: 'Team Lead' }, { value: 'TeamMember', label: 'Team Member' },
    { value: 'ReviewerTester', label: 'Reviewer / Tester' }, { value: 'ProjectAdmin', label: 'Project Admin' }
  ];
  readonly scopes = [
    { value: 'AllProjectTasks', label: 'All project tasks' },
    { value: 'ReportedByCurrentUser', label: 'Reported by user' },
    { value: 'OwnedByCurrentUser', label: 'Owned by user' },
    { value: 'AssignedToCurrentUser', label: 'Any assignment to user' },
    { value: 'PrimaryAssignedToCurrentUser', label: 'Primary assignment to user' }
  ];
  readonly transitions = signal<TransitionPermissionItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  ngOnInit() { 
    this.load(); 
  }
  
  load() { 
    this.loading.set(true); 
    this.error.set(''); 
    this.message.set(''); 
    this.api.getTransitionPermissions().subscribe({ next: items => { 
      this.transitions.set(items); 
      this.loading.set(false); 
      this.dirty.set(false); 
    }, 
    error: error => { 
      this.loading.set(false); 
      this.error.set(this.errorMessage(error, 'Transition permissions could not be loaded.')); 
    } 
  }); 
}

  rule(item: TransitionPermissionItem, role: string) { 
    return item.rules.find(rule => rule.role === role); 
  }
  
  hasRole(item: TransitionPermissionItem, role: string) { 
    return !!this.rule(item, role); 
  }
  
  toggleRole(index: number, role: string, selected: boolean) { 
    this.transitions.update(items => items.map((item, i) => i === index ? { 
      ...item, rules: selected ? [...item.rules, { role, taskScope: 'AllProjectTasks' }] : item.rules.filter(value => value.role !== role) } : item)); 
      this.changed(); 
    }
  
  setScope(index: number, role: string, taskScope: string) { 
    this.transitions.update(items => items.map((item, i) => i === index ? { 
      ...item, rules: item.rules.map(rule => rule.role === role ? { ...rule, taskScope } : rule) } : item)); 
      this.changed(); 
    }
  
  save() { 
    const empty = this.transitions().find(item => !item.rules.length); 
    if (empty) { 
      this.error.set(`Assign at least one role to ${this.label(empty.fromStatus)} → ${this.label(empty.toStatus)}.`); 
      return; 
    } 
    
    if (!window.confirm('Apply these transition permissions and task scopes globally to every project?')) 
      return; 
    
    this.saving.set(true); 
    this.error.set(''); 
    this.message.set(''); 
    
    this.api.saveTransitionPermissions(this.transitions()).subscribe({ next: items => { 
      this.transitions.set(items); 
      this.saving.set(false); 
      this.dirty.set(false); 
      this.message.set('Global transition permissions and task scopes saved.'); 
    }, 
    error: error => { 
      this.saving.set(false); 
      this.error.set(this.errorMessage(error, 'Transition permissions could not be saved.')); 
    } 
  }); 
}

restore() { 
  if (!window.confirm('Restore the universal role defaults for every configured transition?')) 
    return; 
  
  this.saving.set(true); 
  this.error.set(''); 
  this.message.set(''); 
  this.api.restoreTransitionPermissions().subscribe({ next: items => { this.transitions.set(items); 
    this.saving.set(false); 
    this.dirty.set(false); 
    this.message.set('Universal transition defaults restored.'); 
  }, 
  error: error => { 
    this.saving.set(false); 
    this.error.set(this.errorMessage(error, 'Universal defaults could not be restored.')); 
  } 
}); 
}

label(value: string) { 
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace('Uat', 'UAT'); 
}

private changed() { 
  this.dirty.set(true); 
  this.error.set(''); 
  this.message.set(''); 
}

private errorMessage(error: HttpErrorResponse, fallback: string) { 
  return error.status === 403 ? 'Only a system Administrator can configure transition permissions.' : error.error?.message || fallback; 
}

}
