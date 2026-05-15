import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-barang',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barang.html',
  styleUrl: './barang.scss'
})
export class Barang {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  barang: any[] = [];
  isLoading = false;

  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;

  addForm: any = {
    kode_barang: '',
    nama_barang: '',
    satuan: '',
    harga_jual: 0
  };

  editForm: any = {
    kode_barang: '',
    nama_barang: '',
    satuan: '',
    harga_jual: 0
  };

  deleteTarget: any = null;

  ngOnInit() {
    this.loadBarang();
  }

  loadBarang() {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barang = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
        console.log(this.barang);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  statusLabel(status: any) {
    return Number(status) === 1 ? 'Aktif' : 'Tidak Aktif';
  }

  statusClass(status: any) {
    return Number(status) === 1 ? 'bg-success' : 'bg-danger';
  }

  openAdd() {
    this.addForm = {
      kode_barang: '',
      nama_barang: '',
      satuan: '',
      harga_jual: 0
    };

    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  submitAdd() {
    this.api.addBarang(this.addForm).subscribe({
      next: () => {
        this.closeAdd();
        this.loadBarang();
      },
      error: (err) => console.log(err)
    });
  }

  onEdit(b: any) {
    this.editForm = { ...b };

    this.showEditModal = true;
  }

  closeEdit() {
    this.showEditModal = false;
  }

  submitEdit() {
    this.api.updateBarang(this.editForm).subscribe({
      next: () => {
        this.closeEdit();
        this.loadBarang();
      },
      error: (err) => console.log(err)
    });
  }

  onDelete(b: any) {
    this.deleteTarget = b;

    this.showDeleteModal = true;
  }

  closeDelete() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    const id = this.deleteTarget?.id_barang;

    this.api.deleteBarang(id).subscribe({
      next: () => {
        this.closeDelete();
        this.loadBarang();
      },
      error: (err) => console.log(err)
    });
  }
}
