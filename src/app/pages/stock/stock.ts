import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.html',
  styleUrl: './stock.scss'
})
export class Stock {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  stock: any[] = [];

  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;

  addForm: any = {
    id_barang: null,
    jumlah: 0,
    status: '',
    harga: 0,
    id_invoice: null
  };

  barangList: any[] = [];

  editForm: any = {};
  deleteTarget: any = null;

  ngOnInit() {
    this.loadBarang();
    this.loadStock();
  }

  loadBarang() {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barangList = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }

  loadStock() {
    this.api.getStock().subscribe({
      next: (res: any) => {
        this.stock = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  getNamaBarang(id: number) {
    const barang = this.barangList.find((b) => b.id_barang === id);
    return barang ? barang.nama_barang : id;
  }

  getSatuanBarang(id: number) {
    const barang = this.barangList.find((b) => b.id_barang === id);
    return barang ? barang.satuan : '-';
  }

  openAdd() {
    this.addForm = {
      id_barang: null,
      jumlah: 0,
      status: 'Masuk',
      harga: 0,
      id_invoice: null
    };
    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  submitAdd() {
    this.api.addStock(this.addForm).subscribe({
      next: () => {
        this.closeAdd();
        this.loadStock();
      },
      error: (err) => console.log(err)
    });
  }

  onEdit(s: any) {
    this.editForm = { ...s };
    this.showEditModal = true;
  }

  closeEdit() {
    this.showEditModal = false;
  }

  submitEdit() {
    this.api.updateStock(this.editForm).subscribe({
      next: () => {
        this.closeEdit();
        this.loadStock();
      },
      error: (err) => console.log(err)
    });
  }

  onDelete(s: any) {
    this.deleteTarget = s;
    this.showDeleteModal = true;
  }

  closeDelete() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    const id = this.deleteTarget?.id_stock;

    this.api.deleteStock(id).subscribe({
      next: () => {
        this.closeDelete();
        this.loadStock();
      },
      error: (err) => console.log(err)
    });
  }
}
