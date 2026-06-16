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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

registerLocaleData(localeId);

@Component({
  selector: 'app-transaksi',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    NgSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule // ← tambahkan ini
  ],
  templateUrl: './transaksi.html',
  styleUrl: './transaksi.scss'
})
export class Transaksi implements OnInit {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  barangMasuk: any[] = [];
  barangKeluar: any[] = [];
  retur: any[] = [];
  barangList: any[] = [];
  selectedView: string = 'all';

  filteredBarangMasuk: any[] = [];
  filteredBarangKeluar: any[] = [];
  filteredRetur: any[] = [];

  paginatedBarangMasuk: any[] = [];
  paginatedBarangKeluar: any[] = [];
  paginatedRetur: any[] = [];

  isLoading = false;

  showAddMasukModal = false;

  searchMasukKeyword = '';
  searchKeluarKeyword = '';
  searchReturKeyword = '';
  searchMasukFocused = false;
  searchKeluarFocused = false;
  searchReturFocused = false;

  pageSizeMasuk = 10;
  pageIndexMasuk = 0;

  pageSizeKeluar = 10;
  pageIndexKeluar = 0;

  pageSizeRetur = 10;
  pageIndexRetur = 0;

  hargaBeliDisplay = '';
  addMasukForm!: FormGroup;
  userLogin: any = null;
  isGudang = false;
  isSubmitting = false;

  // ─── Filter Tanggal ───────────────────────────
  filterForm!: FormGroup;
  isTyping = false;
  private lastStartDate: string | null = null;
  private lastEndDate: string | null = null;

  // ─── Filter Tanggal ───────────────────────────
  filterDateFrom = '';
  filterDateTo = '';

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

    // ── inisialisasi form tanggal ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null]
    });
    this.filterForm.valueChanges.subscribe((value) => {
      if (this.isTyping) return;
      const start = value.startDate;
      const end = value.endDate;
      if (!start || !end) return;
      const startStr = this.localDateToString(start);
      const endStr = this.localDateToString(end);
      if (this.lastStartDate !== null && this.lastEndDate !== null && startStr !== this.lastStartDate && endStr === this.lastEndDate) {
        this.lastStartDate = startStr;
        return;
      }
      this.lastStartDate = startStr;
      this.lastEndDate = endStr;
      this.applyDateFilter();
    });

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
    this.isSubmitting = false;
  }

  // =====================================================
  // ADD
  // =====================================================

  submitAddMasuk(): void {
    if (this.isSubmitting) return;
    if (this.addMasukForm.invalid) {
      this.addMasukForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.api.addBrgMasuk(this.addMasukForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
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
          }).then(() => this.loadData(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error?.message || err?.message || 'Barang masuk gagal ditambahkan.'
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
  // FILTER TANGGAL
  // =====================================================

  onManualEnter(): void {
    this.isTyping = false;
    this.applyDateFilter();
  }

  applyDateFilter(): void {
    const start: Date | null = this.filterForm.get('startDate')?.value;
    const end: Date | null = this.filterForm.get('endDate')?.value;

    if (!start || !end) {
      // tidak ada filter → tampilkan semua
      this.filteredBarangMasuk = [...this.barangMasuk];
      this.filteredBarangKeluar = [...this.barangKeluar];
      this.filteredRetur = [...this.retur];
    } else {
      const startStr = this.localDateToString(start);
      let endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      const inRange = (dateStr: string) => {
        const d = new Date(dateStr);
        return d >= start && d <= endDate;
      };

      this.filteredBarangMasuk = this.barangMasuk.filter((m) => inRange(m.datetime));
      this.filteredBarangKeluar = this.barangKeluar.filter((k) => inRange(k.datetime));
      this.filteredRetur = this.retur.filter((r) => inRange(r.datetime));
    }

    this.pageIndexMasuk = 0;
    this.pageIndexKeluar = 0;
    this.pageIndexRetur = 0;

    this.updatePaginatedMasuk();
    this.updatePaginatedKeluar();
    this.updatePaginatedRetur();
    this.cdr.detectChanges();
  }

  private localDateToString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // =====================================================
  // EXPORT CSV
  // =====================================================

  private formatFileDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }

  private getDateRangeSuffix(): { start: string; end: string } {
    const start: Date | null = this.filterForm?.get('startDate')?.value;
    const end: Date | null = this.filterForm?.get('endDate')?.value;
    return {
      start: start ? this.formatFileDate(start) : 'semua',
      end: end ? this.formatFileDate(end) : 'semua'
    };
  }

  private saveAsXlsx(sheetName: string, fileName: string, data: any[]): void {
    if (data.length === 0) return;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    FileSaver.saveAs(blob, fileName);
  }

  exportMasuk(): void {
    if (this.filteredBarangMasuk.length === 0) return;
    const { start, end } = this.getDateRangeSuffix();
    const exportData = this.filteredBarangMasuk.map((m, i) => ({
      No: i + 1,
      'Nama Barang': m.nama_barang,
      Jumlah: m.jumlah,
      'Harga Beli': m.harga_beli ?? 0,
      Tanggal: m.datetime ? new Date(m.datetime).toLocaleString('id-ID') : ''
    }));
    this.saveAsXlsx('Barang Masuk', `Barang_Masuk_${start}_sampai_${end}.xlsx`, exportData);
  }

  exportKeluar(): void {
    if (this.filteredBarangKeluar.length === 0) return;
    const { start, end } = this.getDateRangeSuffix();
    const exportData = this.filteredBarangKeluar.map((k, i) => ({
      No: i + 1,
      'Nama Barang': k.nama_barang,
      Keterangan: k.nama_project ?? '',
      Jumlah: k.jumlah,
      'Harga Jual': k.harga_jual ?? 0,
      Tanggal: k.datetime ? new Date(k.datetime).toLocaleString('id-ID') : ''
    }));
    this.saveAsXlsx('Barang Keluar', `Barang_Keluar_${start}_sampai_${end}.xlsx`, exportData);
  }

  exportRetur(): void {
    if (this.filteredRetur.length === 0) return;
    const { start, end } = this.getDateRangeSuffix();
    const exportData = this.filteredRetur.map((r, i) => ({
      No: i + 1,
      'Nama Barang': r.nama_barang,
      Keterangan: r.nama_project ?? '',
      Jumlah: r.jumlah,
      'Harga Jual': r.harga_jual ?? 0,
      Kondisi: r.kondisi ?? '',
      Tanggal: r.datetime ? new Date(r.datetime).toLocaleString('id-ID') : ''
    }));
    this.saveAsXlsx('Retur Barang', `Retur_${start}_sampai_${end}.xlsx`, exportData);
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
