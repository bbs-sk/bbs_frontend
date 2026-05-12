import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss'
})
export class Invoice {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  invoice: any[] = [];

  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;

  addForm: any = {
    id_user: null,
    id_proyek: null,
    total_harga: 0,
    status: 'pending',
    pembayaran: ''
  };

  editForm: any = {};
  deleteTarget: any = null;

  ngOnInit() {
    this.loadInvoice();
  }

  loadInvoice() {
    this.api.getInvoice().subscribe({
      next: (res: any) => {
        this.invoice = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  openAdd() {
    this.addForm = {
      id_user: null,
      id_proyek: null,
      total_harga: 0,
      status: 'pending',
      pembayaran: ''
    };
    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  submitAdd() {
    this.api.addInvoice(this.addForm).subscribe({
      next: () => {
        this.closeAdd();
        this.loadInvoice();
      },
      error: (err) => console.log(err)
    });
  }

  onEdit(i: any) {
    this.editForm = { ...i };
    this.showEditModal = true;
  }

  closeEdit() {
    this.showEditModal = false;
  }

  submitEdit() {
    this.api.updateInvoice(this.editForm).subscribe({
      next: () => {
        this.closeEdit();
        this.loadInvoice();
      },
      error: (err) => console.log(err)
    });
  }

  onDelete(i: any) {
    this.deleteTarget = i;
    this.showDeleteModal = true;
  }

  closeDelete() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    const id = this.deleteTarget?.id_invoice;

    this.api.deleteInvoice(id).subscribe({
      next: () => {
        this.closeDelete();
        this.loadInvoice();
      },
      error: (err) => console.log(err)
    });
  }
}
