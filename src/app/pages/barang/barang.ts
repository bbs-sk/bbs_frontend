import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import localeId from '@angular/common/locales/id';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeId);

@Component({
  selector: 'app-barang',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatIconModule, MatButtonModule],
  templateUrl: './barang.html',
  styleUrl: './barang.scss'
})
export class Barang {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  barang: any[] = [];
  filteredBarang: any[] = [];
  paginatedBarang: any[] = [];
  isLoading = false;
  pageSize = 20;
  pageIndex = 0;
  searchKeyword = '';
  searchFocused = false; // ← baru: untuk styling focus state search box

  showAddModal = false;
  showEditModal = false;
  hargaJualDisplayAdd = '';
  hargaJualDisplayEdit = '';

  addForm: any = {
    kode_barang: '',
    nama_barang: '',
    satuan: '',
    harga_jual: null
  };

  editForm: any = {
    id_barang: null,
    kode_barang: '',
    nama_barang: '',
    satuan: '',
    harga_jual: null,
    hpp: null
  };

  // ← baru: getter untuk total halaman di toolbar
  get totalPages(): number {
    return Math.ceil(this.filteredBarang.length / this.pageSize) || 1;
  }

  ngOnInit(): void {
    this.loadBarang();
  }

  loadBarang(): void {
    this.isLoading = true;
    this.loadingAnimation();
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barang = Array.isArray(res) ? res : (res?.val ?? []);
        this.filteredBarang = [...this.barang];
        this.pageIndex = 0;
        this.updatePaginatedData();
        this.isLoading = false;
        Swal.close();
        this.cdr.detectChanges();
      },
      error: () => {
        this.barang = [];
        this.filteredBarang = [];
        this.paginatedBarang = [];
        this.isLoading = false;
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data barang gagal dimuat.' });
        this.cdr.detectChanges();
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedBarang = this.filteredBarang.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  searchData(): void {
    const keyword = this.searchKeyword.trim();

    if (!keyword) {
      this.filteredBarang = [...this.barang];
      this.pageIndex = 0;
      this.updatePaginatedData();
      this.cdr.detectChanges();
      return;
    }

    this.loadingAnimation();

    this.api.searchBarang({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredBarang = Array.isArray(res) ? res : (res?.val ?? []);
        this.pageIndex = 0;
        this.updatePaginatedData();
        Swal.close();
        this.cdr.detectChanges();
      },
      error: () => {
        this.filteredBarang = [];
        this.pageIndex = 0;
        this.updatePaginatedData();
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Pencarian gagal dilakukan.' });
        this.cdr.detectChanges();
      }
    });
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.filteredBarang = [...this.barang];
    this.pageIndex = 0;
    this.updatePaginatedData();
  }

  openAdd(): void {
    this.addForm = {
      kode_barang: '',
      nama_barang: '',
      satuan: '',
      harga_jual: 0
    };
    this.hargaJualDisplayAdd = '';
    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
  }

  submitAdd(): void {
    this.api.addBarang(this.addForm).subscribe({
      next: () => {
        const nama = this.addForm.nama_barang;
        this.closeAdd();
        this.loadBarang();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Barang "${nama}" berhasil ditambahkan.`,
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Barang gagal ditambahkan.';
        Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
      }
    });
  }

  onEdit(b: any): void {
    this.editForm = {
      id_barang: b.id_barang,
      kode_barang: b.kode_barang ?? '',
      nama_barang: b.nama_barang ?? '',
      satuan: b.satuan ?? '',
      harga_jual: b.harga_jual ?? null,
      hpp: b.hpp ?? null
    };
    this.hargaJualDisplayEdit = this.editForm.harga_jual ? Number(this.editForm.harga_jual).toLocaleString('id-ID') : '';
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  submitEdit(): void {
    this.api.updateBarang(this.editForm).subscribe({
      next: () => {
        const nama = this.editForm.nama_barang;
        this.closeEdit();
        this.loadBarang();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Barang "${nama}" berhasil diperbarui.`,
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Barang gagal diperbarui.';
        Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
      }
    });
  }

  onDelete(b: any): void {
    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus barang "${b.nama_barang}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteBarang(b.id_barang).subscribe({
          next: () => {
            this.loadBarang();
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Barang "${b.nama_barang}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            });
          },
          error: (err: any) => {
            const msg = err?.error?.message || err?.message || 'Barang gagal dihapus.';
            Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
          }
        });
      }
    });
  }

  onHargaJualInput(type: 'add' | 'edit'): void {
    let rawValue = '';
    if (type === 'add') {
      rawValue = this.hargaJualDisplayAdd.replace(/\D/g, '');
      this.addForm.harga_jual = rawValue ? Number(rawValue) : null;
      this.hargaJualDisplayAdd = rawValue ? Number(rawValue).toLocaleString('id-ID') : '';
    } else {
      rawValue = this.hargaJualDisplayEdit.replace(/\D/g, '');
      this.editForm.harga_jual = rawValue ? Number(rawValue) : null;
      this.hargaJualDisplayEdit = rawValue ? Number(rawValue).toLocaleString('id-ID') : '';
    }
  }

  loadingAnimation(): void {
    Swal.fire({
      text: 'Sedang Mengambil Data',
      icon: 'info',
      timerProgressBar: true,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
}
