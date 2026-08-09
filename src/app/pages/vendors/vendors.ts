import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskApiService, VendorListItem } from '../../task-api.service';
import { TaskFlowFacade } from '../../task-flow.facade';

@Component({ selector: 'app-vendors-page', standalone: true, templateUrl: './vendors.html', styleUrl: './vendors.scss', encapsulation: ViewEncapsulation.None })
export class VendorsPage {
  readonly workspace = inject(TaskFlowFacade);
  private readonly api = inject(TaskApiService);
  readonly showEditor = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly supportEmail = signal('');
  readonly supportPhone = signal('');
  readonly contractReference = signal('');
  readonly slaDetails = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');

  openCreate() { this.editingId.set(null); this.name.set(''); this.supportEmail.set(''); this.supportPhone.set(''); this.contractReference.set(''); this.slaDetails.set(''); this.saveError.set(''); this.showEditor.set(true); }
  openEdit(item: VendorListItem) { this.editingId.set(item.id); this.name.set(item.name); this.supportEmail.set(item.supportEmail ?? ''); this.supportPhone.set(item.supportPhone ?? ''); this.contractReference.set(item.contractReference ?? ''); this.slaDetails.set(item.slaDetails ?? ''); this.saveError.set(''); this.showEditor.set(true); }
  closeEditor() { if (!this.saving()) this.showEditor.set(false); }
  save() {
    if (!this.name().trim()) { this.saveError.set('Vendor name is required.'); return; }
    if (this.supportEmail().trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.supportEmail().trim())) { this.saveError.set('Enter a valid support email.'); return; }
    this.saving.set(true); this.saveError.set('');
    const optional = (value: string) => value.trim() || null;
    const request = { name: this.name().trim(), supportEmail: optional(this.supportEmail()), supportPhone: optional(this.supportPhone()), contractReference: optional(this.contractReference()), slaDetails: optional(this.slaDetails()) };
    const call = this.editingId() ? this.api.updateVendor(this.editingId()!, request) : this.api.createVendor(request);
    call.subscribe({ next: saved => { this.workspace.vendorRecords.update(items => [...items.filter(item => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name))); this.workspace.selectedVendor.set(saved); this.saving.set(false); this.showEditor.set(false); }, error: (error: HttpErrorResponse) => { this.saving.set(false); this.saveError.set(error.error?.message || 'Vendor could not be saved.'); } });
  }
}
