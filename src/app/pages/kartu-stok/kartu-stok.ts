import { Component, OnInit, OnDestroy, ChangeDetectorRef, LOCALE_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';

// Angular Material & NgSelect
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
import { NgSelectModule } from '@ng-select/ng-select';

import Swal from 'sweetalert2';

import { ApiService } from 'src/app/shared/services/api.service';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

registerLocaleData(localeId);

export interface StockMutation {
  tipe: 'masuk' | 'keluar' | 'retur';
  id_transaksi: number;
  datetime: string;
  jumlah: number;
  harga: number;
  keterangan: string;
  saldo_akhir: number;
}

@Component({
  selector: 'app-kartu-stok',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,

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
  templateUrl: './kartu-stok.html',
  styleUrl: './kartu-stok.scss'
})
export class KartuStok implements OnInit, OnDestroy {
  displayedColumns: string[] = ['no', 'date', 'keterangan', 'masuk', 'keluar', 'saldo'];

  filterForm!: FormGroup;
  barangList: any[] = [];
  mutations: StockMutation[] = [];
  stokAwal: number = 0;
  stokAkhir: number = 0;
  totalMasuk: number = 0;
  totalKeluar: number = 0;

  isLoading = false;
  isTyping = false;
  maxDate = new Date();

  private destroy$ = new Subject<void>();
  private lastStartDate: string | null = null;
  private lastEndDate: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm = this.fb.group({
      id_barang: [null, Validators.required],
      startDate: [firstDayOfMonth, Validators.required],
      endDate: [today, Validators.required]
    });

    this.lastStartDate = this.localDateToString(firstDayOfMonth);
    this.lastEndDate = this.localDateToString(today);

    this.loadBarangList();

    this.filterForm.valueChanges.subscribe((value) => {
      if (this.isTyping) return;

      const idBarang = value.id_barang;
      const start = value.startDate;
      const end = value.endDate;

      if (!idBarang) {
        this.mutations = [];
        this.stokAwal = 0;
        this.stokAkhir = 0;
        this.totalMasuk = 0;
        this.totalKeluar = 0;
        this.cdr.detectChanges();
        return;
      }

      if (!start || !end) return;

      const startStr = this.localDateToString(start);
      const endStr = this.localDateToString(end);

      // hindari double trigger saat baru mengubah start date
      if (this.lastStartDate !== null && this.lastEndDate !== null && startStr !== this.lastStartDate && endStr === this.lastEndDate) {
        this.lastStartDate = startStr;
        return;
      }

      this.lastStartDate = startStr;
      this.lastEndDate = endStr;

      this.loadKartuStock();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBarangList(): void {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barangList = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil daftar barang', err);
      }
    });
  }

  loadKartuStock(): void {
    const { id_barang, startDate, endDate } = this.filterForm.value;

    if (!id_barang || !startDate || !endDate) return;

    this.isLoading = true;
    this.loadingAnimation();

    const payload = {
      id_barang: Number(id_barang),
      startDate: this.localDateToString(startDate),
      endDate: this.localDateToString(endDate)
    };

    this.api.getKartuStock(payload).subscribe({
      next: (res: any) => {
        this.stokAwal = Number(res.stok_awal ?? 0);
        this.stokAkhir = Number(res.stok_akhir ?? 0);
        this.mutations = res.mutasi || [];

        this.calculateSummary();
        this.isLoading = false;
        Swal.close();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengambil kartu stok', err);
        this.isLoading = false;
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Data kartu stok gagal dimuat.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  calculateSummary(): void {
    this.totalMasuk = this.mutations
      .filter((m) => m.tipe === 'masuk')
      .reduce((sum, m) => sum + Number(m.jumlah), 0);

    this.totalKeluar = this.mutations
      .filter((m) => m.tipe === 'keluar' || m.tipe === 'retur')
      .reduce((sum, m) => sum + Number(m.jumlah), 0);
  }

  onManualEnter(): void {
    this.isTyping = false;
    this.loadKartuStock();
  }

  formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  }

  getRowIndex(row: StockMutation): number {
    return this.mutations.indexOf(row) + 1;
  }

  getSelectedBarangName(): string {
    const id = this.filterForm.get('id_barang')?.value;
    const barang = this.barangList.find((b) => Number(b.id_barang) === Number(id));
    return barang ? `${barang.kode_barang} - ${barang.nama_barang}` : '-';
  }

  getSelectedBarangSatuan(): string {
    const id = this.filterForm.get('id_barang')?.value;
    const barang = this.barangList.find((b) => Number(b.id_barang) === Number(id));
    return barang ? barang.satuan : '';
  }

  onExport(): void {
    if (this.mutations.length === 0 && this.stokAwal === 0) {
      return;
    }

    const start: Date | null = this.filterForm.get('startDate')?.value;
    const end: Date | null = this.filterForm.get('endDate')?.value;
    const barangName = this.getSelectedBarangName();
    const satuan = this.getSelectedBarangSatuan();

    const periodeAwal = start ? this.formatTanggalIndo(start) : '-';
    const periodeAkhir = end ? this.formatTanggalIndo(end) : '-';

    const headers = ['No', 'Tanggal', 'Keterangan', 'Masuk', 'Keluar', 'Saldo Akhir'];

    // Baris stok awal
    const startRow = [
      '',
      '',
      'SALDO AWAL (Stok Sebelum Periode)',
      '',
      '',
      `${this.stokAwal} ${satuan}`
    ];

    const dataRows = this.mutations.map((item, index) => {
      const tanggalFormatted = item.datetime.split(' ')[0].split('-').reverse().join('-') + ' ' + (item.datetime.split(' ')[1] || '');
      const masukVal = item.tipe === 'masuk' ? `${item.jumlah} ${satuan}` : '-';
      const keluarVal = (item.tipe === 'keluar' || item.tipe === 'retur') ? `${item.jumlah} ${satuan}` : '-';

      return [
        index + 1,
        tanggalFormatted,
        item.keterangan,
        masukVal,
        keluarVal,
        `${item.saldo_akhir} ${satuan}`
      ];
    });

    const endRow = [
      '',
      '',
      'SALDO AKHIR (Stok Akhir Periode)',
      '',
      '',
      `${this.stokAkhir} ${satuan}`
    ];

    // Summary rekap total
    const totalRow = [
      '',
      '',
      'TOTAL MUTASI PERIODE INI',
      `+${this.totalMasuk} ${satuan}`,
      `-${this.totalKeluar} ${satuan}`,
      ''
    ];

    const sheetData: any[][] = [
      [`KARTU STOK BARANG`],
      [`Barang: ${barangName}`],
      [`Periode: ${periodeAwal} – ${periodeAkhir}`],
      [],
      headers,
      startRow,
      ...dataRows,
      endRow,
      [],
      totalRow
    ];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Merge cells untuk header judul
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }
    ];

    // Auto-fit kolom
    const MIN_WIDTH = 10;
    const MAX_WIDTH = 45;
    const PADDING = 2;

    const colWidths = headers.map((h, colIndex) => {
      let maxLen = h.length;

      dataRows.forEach((row) => {
        const cellValue = row[colIndex] != null ? String(row[colIndex]) : '';
        maxLen = Math.max(maxLen, cellValue.length);
      });

      const startCell = startRow[colIndex] != null ? String(startRow[colIndex]) : '';
      maxLen = Math.max(maxLen, startCell.length);

      const endCell = endRow[colIndex] != null ? String(endRow[colIndex]) : '';
      maxLen = Math.max(maxLen, endCell.length);

      const totalCell = totalRow[colIndex] != null ? String(totalRow[colIndex]) : '';
      maxLen = Math.max(maxLen, totalCell.length);

      const width = Math.min(Math.max(maxLen + PADDING, MIN_WIDTH), MAX_WIDTH);
      return { wch: width };
    });

    worksheet['!cols'] = colWidths;

    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Kartu Stok': worksheet
      },
      SheetNames: ['Kartu Stok']
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
    const cleanBarangName = barangName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `kartu-stok-${cleanBarangName}-${startDate}_sampai_${endDate}.xlsx`;

    FileSaver.saveAs(data, fileName);
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

  private formatTanggalIndo(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  loadingAnimation(): void {
    Swal.fire({
      text: 'Sedang Mengambil Data Kartu Stok',
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
