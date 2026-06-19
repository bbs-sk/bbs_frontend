import { Component, OnInit, OnDestroy, ChangeDetectorRef, LOCALE_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import Swal from 'sweetalert2';

import { ApiService } from 'src/app/shared/services/api.service';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

registerLocaleData(localeId);

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface Transaction {
  id_invoice: string;
  nama_project: string;
  date: string;
  total_items: number;
  total_produk: number;
  total_price: number;
  total_profit: number;
  status_pembayaran: string;
}

export interface SummaryData {
  totalTransaksi: number;
  totalPenjualan: number;
  totalKeuntungan: number;
  produkTerjual: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-laporan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // Angular Material
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatBadgeModule,
    MatTooltipModule,

    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [CurrencyPipe, DatePipe, { provide: LOCALE_ID, useValue: 'id-ID' }],
  templateUrl: './laporan.html',
  styleUrl: './laporan.scss'
})
export class Laporan implements OnInit, OnDestroy {
  displayedColumns: string[] = ['no', 'date', 'project', 'totalItems', 'totalPrice', 'profit', 'status'];

  filterForm!: FormGroup;

  allTransactions: Transaction[] = [];

  filteredTransactions: Transaction[] = [];

  isTyping = false;

  isLoading = false;

  summary: SummaryData = {
    totalTransaksi: 0,
    totalPenjualan: 0,
    totalKeuntungan: 0,
    produkTerjual: 0
  };

  private destroy$ = new Subject<void>();

  private lastStartDate: string | null = null;

  private lastEndDate: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // INIT
  // ───────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    this.filterForm = this.fb.group({
      startDate: [today],
      endDate: [today]
    });

    this.lastStartDate = this.localDateToString(today);

    this.lastEndDate = this.localDateToString(today);

    this.filterForm.valueChanges.subscribe((value) => {
      if (this.isTyping) return;

      const start = value.startDate;

      const end = value.endDate;

      if (!start || !end) return;

      const startStr = this.localDateToString(start);

      const endStr = this.localDateToString(end);

      // hindari trigger filter saat baru start date berubah
      if (this.lastStartDate !== null && this.lastEndDate !== null && startStr !== this.lastStartDate && endStr === this.lastEndDate) {
        this.lastStartDate = startStr;
        return;
      }

      this.lastStartDate = startStr;

      this.lastEndDate = endStr;

      this.applyFilter();
    });

    this.loadLaporanPenjualan();
  }

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD DATA
  // ───────────────────────────────────────────────────────────────────────────

  onManualEnter(): void {
    this.isTyping = false;

    this.applyFilter();
  }

  loadLaporanPenjualan(): void {
    this.isLoading = true;

    this.loadingAnimation();

    this.api.laporanPenjualan().subscribe({
      next: (res: any[]) => {
        this.allTransactions = res.map((item: any) => ({
          id_invoice: item.id_invoice,
          nama_project: item.nama_project,

          date: item.date,

          total_items: Number(item.total_items),

          total_produk: Number(item.total_produk),

          total_price: Number(item.total_price),

          total_profit: Number(item.total_profit ?? 0),

          status_pembayaran: item.status_pembayaran
        }));

        this.applyFilter();

        this.isLoading = false;

        Swal.close();

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Gagal mengambil laporan penjualan', err);

        this.isLoading = false;

        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Data laporan penjualan gagal dimuat.'
        });

        this.cdr.detectChanges();
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FILTER
  // ───────────────────────────────────────────────────────────────────────────

  applyFilter(): void {
    const start: Date | null = this.filterForm.get('startDate')?.value;
    const end: Date | null = this.filterForm.get('endDate')?.value;

    if (!start || !end) return;

    const startStr = this.localDateToString(start);
    const endStr = this.localDateToString(end);

    this.filteredTransactions = this.allTransactions.filter((t) => {
      const txDate = t.date.split(' ')[0]; // ← ambil "YYYY-MM-DD" saja
      return txDate >= startStr && txDate <= endStr;
    });

    this.recalcSummary();
  }

  private localDateToString(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatFileDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${day}-${month}-${year}`;
  }
  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────

  private recalcSummary(): void {
    this.summary = {
      totalTransaksi: this.filteredTransactions.length,

      totalPenjualan: this.filteredTransactions.reduce((sum, t) => sum + t.total_price, 0),

      totalKeuntungan: this.filteredTransactions.reduce((sum, t) => sum + t.total_profit, 0),

      produkTerjual: this.filteredTransactions.reduce((sum, t) => sum + t.total_items, 0)
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ───────────────────────────────────────────────────────────────────────────

  formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  }

  getRowIndex(row: Transaction): number {
    return this.filteredTransactions.indexOf(row) + 1;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EXPORT EXCEL
  // ───────────────────────────────────────────────────────────────────────────

  onExport(): void {
    if (this.filteredTransactions.length === 0) {
      return;
    }

    const start: Date | null = this.filterForm.get('startDate')?.value;
    const end: Date | null = this.filterForm.get('endDate')?.value;

    const periodeAwal = start ? this.formatTanggalIndo(start) : '-';
    const periodeAkhir = end ? this.formatTanggalIndo(end) : '-';

    // ── Baris data tabel (array of array, bukan object, biar urutan kolom pasti) ──
    const headers = ['No', 'Tanggal', 'Keterangan', 'Total Barang', 'Total Harga', 'Keuntungan', 'Status'];

    const dataRows = this.filteredTransactions.map((item, index) => {
      const tanggalFormatted = item.date.split(' ')[0].split('-').reverse().join('-') + ' ' + (item.date.split(' ')[1] || '');

      return [
        index + 1,
        tanggalFormatted,
        item.nama_project,
        `${item.total_items} pcs`,
        this.formatRupiah(item.total_price),
        this.formatRupiah(item.total_profit),
        item.status_pembayaran === 'lunas' ? 'Lunas' : item.status_pembayaran
      ];
    });

    const totalRow = [
      '',
      '',
      '',
      'TOTAL',
      this.formatRupiah(this.summary.totalPenjualan),
      this.formatRupiah(this.summary.totalKeuntungan),
      ''
    ];

    // ── Susun sheet: judul, periode, baris kosong, header, data, total ──
    const sheetData: any[][] = [[`LAPORAN PENJUALAN`], [`Periode: ${periodeAwal} – ${periodeAkhir}`], [], headers, ...dataRows, totalRow];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);

    // ── Merge cell untuk judul & periode supaya membentang penuh ──
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // judul
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } } // periode
    ];

    // ── AUTO-FIT lebar kolom: hitung panjang teks terpanjang per kolom ──
    const MIN_WIDTH = 8;
    const MAX_WIDTH = 40;
    const PADDING = 2;

    const colWidths = headers.map((h, colIndex) => {
      let maxLen = h.length;

      dataRows.forEach((row) => {
        const cellValue = row[colIndex] != null ? String(row[colIndex]) : '';
        maxLen = Math.max(maxLen, cellValue.length);
      });

      const totalCellValue = totalRow[colIndex] != null ? String(totalRow[colIndex]) : '';
      maxLen = Math.max(maxLen, totalCellValue.length);

      const width = Math.min(Math.max(maxLen + PADDING, MIN_WIDTH), MAX_WIDTH);
      return { wch: width };
    });

    worksheet['!cols'] = colWidths;

    // ── Susun workbook ──
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Laporan Penjualan': worksheet
      },
      SheetNames: ['Laporan Penjualan']
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    const startDate = start ? this.formatFileDate(start) : 'unknown';
    const endDate = end ? this.formatFileDate(end) : 'unknown';
    const fileName = `laporan-penjualan-${startDate}_sampai_${endDate}.xlsx`;

    FileSaver.saveAs(data, fileName);
  }

  private formatTanggalIndo(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOADING
  // ───────────────────────────────────────────────────────────────────────────

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
