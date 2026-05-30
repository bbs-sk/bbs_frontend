import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import localeId from '@angular/common/locales/id';

import Swal from 'sweetalert2';

import { ApiService } from 'src/app/shared/services/api.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { NgSelectModule } from '@ng-select/ng-select';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

registerLocaleData(localeId);

@Component({
  selector: 'app-transaksi',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, NgSelectModule, MatPaginatorModule],
  templateUrl: './transaksi.html',
  styleUrl: './transaksi.scss'
})
export class Transaksi implements OnInit {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  // =====================================================
  // DATA
  // =====================================================

  barangMasuk: any[] = [];
  barangKeluar: any[] = [];
  retur: any[] = [];
  barangList: any[] = [];
  selectedView: string = 'all';

  // =====================================================
  // FILTERED
  // =====================================================

  filteredBarangMasuk: any[] = [];
  filteredBarangKeluar: any[] = [];
  filteredRetur: any[] = [];

  // =====================================================
  // PAGINATED
  // =====================================================

  paginatedBarangMasuk: any[] = [];
  paginatedBarangKeluar: any[] = [];
  paginatedRetur: any[] = [];

  // =====================================================
  // STATE
  // =====================================================

  isLoading = false;

  showAddMasukModal = false;

  // =====================================================
  // SEARCH
  // =====================================================

  searchMasukKeyword = '';

  searchKeluarKeyword = '';

  searchReturKeyword = '';

  searchMasukFocused = false;

  searchKeluarFocused = false;

  searchReturFocused = false;
  // =====================================================
  // PAGINATION
  // =====================================================

  pageSizeMasuk = 10;
  pageIndexMasuk = 0;

  pageSizeKeluar = 10;
  pageIndexKeluar = 0;

  pageSizeRetur = 10;
  pageIndexRetur = 0;

  // =====================================================
  // FORM
  // =====================================================

  hargaBeliDisplay = '';

  addMasukForm!: FormGroup;

  userLogin: any = null;

  isGudang = false;

  // =====================================================
  // GETTER
  // =====================================================

  get totalPagesMasuk(): number {
    return Math.ceil(this.filteredBarangMasuk.length / this.pageSizeMasuk) || 1;
  }

  get totalPagesKeluar(): number {
    return Math.ceil(this.filteredBarangKeluar.length / this.pageSizeKeluar) || 1;
  }

  get totalPagesRetur(): number {
    return Math.ceil(this.filteredRetur.length / this.pageSizeRetur) || 1;
  }

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.userLogin = JSON.parse(localStorage.getItem('user') || '{}');

    this.isGudang = this.userLogin?.role === 'Gudang';

    this.addMasukForm = this.fb.group({
      id_barang: [null, Validators.required],
      jumlah: [null, [Validators.required, Validators.min(1)]],
      harga_beli: [null, [Validators.required, Validators.min(1)]]
    });

    this.loadData();
  }

  // =====================================================
  // LOAD DATA
  // =====================================================

  loadData(showLoading: boolean = true): void {
    this.isLoading = true;

    if (showLoading) {
      this.loadingAnimation();
    }

    Promise.all([
      this.api.getBarang().toPromise(),
      this.api.getBrgMasuk().toPromise(),
      this.api.getBrgKeluar().toPromise(),
      this.api.getRetur().toPromise()
    ])
      .then(([barang, masuk, keluar, retur]) => {
        this.barangList = Array.isArray(barang) ? barang : (barang?.val ?? []);

        this.barangMasuk = Array.isArray(masuk) ? masuk : (masuk?.val ?? []);

        this.barangKeluar = Array.isArray(keluar) ? keluar : (keluar?.val ?? []);

        this.retur = Array.isArray(retur) ? retur : (retur?.val ?? []);

        this.filteredBarangMasuk = [...this.barangMasuk];
        this.filteredBarangKeluar = [...this.barangKeluar];
        this.filteredRetur = [...this.retur];

        this.pageIndexMasuk = 0;
        this.pageIndexKeluar = 0;
        this.pageIndexRetur = 0;

        this.updatePaginatedMasuk();
        this.updatePaginatedKeluar();
        this.updatePaginatedRetur();

        this.isLoading = false;

        if (showLoading) {
          Swal.close();
        }

        this.cdr.detectChanges();
      })

      .catch(() => {
        this.barangList = [];

        this.barangMasuk = [];
        this.barangKeluar = [];
        this.retur = [];

        this.filteredBarangMasuk = [];
        this.filteredBarangKeluar = [];
        this.filteredRetur = [];

        this.paginatedBarangMasuk = [];
        this.paginatedBarangKeluar = [];
        this.paginatedRetur = [];

        this.isLoading = false;

        if (showLoading) {
          Swal.close();
        }

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Data transaksi gagal dimuat.'
        });

        this.cdr.detectChanges();
      });
  }

  isView(view: string): boolean {
    return this.selectedView === 'all' || this.selectedView === view;
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  updatePaginatedMasuk(): void {
    const startIndex = this.pageIndexMasuk * this.pageSizeMasuk;
    const endIndex = startIndex + this.pageSizeMasuk;

    this.paginatedBarangMasuk = this.filteredBarangMasuk.slice(startIndex, endIndex);
  }

  updatePaginatedKeluar(): void {
    const startIndex = this.pageIndexKeluar * this.pageSizeKeluar;
    const endIndex = startIndex + this.pageSizeKeluar;

    this.paginatedBarangKeluar = this.filteredBarangKeluar.slice(startIndex, endIndex);
  }

  updatePaginatedRetur(): void {
    const startIndex = this.pageIndexRetur * this.pageSizeRetur;
    const endIndex = startIndex + this.pageSizeRetur;

    this.paginatedRetur = this.filteredRetur.slice(startIndex, endIndex);
  }

  onPageMasukChange(event: PageEvent): void {
    this.pageIndexMasuk = event.pageIndex;
    this.pageSizeMasuk = event.pageSize;

    this.updatePaginatedMasuk();
  }

  onPageKeluarChange(event: PageEvent): void {
    this.pageIndexKeluar = event.pageIndex;
    this.pageSizeKeluar = event.pageSize;

    this.updatePaginatedKeluar();
  }

  onPageReturChange(event: PageEvent): void {
    this.pageIndexRetur = event.pageIndex;
    this.pageSizeRetur = event.pageSize;

    this.updatePaginatedRetur();
  }

  // =====================================================
  // SEARCH BARANG MASUK
  // =====================================================

  searchBarangMasuk(): void {
    const keyword = this.searchMasukKeyword.trim();

    if (!keyword) {
      this.filteredBarangMasuk = [...this.barangMasuk];

      this.pageIndexMasuk = 0;

      this.updatePaginatedMasuk();

      this.cdr.detectChanges();

      return;
    }

    this.loadingAnimation();

    this.api.searchBarangMasuk({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredBarangMasuk = Array.isArray(res) ? res : (res?.val ?? []);

        this.pageIndexMasuk = 0;

        this.updatePaginatedMasuk();

        Swal.close();

        this.cdr.detectChanges();
      },

      error: () => {
        this.filteredBarangMasuk = [];

        this.updatePaginatedMasuk();

        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Pencarian barang masuk gagal.'
        });
      }
    });
  }
  // =====================================================
  // SEARCH BARANG KELUAR
  // =====================================================

  searchBarangKeluar(): void {
    const keyword = this.searchKeluarKeyword.trim();

    if (!keyword) {
      this.filteredBarangKeluar = [...this.barangKeluar];

      this.pageIndexKeluar = 0;

      this.updatePaginatedKeluar();

      this.cdr.detectChanges();

      return;
    }

    this.loadingAnimation();

    this.api.searchBarangKeluar({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredBarangKeluar = Array.isArray(res) ? res : (res?.val ?? []);

        this.pageIndexKeluar = 0;

        this.updatePaginatedKeluar();

        Swal.close();

        this.cdr.detectChanges();
      },

      error: () => {
        this.filteredBarangKeluar = [];

        this.updatePaginatedKeluar();

        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Pencarian barang keluar gagal.'
        });
      }
    });
  }

  // =====================================================
  // SEARCH RETUR
  // =====================================================

  searchRetur(): void {
    const keyword = this.searchReturKeyword.trim();

    if (!keyword) {
      this.filteredRetur = [...this.retur];

      this.pageIndexRetur = 0;

      this.updatePaginatedRetur();

      this.cdr.detectChanges();

      return;
    }

    this.loadingAnimation();

    this.api.searchRetur({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredRetur = Array.isArray(res) ? res : (res?.val ?? []);

        this.pageIndexRetur = 0;

        this.updatePaginatedRetur();

        Swal.close();

        this.cdr.detectChanges();
      },

      error: () => {
        this.filteredRetur = [];

        this.updatePaginatedRetur();

        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Pencarian retur gagal.'
        });
      }
    });
  }

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  clearSearchMasuk(): void {
    this.searchMasukKeyword = '';

    this.filteredBarangMasuk = [...this.barangMasuk];

    this.pageIndexMasuk = 0;

    this.updatePaginatedMasuk();

    this.cdr.detectChanges();
  }

  clearSearchKeluar(): void {
    this.searchKeluarKeyword = '';

    this.filteredBarangKeluar = [...this.barangKeluar];

    this.pageIndexKeluar = 0;

    this.updatePaginatedKeluar();

    this.cdr.detectChanges();
  }

  clearSearchRetur(): void {
    this.searchReturKeyword = '';

    this.filteredRetur = [...this.retur];

    this.pageIndexRetur = 0;

    this.updatePaginatedRetur();

    this.cdr.detectChanges();
  }

  // =====================================================
  // UTIL
  // =====================================================

  getNamaBarang(id: number): string {
    const barang = this.barangList.find((b) => Number(b.id_barang) === Number(id));

    return barang ? barang.nama_barang : '-';
  }

  onHargaBeliInput(event: any): void {
    let value = event.target.value || '';

    value = value.replace(/\D/g, '');

    const numericValue = value ? Number(value) : null;

    this.addMasukForm.patchValue({
      harga_beli: numericValue
    });

    this.hargaBeliDisplay = numericValue ? numericValue.toLocaleString('id-ID') : '';
  }

  onlyNumber(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;

    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  // =====================================================
  // MODAL
  // =====================================================

  openAddMasuk(): void {
    this.addMasukForm.reset({
      id_barang: null,
      jumlah: null,
      harga_beli: null
    });

    this.hargaBeliDisplay = '';

    this.showAddMasukModal = true;
  }

  closeAddMasuk(): void {
    this.showAddMasukModal = false;
  }

  // =====================================================
  // ADD
  // =====================================================

  submitAddMasuk(): void {
    if (this.addMasukForm.invalid) {
      this.addMasukForm.markAllAsTouched();
      return;
    }

    this.api.addBrgMasuk(this.addMasukForm.value).subscribe({
      next: () => {
        const barang = this.barangList.find((b: any) => b.id_barang == this.addMasukForm.value.id_barang);

        const namaBarang = barang?.nama_barang || 'Barang';

        this.closeAddMasuk();

        this.cdr.detectChanges();

        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Barang "${namaBarang}" berhasil ditambahkan.`,
            timer: 2500,
            showConfirmButton: false
          }).then(() => {
            this.loadData(false);
          });
        }, 100);
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Barang masuk gagal ditambahkan.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // =====================================================
  // DELETE
  // =====================================================

  onDeleteMasuk(data: any): void {
    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus barang "${data.nama_barang}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteBrgMasuk(data.id_brg_masuk).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Barang "${data.nama_barang}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            }).then(() => {
              this.loadData(false);
            });
          },

          error: (err: any) => {
            const msg = err?.error?.message || err?.message || 'Data transaksi gagal dihapus.';

            Swal.fire({
              icon: 'error',
              title: 'Gagal',
              text: msg
            });
          }
        });
      }
    });
  }

  // =====================================================
  // LOADING
  // =====================================================

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
