import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskFlowFacade } from '../../task-flow.facade';
import { SoftwareListItem, TaskApiService } from '../../task-api.service';

@Component({ selector: 'app-software-page', standalone: true, templateUrl: './software.html', styleUrl: './software.scss', encapsulation: ViewEncapsulation.None })
export class SoftwarePage {
  readonly workspace = inject(TaskFlowFacade);
  private readonly api = inject(TaskApiService);
  readonly showEditor = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly businessOwner = signal('');
  readonly technicalOwner = signal('');
  readonly supportTeam = signal('');
  readonly criticality = signal('Medium');
  readonly technology = signal('');
  readonly currentVersion = signal('');
  readonly isProduction = signal(false);
  readonly isThirdParty = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');

  openCreate() { this.populate(null); }
  openEdit(item: SoftwareListItem) { this.populate(item); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }

  save() {
    if (!this.name().trim()) { this.saveError.set('Software name is required.'); return; }
    this.saving.set(true); this.saveError.set('');
    const request = { name: this.name().trim(), businessOwner: this.value(this.businessOwner()), technicalOwner: this.value(this.technicalOwner()), supportTeam: this.value(this.supportTeam()), criticality: this.value(this.criticality()), technology: this.value(this.technology()), currentVersion: this.value(this.currentVersion()), isProduction: this.isProduction(), isThirdParty: this.isThirdParty(), vendorId: null };
    const call = this.editingId() ? this.api.updateSoftware(this.editingId()!, request) : this.api.createSoftware(request);
    call.subscribe({ next: saved => { this.workspace.softwareRecords.update(items => [...items.filter(item => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name))); this.workspace.selectedSoftware.set(saved); this.saving.set(false); this.showEditor.set(false); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.saveError.set(error.error?.message || 'Software could not be saved.'); } });
  }

  private populate(item: SoftwareListItem | null) {
    this.editingId.set(item?.id ?? null); this.name.set(item?.name ?? ''); this.businessOwner.set(item?.businessOwner ?? ''); this.technicalOwner.set(item?.technicalOwner ?? ''); this.supportTeam.set(item?.supportTeam ?? ''); this.criticality.set(item?.criticality ?? 'Medium'); this.technology.set(item?.technology ?? ''); this.currentVersion.set(item?.currentVersion ?? ''); this.isProduction.set(item?.isProduction ?? false); this.isThirdParty.set(item?.isThirdParty ?? false); this.saveError.set(''); this.showEditor.set(true);
  }
  private value(value: string) { return value.trim() || null; }
}
