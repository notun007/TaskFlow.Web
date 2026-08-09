import { Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomFieldItem, SaveCustomFieldContext, SaveCustomFieldOption, TaskApiService, WorkItemTypeListItem } from '../../task-api.service';

@Component({ selector: 'app-custom-fields-page', standalone: true, templateUrl: './custom-fields.html', styleUrl: './custom-fields.scss', encapsulation: ViewEncapsulation.None })
export class CustomFieldsPage implements OnInit {
  private readonly api = inject(TaskApiService);
  readonly fieldTypes = ['Text', 'LongText', 'Number', 'Date', 'Boolean', 'Select', 'MultiSelect', 'User', 'Team'];
  readonly records = signal<CustomFieldItem[]>([]); readonly workItemTypes = signal<WorkItemTypeListItem[]>([]);
  readonly search = signal(''); readonly loading = signal(false); readonly loadError = signal(''); readonly showEditor = signal(false);
  readonly editingId = signal<string | null>(null); readonly key = signal(''); readonly name = signal(''); readonly description = signal('');
  readonly type = signal('Text'); readonly isActive = signal(true); readonly sortOrder = signal(100); readonly optionLines = signal('');
  readonly globalContext = signal(true); readonly selectedTypeIds = signal<string[]>([]); readonly required = signal(false); readonly defaultValue = signal('');
  readonly sectionName = signal('Additional information'); readonly showOnCreate = signal(true); readonly showOnEdit = signal(true); readonly showOnDetails = signal(true);
  readonly saving = signal(false); readonly saveError = signal('');
  readonly filtered = computed(() => { const term = this.search().trim().toLowerCase(); return term ? this.records().filter(x => `${x.key} ${x.name} ${x.type} ${x.description || ''}`.toLowerCase().includes(term)) : this.records(); });
  readonly requiresOptions = computed(() => ['Select', 'MultiSelect'].includes(this.type()));

  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.loadError.set(''); this.api.getCustomFields().subscribe({ next: items => { this.records.set(items); this.loading.set(false); }, error: () => { this.loading.set(false); this.loadError.set('Custom fields could not be loaded.'); } }); this.api.getWorkItemTypes().subscribe({ next: items => this.workItemTypes.set(items.filter(x => x.isActive)) }); }
  openCreate() { this.editingId.set(null); this.key.set(''); this.name.set(''); this.description.set(''); this.type.set('Text'); this.isActive.set(true); this.sortOrder.set((this.records().at(-1)?.sortOrder ?? 90) + 10); this.optionLines.set(''); this.globalContext.set(true); this.selectedTypeIds.set([]); this.required.set(false); this.defaultValue.set(''); this.sectionName.set('Additional information'); this.showOnCreate.set(true); this.showOnEdit.set(true); this.showOnDetails.set(true); this.saveError.set(''); this.showEditor.set(true); }
  openEdit(item: CustomFieldItem) { this.editingId.set(item.id); this.key.set(item.key); this.name.set(item.name); this.description.set(item.description ?? ''); this.type.set(item.type); this.isActive.set(item.isActive); this.sortOrder.set(item.sortOrder); this.optionLines.set(item.options.map(x => x.label).join('\n')); const global = item.contexts.some(x => !x.workItemTypeId); this.globalContext.set(global); this.selectedTypeIds.set(item.contexts.flatMap(x => x.workItemTypeId ? [x.workItemTypeId] : [])); const context = item.contexts[0]; this.required.set(item.contexts.some(x => x.isRequired)); this.defaultValue.set(item.contexts.find(x => x.defaultValue)?.defaultValue ?? ''); this.sectionName.set(context?.sectionName ?? 'Additional information'); this.showOnCreate.set(context?.showOnCreate ?? true); this.showOnEdit.set(context?.showOnEdit ?? true); this.showOnDetails.set(context?.showOnDetails ?? true); this.saveError.set(''); this.showEditor.set(true); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }
  toggleType(id: string, checked: boolean) { this.selectedTypeIds.update(ids => checked ? [...ids, id] : ids.filter(x => x !== id)); }
  save() {
    if (!this.name().trim() || (!this.editingId() && !this.key().trim())) { this.saveError.set('Key and name are required.'); return; }
    const labels = this.optionLines().split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (this.requiresOptions() && !labels.length) { this.saveError.set('Add at least one option, one per line.'); return; }
    if (!this.globalContext() && !this.selectedTypeIds().length) { this.saveError.set('Select at least one work item type or use the global context.'); return; }
    const options: SaveCustomFieldOption[] = this.requiresOptions() ? labels.map((label, i) => ({ value: label, label, sortOrder: (i + 1) * 10, isActive: true })) : [];
    if (!this.showOnCreate() && !this.showOnEdit() && !this.showOnDetails()) { this.saveError.set('Select at least one screen placement.'); return; }
    const context = (workItemTypeId: string | null): SaveCustomFieldContext => ({ workItemTypeId, isRequired: this.required(), defaultValue: this.defaultValue().trim() || null, sectionName: this.sectionName().trim() || 'Additional information', showOnCreate: this.showOnCreate(), showOnEdit: this.showOnEdit(), showOnDetails: this.showOnDetails() });
    const contexts = this.globalContext() ? [context(null)] : this.selectedTypeIds().map(context);
    this.saving.set(true); this.saveError.set(''); const common = { name: this.name().trim(), description: this.description().trim() || null, isActive: this.isActive(), sortOrder: this.sortOrder(), options, contexts };
    const call = this.editingId() ? this.api.updateCustomField(this.editingId()!, common) : this.api.createCustomField({ key: this.key().trim(), type: this.type(), ...common });
    call.subscribe({ next: saved => { this.records.update(items => [...items.filter(x => x.id !== saved.id), saved].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))); this.saving.set(false); this.showEditor.set(false); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.saveError.set(error.error?.message || 'Custom field could not be saved.'); } });
  }
}
