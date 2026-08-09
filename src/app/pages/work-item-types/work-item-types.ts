import { Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskApiService, WorkItemTypeListItem } from '../../task-api.service';

@Component({ selector: 'app-work-item-types-page', standalone: true, templateUrl: './work-item-types.html', styleUrl: './work-item-types.scss', encapsulation: ViewEncapsulation.None })
export class WorkItemTypesPage implements OnInit {
  private readonly api = inject(TaskApiService);
  readonly records = signal<WorkItemTypeListItem[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly selected = signal<WorkItemTypeListItem | null>(null);
  readonly showEditor = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly key = signal('');
  readonly name = signal('');
  readonly description = signal('');
  readonly isActive = signal(true);
  readonly sortOrder = signal(100);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly filtered = computed(() => { const term = this.search().trim().toLowerCase(); return term ? this.records().filter(item => `${item.key} ${item.name} ${item.description || ''}`.toLowerCase().includes(term)) : this.records(); });

  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.loadError.set(''); this.api.getWorkItemTypes().subscribe({ next: items => { this.records.set(items); this.loading.set(false); }, error: () => { this.loading.set(false); this.loadError.set('Work item types could not be loaded.'); } }); }
  openCreate() { this.editingId.set(null); this.key.set(''); this.name.set(''); this.description.set(''); this.isActive.set(true); this.sortOrder.set((this.records().at(-1)?.sortOrder ?? 90) + 10); this.saveError.set(''); this.showEditor.set(true); }
  openEdit(item: WorkItemTypeListItem) { this.editingId.set(item.id); this.key.set(item.key); this.name.set(item.name); this.description.set(item.description ?? ''); this.isActive.set(item.isActive); this.sortOrder.set(item.sortOrder); this.saveError.set(''); this.showEditor.set(true); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }
  save() {
    if (!this.name().trim() || (!this.editingId() && !this.key().trim())) { this.saveError.set('Key and name are required.'); return; }
    this.saving.set(true); this.saveError.set('');
    const description = this.description().trim() || null;
    const call = this.editingId() ? this.api.updateWorkItemType(this.editingId()!, { name: this.name().trim(), description, isActive: this.isActive(), sortOrder: this.sortOrder() }) : this.api.createWorkItemType({ key: this.key().trim(), name: this.name().trim(), description, sortOrder: this.sortOrder() });
    call.subscribe({ next: saved => { this.records.update(items => [...items.filter(item => item.id !== saved.id), saved].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))); this.selected.set(saved); this.saving.set(false); this.showEditor.set(false); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.saveError.set(error.error?.message || 'Work item type could not be saved.'); } });
  }
}
