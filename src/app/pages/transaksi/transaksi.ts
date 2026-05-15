import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-transaksi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaksi.html',
  styleUrl: './transaksi.scss'
})
export class Transaksi {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  barangMasuk: any[] = [];
  barangKeluar: any[] = [];
  retur: any[] = [];
  barangList: any[] = [];
  showAddMasukModal = false;
  showEditMasukModal = false;
  showDeleteMasukModal = false;
  addMasukForm: any = {
    id_barang: null,
    jumlah: 0,
    harga_beli: 0
  };
  editMasukForm: any = {};
  deleteMasukTarget: any = null;

  ngOnInit() {
    this.loadBarang();
    this.loadBarangMasuk();
    this.loadBarangKeluar();
    this.loadRetur();
  }

  loadBarang() {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barangList = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }

  loadBarangMasuk() {
    this.api.getBrgMasuk().subscribe({
      next: (res: any) => {
        this.barangMasuk = Array.isArray(res) ? res : (res?.val ?? []);

        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  loadBarangKeluar() {
    this.api.getBrgKeluar().subscribe({
      next: (res: any) => {
        this.barangKeluar = Array.isArray(res) ? res : (res?.val ?? []);

        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  loadRetur() {
    this.api.getRetur().subscribe({
      next: (res: any) => {
        this.retur = Array.isArray(res) ? res : (res?.val ?? []);

        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  getNamaBarang(id: number) {
    const barang = this.barangList.find((b) => b.id_barang === id);

    return barang ? barang.nama_barang : id;
  }

  openAddMasuk() {
    this.addMasukForm = {
      id_barang: null,
      jumlah: 0,
      harga_beli: 0
    };

    this.showAddMasukModal = true;
  }

  closeAddMasuk() {
    this.showAddMasukModal = false;
  }

  submitAddMasuk() {
    this.api.addBrgMasuk(this.addMasukForm).subscribe({
      next: () => {
        this.closeAddMasuk();
        this.loadBarangMasuk();
      },
      error: (err) => console.log(err)
    });
  }

  onEditMasuk(data: any) {
    this.editMasukForm = { ...data };
    this.showEditMasukModal = true;
  }

  closeEditMasuk() {
    this.showEditMasukModal = false;
  }

  submitEditMasuk() {
    this.api.updateBrgMasuk(this.editMasukForm).subscribe({
      next: () => {
        this.closeEditMasuk();
        this.loadBarangMasuk();
      },
      error: (err) => console.log(err)
    });
  }

  onDeleteMasuk(data: any) {
    this.deleteMasukTarget = data;
    this.showDeleteMasukModal = true;
  }

  closeDeleteMasuk() {
    this.showDeleteMasukModal = false;
    this.deleteMasukTarget = null;
  }

  confirmDeleteMasuk() {
    const id_brg_masuk = this.deleteMasukTarget?.id_brg_masuk;

    this.api.deleteBrgMasuk(id_brg_masuk).subscribe({
      next: () => {
        this.closeDeleteMasuk();
        this.loadBarangMasuk();
      },
      error: (err) => console.log(err)
    });
  }
}
