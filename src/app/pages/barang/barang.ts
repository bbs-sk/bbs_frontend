import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import localeId from '@angular/common/locales/id';
import { registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

registerLocaleData(localeId);

@Component({
  selector: 'app-barang',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatPaginatorModule, MatIconModule, MatButtonModule],
  templateUrl: './barang.html',
  styleUrl: './barang.scss'
})
export class Barang {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  userLogin: any = null;
  isRole = false;

  barang: any[] = [];
  filteredBarang: any[] = [];
  paginatedBarang: any[] = [];
  isLoading = false;
  pageSize = 10;
  pageIndex = 0;
  searchKeyword = '';
  searchFocused = false; // ← baru: untuk styling focus state search box
  isSubmitting = false;
  showAddModal = false;
  showEditModal = false;
  hargaJualDisplayAdd = '';
  hargaJualDisplayEdit = '';

  filterStock: 'all' | 'low' = 'all';

  addBarangForm!: FormGroup;
  editBarangForm!: FormGroup;

  // ← baru: getter untuk total halaman di toolbar
  get totalPages(): number {
    return Math.ceil(this.filteredBarang.length / this.pageSize) || 1;
  }

  get lowStockCount(): number {
    return this.barang.filter((b) => Number(b.jumlah) <= Number(b.min_jumlah)).length;
  }

  get role(): string {
    return this.userLogin?.role ?? '';
  }
  ngOnInit(): void {
    this.userLogin = JSON.parse(localStorage.getItem('user') || '{}');
    this.isRole = this.userLogin?.role === 'Gudang';
    this.loadBarang();
    this.addBarangForm = this.fb.group({
      kode_barang: ['', Validators.required],
      nama_barang: ['', Validators.required],
      satuan: [''],
      harga_jual: [null, Validators.required],
      min_jumlah: [0, [Validators.required, Validators.min(0)]]
    });

    this.editBarangForm = this.fb.group({
      id_barang: [null],
      kode_barang: ['', Validators.required],
      nama_barang: ['', Validators.required],
      satuan: [''],
      harga_jual: [null, Validators.required],
      min_jumlah: [0, [Validators.required, Validators.min(0)]],
      hpp: [null]
    });
  }

  loadBarang(showLoading: boolean = true): void {
    this.isLoading = true;

    if (showLoading) {
      this.loadingAnimation();
    }

    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barang = Array.isArray(res) ? res : (res?.val ?? []);
        this.filteredBarang = [...this.barang];
        this.pageIndex = 0;
        this.updatePaginatedData();
        this.isLoading = false;

        if (showLoading) {
          Swal.close();
        }

        this.cdr.detectChanges();
      },

      error: () => {
        this.barang = [];
        this.filteredBarang = [];
        this.paginatedBarang = [];
        this.isLoading = false;

        if (showLoading) {
          Swal.close();
        }

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Data barang gagal dimuat.'
        });

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
    this.addBarangForm.reset({
      kode_barang: '',
      nama_barang: '',
      satuan: '',
      harga_jual: null,
      min_jumlah: 0
    });

    this.hargaJualDisplayAdd = '';

    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
    this.isSubmitting = false;
  }

  onEdit(b: any): void {
    this.editBarangForm.patchValue({
      id_barang: b.id_barang,
      kode_barang: b.kode_barang ?? '',
      nama_barang: b.nama_barang ?? '',
      satuan: b.satuan ?? '',
      harga_jual: b.harga_jual ?? null,
      min_jumlah: b.min_jumlah ?? 0,
      hpp: b.hpp ?? null
    });

    this.hargaJualDisplayEdit = b.harga_jual ? Number(b.harga_jual).toLocaleString('id-ID') : '';

    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.isSubmitting = false;
  }

  submitAdd(): void {
    if (this.isSubmitting) return;
    if (this.addBarangForm.invalid) {
      this.addBarangForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.api.addBarang(this.addBarangForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        const nama = this.addBarangForm.value.nama_barang;
        this.closeAdd();
        this.cdr.detectChanges();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Barang "${nama}" berhasil ditambahkan.`,
            timer: 2500,
            showConfirmButton: false
          }).then(() => this.loadBarang(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error?.message || err?.message || 'Barang gagal ditambahkan.'
        });
      }
    });
  }

  submitEdit(): void {
    if (this.isSubmitting) return;
    if (this.editBarangForm.invalid) {
      this.editBarangForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.api.updateBarang(this.editBarangForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        const nama = this.editBarangForm.value.nama_barang;
        this.closeEdit();
        this.cdr.detectChanges();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Barang "${nama}" berhasil diperbarui.`,
            timer: 3000,
            showConfirmButton: false
          }).then(() => this.loadBarang(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error?.message || err?.message || 'Barang gagal diperbarui.'
        });
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
      if (!result.isConfirmed) return;

      // Jika stok masih ada, tampilkan konfirmasi tambahan
      if (Number(b.jumlah) > 0) {
        Swal.fire({
          title: 'Stok Masih Tersedia',
          html: `
          Barang <b>${b.nama_barang}</b> masih memiliki stok sebanyak
          <b>${b.jumlah}</b> ${b.satuan ?? ''}.<br><br>
          Apakah Anda benar-benar ingin menghapus barang ini?
        `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Ya, Tetap Hapus',
          cancelButtonText: 'Batal'
        }).then((confirmStock) => {
          if (confirmStock.isConfirmed) {
            this.deleteBarang(b);
          }
        });

        return;
      }

      // Jika stok 0 langsung hapus
      this.deleteBarang(b);
    });
  }

  private deleteBarang(b: any): void {
    this.api.deleteBarang(b.id_barang).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Barang "${b.nama_barang}" berhasil dihapus.`,
          timer: 2500,
          showConfirmButton: false
        }).then(() => {
          this.loadBarang(false);
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Barang gagal dihapus.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  onHargaJualInput(event: any, type: 'add' | 'edit'): void {
    const input = event.target.value;

    const numericValue = input.replace(/\D/g, '');

    const formattedValue = numericValue ? Number(numericValue).toLocaleString('id-ID') : '';

    if (type === 'add') {
      this.hargaJualDisplayAdd = formattedValue;

      this.addBarangForm.patchValue({
        harga_jual: numericValue ? Number(numericValue) : null
      });
    } else {
      this.hargaJualDisplayEdit = formattedValue;

      this.editBarangForm.patchValue({
        harga_jual: numericValue ? Number(numericValue) : null
      });
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

  formatRupiah(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return Number(value).toLocaleString('id-ID');
  }

  numberOnly(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  changeStockFilter(type: 'all' | 'low') {
    this.filterStock = type;

    if (type === 'all') {
      this.filteredBarang = [...this.barang];
    } else {
      this.filteredBarang = this.barang.filter((b) => Number(b.jumlah) < Number(b.min_jumlah));
    }

    this.pageIndex = 0;
    this.updatePaginatedData();
  }
}
