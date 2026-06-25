import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { NgSelectModule } from '@ng-select/ng-select';
import localeId from '@angular/common/locales/id';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';

registerLocaleData(localeId);

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatIconModule, MatButtonModule, NgSelectModule],
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss'
})
export class Invoice {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  // ─── Data ───────────────────────────────────
  invoice: any[] = [];
  filteredInvoice: any[] = [];
  paginatedInvoice: any[] = [];
  project: any[] = [];
  barang: any[] = [];
  isLoading = false;
  filterStatus = '';
  filterSource = 'all'; // 'all' | 'self' | 'lapangan' | 'gudang' | 'kantor'

  // ─── Pagination ─────────────────────────────
  pageSize = 10;
  pageIndex = 0;
  get totalPages(): number {
    return Math.ceil(this.filteredInvoice.length / this.pageSize) || 1;
  }

  // ─── Search ─────────────────────────────────
  searchKeyword = '';
  searchFocused = false;

  // ─── User / role ────────────────────────────
  idUser = 1;
  userLogin: any = null;
  get role(): string {
    return this.userLogin?.role ?? '';
  }
  isOwner(invoice: any): boolean {
    return Number(invoice.id_user) === Number(this.userLogin?.id_user);
  }

  // ─── Modal flags ────────────────────────────
  showAddModal = false;
  showEditModal = false;
  showDetailModal = false;
  showReturModal = false;
  showSuratJalanModal = false;
  // ─── Loading flags ───────────────────────────
  isSubmitting = false;

  // ─── Modal status (ringkas) ────────────────────
  showStatusModal = false;
  statusInvoice: any = null;
  statusForm: any = { id_invoice: null, status: '' };

  // ─── Dropdown aksi (⋮) ──────────────────────
  activeMenuId: number | null = null;
  activeStatusId: number | null = null;

  // ─── Surat jalan ────────────────────────────
  suratJalanData: any = null;
  suratJalanForm: any = { id_invoice: null, no_surat_jalan: '', plat_kendaraan: '' };

  // ─── Form Tambah ────────────────────────────
  addForm: any = { id_user: null, id_project: null, total_harga: 0, pembayaran: null, detail: '' };
  selectedBarang: any[] = [];
  dropdownTop = 0;
  dropdownLeft = 0;
  jumlahJenisBarang: number | null = null;

  // ─── Form Edit ──────────────────────────────
  editForm: any = {};
  editBarang: any[] = [];

  // ─── Detail ─────────────────────────────────
  detailInvoice: any = null;
  detailBarang: any[] = [];
  detailRetur: any[] = [];

  // ─── Retur (modal terpisah) ─────────────────
  returInvoice: any = null;
  returBarang: any[] = [];

  addErrors: { [key: string]: string } = {};
  addBarangErrors: { [key: string]: string }[] = [];

  editErrors: { [key: string]: string } = {};
  editBarangErrors: { [key: string]: string }[] = [];

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────
  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.userLogin = JSON.parse(userData);
      this.idUser = this.userLogin.id_user;
    }
    this.loadInvoice();
    this.getProject();
    this.getBarang();
  }

  // Tutup popover & dropdown kalau klik di luar
  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeMenuId = null;
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────
  // Load data
  // ─────────────────────────────────────────────
  loadInvoice(showLoading = true): void {
    this.isLoading = true;
    if (showLoading) this.loadingAnimation();
    this.api.getInvoiceRole({ role: this.userLogin?.role, id_user: this.userLogin?.id_user }).subscribe({
      next: (res: any) => {
        this.invoice = Array.isArray(res) ? res : (res?.val ?? []);
        this.filteredInvoice = [...this.invoice];
        this.filterStatus = '';
        this.pageIndex = 0;
        this.updatePaginatedData();
        this.isLoading = false;
        if (showLoading) Swal.close();
        this.cdr.detectChanges();
      },
      error: () => {
        this.invoice = [];
        this.filteredInvoice = [];
        this.paginatedInvoice = [];
        this.isLoading = false;
        if (showLoading) Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data pemesanan barang gagal dimuat.' });
        this.cdr.detectChanges();
      }
    });
  }

  getProject(): void {
    this.api.getProject().subscribe({
      next: (res: any) => {
        let data = Array.isArray(res) ? res : (res?.val ?? []);

        // if (this.role === 'Gudang') {
        //   data = data.filter((p: any) => p.id_project == 0);
        // } else
        if (this.role === 'Lapangan') {
          data = data.filter((p: any) => p.id_user1 == this.userLogin?.id_user || p.id_user2 == this.userLogin?.id_user);
        }

        this.project = data;
      },
      error: (err) => console.log(err)
    });
  }

  getBarang(): void {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barang = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }

  // ─────────────────────────────────────────────
  // Pagination & Search
  // ─────────────────────────────────────────────
  updatePaginatedData(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedInvoice = this.filteredInvoice.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  searchData(): void {
    const keyword = this.searchKeyword.trim();
    if (!keyword) {
      this.filteredInvoice = [...this.invoice];
      this.pageIndex = 0;
      this.updatePaginatedData();
      this.cdr.detectChanges();
      return;
    }
    this.loadingAnimation();
    this.api.searchPemesanan({ keyword, role: this.role, id_user: this.userLogin?.id_user }).subscribe({
      next: (res: any) => {
        this.filteredInvoice = Array.isArray(res) ? res : (res?.val ?? []);
        this.pageIndex = 0;
        this.updatePaginatedData();
        Swal.close();
        this.cdr.detectChanges();
      },
      error: () => {
        this.filteredInvoice = [];
        this.pageIndex = 0;
        this.updatePaginatedData();
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Pencarian gagal.' });
        this.cdr.detectChanges();
      }
    });
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    this.applyFilters();
  }

  applySourceFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let base = [...this.invoice];

    // ── Filter status ──
    if (this.filterStatus === 'pay_lunas') {
      base = base.filter((i: any) => i.pembayaran === 'lunas');
    } else if (this.filterStatus === 'pay_belum') {
      base = base.filter((i: any) => i.pembayaran === 'belum');
    } else if (this.filterStatus) {
      base = base.filter((i: any) => i.status === this.filterStatus);
    }

    // ── Filter sumber (hanya untuk Gudang & Admin Kantor) ──
    if (this.filterSource !== 'all' && this.role !== 'Lapangan') {
      base = base.filter((i: any) => {
        const isSelf = this.isOwner(i);
        switch (this.filterSource) {
          case 'self':     return isSelf;
          case 'lapangan': return i.user_role === 'Lapangan';    // termasuk diri sendiri jika role-nya Lapangan
          case 'gudang':   return i.user_role === 'Gudang';       // semua pesanan Gudang, termasuk milikmu
          case 'kantor':   return i.user_role === 'Admin Kantor'; // semua pesanan Admin Kantor, termasuk milikmu
          default:         return true;
        }
      });
    }

    this.filteredInvoice = base;
    this.pageIndex = 0;
    this.updatePaginatedData();
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────
  // Modal Status (ringkas)
  // ─────────────────────────────────────────────
  openStatus(invoice: any): void {
    this.activeMenuId = null;
    this.statusInvoice = invoice;
    this.statusForm = { id_invoice: invoice.id_invoice, status: '' };
    this.showStatusModal = true;
    this.cdr.detectChanges();
  }

  closeStatus(): void {
    this.showStatusModal = false;
    this.isSubmitting = false;
    this.statusInvoice = null;
    this.statusForm = { id_invoice: null, status: '' };
  }

  submitStatus(): void {
    if (this.isSubmitting) return;
    if (!this.statusForm.status) {
      Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Pilih status baru terlebih dahulu.' });
      return;
    }

    this.isSubmitting = true;
    const proyek = this.statusInvoice?.nama_project || 'Proyek';

    this.api.updateStatusInvoice(this.statusForm).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeStatus();
        this.cdr.detectChanges();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Status "${proyek}" berhasil diperbarui.`,
            timer: 2000,
            showConfirmButton: false
          }).then(() => this.loadInvoice(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Status gagal diperbarui.' });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Dropdown Aksi (⋮)
  // ─────────────────────────────────────────────
  toggleMenu(event: Event, id: number): void {
    event.stopPropagation();
    this.activeStatusId = null;

    if (this.activeMenuId === id) {
      this.activeMenuId = null;
    } else {
      this.activeMenuId = id;

      // Hitung posisi tombol ⋮ relatif ke viewport
      const btn = event.target as HTMLElement;
      const trigger = btn.closest('button') ?? btn;
      const rect = trigger.getBoundingClientRect();

      this.dropdownTop = rect.top - 4; // sedikit di atas tombol (akan dikurangi tinggi dropdown via transform)
      this.dropdownLeft = rect.right - 160; // rata kanan dengan tombol, 160 = min-width dropdown
    }

    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────
  // Kontrol aksi per role & status
  // ─────────────────────────────────────────────
  showPembayaranOnAdd(): boolean {
    return this.role !== 'Lapangan';
  }
  showPembayaranOnEdit(): boolean {
    return this.role !== 'Lapangan';
  }

  isFieldsLockedOnEdit(): boolean {
    if (this.role === 'Admin Kantor') {
      if (this.editForm?.user_role === 'Gudang') return false; // Admin bebas edit pesanan Gudang
      const lockedStatus = ['menunggu', 'disetujui', 'dikirim', 'selesai', 'ditolak'];
      return this.editForm?.id_user !== this.userLogin?.id_user || lockedStatus.includes(this.editForm?.status);
    }
    if (this.role === 'Gudang') {
      const lockedStatus = ['menunggu', 'disetujui', 'dikirim', 'ditolak'];
      return !this.isOwner(this.editForm) || lockedStatus.includes(this.editForm?.status);
    }
    if (this.role === 'Lapangan') {
      return !(this.editForm?.id_user === this.userLogin?.id_user && this.editForm?.status === 'menunggu');
    }
    return false;
  }

  canEdit(invoice: any): boolean {
    if (this.role === 'Admin Kantor') return true;
    if (this.role === 'Lapangan') return this.isOwner(invoice) && invoice.status === 'menunggu';
    if (this.role === 'Gudang') return this.isOwner(invoice);
    return false;
  }

  canDelete(invoice: any): boolean {
    const s = invoice.status;
    if (this.role === 'Admin Kantor') {
      if (invoice.user_role === 'Gudang') return true; // Admin bisa hapus semua pesanan Gudang
      return this.isOwner(invoice) && s !== 'dikirim' && s !== 'selesai';
    }
    if (this.role === 'Lapangan') return this.isOwner(invoice) && s === 'menunggu';
    if (this.role === 'Gudang') return this.isOwner(invoice);
    return false;
  }

  canUpdateStatus(invoice: any): boolean {
    const s = invoice.status;
    if (this.role === 'Admin Kantor') {
      if (s === 'menunggu' || s === 'disetujui' || s === 'ditolak') return true;
      if (s === 'dikirim' && this.isOwner(invoice)) return true;
      return false;
    }
    if (this.role === 'Gudang') return s === 'dipesan' || s === 'disetujui' || s === 'dikirim';
    if (this.role === 'Lapangan') return this.isOwner(invoice) && s === 'dikirim';
    return false;
  }

  getAvailableStatus(invoice: any): string[] {
    const s = invoice?.status;
    if (this.role === 'Admin Kantor') {
      if (s === 'menunggu') return ['disetujui', 'ditolak'];
      if (s === 'disetujui' || s === 'ditolak') return ['disetujui', 'ditolak'];
      if (s === 'dikirim' && this.isOwner(invoice)) return ['selesai'];
      return [];
    }
    if (this.role === 'Gudang') {
      if (s === 'dipesan' || s === 'disetujui') return ['dikirim'];
      if (s === 'dikirim') return ['dikirim'];
      return [];
    }
    if (this.role === 'Lapangan') {
      if (s === 'dikirim') return ['selesai'];
      return [];
    }
    return [];
  }

  canRetur(invoice: any): boolean {
    if (invoice.id_project == 0) return false;
    const s = invoice.status;
    const isAllowed = this.isOwner(invoice) || (this.role === 'Admin Kantor' && invoice.user_role === 'Gudang');
    return isAllowed && (s === 'dikirim' || s === 'selesai');
  }

  showSuratJalanBtn(): boolean {
    if (this.role !== 'Gudang' && this.role !== 'Admin Kantor') return false;
    if (this.detailInvoice?.id_project == 0) return false;
    const s = this.detailInvoice?.status;
    return s === 'dikirim' || s === 'selesai';
  }

  isSuratJalanReadOnly(): boolean {
    return false;
  }

  // ─────────────────────────────────────────────
  // Modal Tambah
  // ─────────────────────────────────────────────
  openAdd(): void {
    let defaultStatus = 'menunggu';
    let defaultPembayaran: string | null = 'belum';
    if (this.role === 'Admin Kantor') defaultStatus = 'dipesan';
    else if (this.role === 'Gudang') defaultStatus = 'selesai';

    this.addForm = {
      id_user: this.idUser,
      id_project: null,
      nama_pemesan: '',
      total_harga: 0,
      status: defaultStatus,
      pembayaran: defaultPembayaran,
      detail: ''
    };
    this.jumlahJenisBarang = null;
    this.selectedBarang = [];

    // Reset errors setiap buka modal
    this.addErrors = {};
    this.addBarangErrors = [];

    this.showAddModal = true;
  }

  validateAdd(): boolean {
    this.addErrors = {};
    this.addBarangErrors = [];
    let valid = true;

    if (!this.addForm.nama_pemesan?.trim()) {
      this.addErrors['nama_pemesan'] = 'Nama pemesan harus diisi.';
      valid = false;
    }

    // Validasi proyek (kecuali Gudang yang id_project-nya sudah di-set otomatis)
    if (this.role !== 'Gudang' && !this.addForm.id_project) {
      this.addErrors['id_project'] = 'Proyek harus dipilih.';
      valid = false;
    }

    // Validasi minimal ada 1 barang
    if (this.selectedBarang.length === 0) {
      this.addErrors['barang_empty'] = 'Tambahkan minimal satu barang.';
      valid = false;
    }

    // Validasi tiap baris barang
    this.selectedBarang.forEach((item, i) => {
      const err: { [key: string]: string } = {};

      if (!item.id_barang) {
        err['id_barang'] = 'Barang harus dipilih.';
        valid = false;
      }

      if (!item.jumlah || Number(item.jumlah) < 1) {
        err['jumlah'] = 'Jumlah minimal 1.';
        valid = false;
      }

      if (!item.harga_jual || Number(item.harga_jual) <= 0) {
        err['harga_jual'] = 'Harga harus diisi.';
        valid = false;
      }

      this.addBarangErrors[i] = err;
    });

    return valid;
  }

  closeAdd(): void {
    this.showAddModal = false;
    this.isSubmitting = false;
  }

  // FIX: tambah satu baris barang kosong (menggantikan input jumlah jenis)
  addBarangRow(): void {
    this.selectedBarang = [...this.selectedBarang, { id_barang: null, jumlah: 1, harga_jual: 0, satuan: '' }];
    this.addBarangErrors = [...this.addBarangErrors, {}];
    // Hapus error "minimal 1 barang" begitu ada baris
    if (this.addErrors['barang_empty']) delete this.addErrors['barang_empty'];
  }

  // FIX: hapus baris barang berdasarkan index
  removeBarangRow(index: number): void {
    this.selectedBarang = this.selectedBarang.filter((_, i) => i !== index);
    this.addBarangErrors = this.addBarangErrors.filter((_, i) => i !== index);
    this.calculateTotal();
  }

  // FIX: generateBarangSelect tetap dipertahankan untuk backward-compat (misal dipanggil dari tempat lain)
  generateBarangSelect(): void {
    this.selectedBarang = [];
    for (let i = 0; i < (Number(this.jumlahJenisBarang) || 0); i++)
      this.selectedBarang.push({ id_barang: null, jumlah: 1, harga_jual: 0, satuan: '' });
  }

  getStock(id_barang: any): number {
    const b = this.barang.find((b: any) => b.id_barang == id_barang);
    return b ? Number(b.jumlah) : 0;
  }

  onJumlahChange(item: any): void {
    const stock = this.getStock(item.id_barang);
    if (Number(item.jumlah) > stock) {
      item.jumlah = stock;
      Swal.fire({ icon: 'warning', title: 'Stok Tidak Mencukupi', text: `Jumlah melebihi stok (${stock}).` });
    }
    // Hapus baris auto-correct ke 1 — biarkan validateAdd yang menolak
    this.calculateTotal();
  }

  submitAdd(): void {
    if (!this.validateAdd()) return;
    if (this.isSubmitting) return; // guard tambahan

    this.isSubmitting = true; // ← set true sebelum request

    this.api.addInvoice({ ...this.addForm, barang: this.selectedBarang }).subscribe({
      next: () => {
        const proyek = this.project.find((p: any) => p.id_project == this.addForm.id_project)?.nama_project || 'Proyek';
        this.isSubmitting = false;
        this.closeAdd();
        this.cdr.detectChanges();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Pemesanan "${proyek}" berhasil ditambahkan.`,
            timer: 2500,
            showConfirmButton: false
          }).then(() => this.loadInvoice(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false; // ← reset juga saat error
        Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Pemesanan gagal ditambahkan.' });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Modal Edit
  // ─────────────────────────────────────────────
  onEdit(i: any): void {
    this.activeMenuId = null;
    this.editForm = {
      id_invoice: i.id_invoice,
      id_user: i.id_user,
      id_project: i.id_project,
      nama_pemesan: i.name,
      pembayaran: i.pembayaran,
      detail: i.detail,
      total_harga: i.total_harga,
      status: i.status,
      user_role: i.user_role
    };
    this.editBarang = [];
    this.loadingAnimation();
    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.val ?? []);
        this.editBarang = data.map((item: any) => {
          const b = this.barang.find((b: any) => b.id_barang == item.id_barang);
          return {
            id_brg_keluar: item.id_brg_keluar,
            id_barang: item.id_barang,
            jumlah: item.jumlah,
            harga_jual: item.harga_jual,
            satuan: b?.satuan || ''
          };
        });
        this.calculateEditTotal();
        this.editBarang = [...this.editBarang];
        Swal.close();
        this.showEditModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error?.detail || err?.error?.message || 'Gagal update invoice'
        });
      }
    });
  }

  validateEdit(): boolean {
    this.editErrors = {};
    this.editBarangErrors = [];
    let valid = true;

    if (!this.editForm.nama_pemesan?.trim()) {
      this.editErrors['nama_pemesan'] = 'Nama pemesan harus diisi.';
      valid = false;
    }

    // Validasi proyek (kecuali Gudang yang id_project-nya sudah di-set otomatis)
    if (this.role !== 'Gudang' && !this.editForm.id_project) {
      this.editErrors['id_project'] = 'Proyek harus dipilih.';
      valid = false;
    }

    if (this.editBarang.length === 0) {
      this.editErrors['barang_empty'] = 'Tambahkan minimal satu barang.';
      valid = false;
    }

    this.editBarang.forEach((item, i) => {
      const err: { [key: string]: string } = {};

      if (!item.id_barang) {
        err['id_barang'] = 'Barang harus dipilih.';
        valid = false;
      }

      if (!item.jumlah || Number(item.jumlah) < 1) {
        err['jumlah'] = 'Jumlah minimal 1.';
        valid = false;
      }

      if (!item.harga_jual || Number(item.harga_jual) <= 0) {
        err['harga_jual'] = 'Harga harus diisi.';
        valid = false;
      }

      this.editBarangErrors[i] = err;
    });

    return valid;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.isSubmitting = false;
  }

  submitEdit(): void {
    if (this.isSubmitting) return;
    if (!this.isFieldsLockedOnEdit() && !this.validateEdit()) return;

    this.isSubmitting = true;

    if (this.isFieldsLockedOnEdit()) {
      this.api
        .updatePembayaranInvoice({
          id_invoice: this.editForm.id_invoice,
          pembayaran: this.editForm.pembayaran,
          detail: this.editForm.detail
        })
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            const proyek = this.project.find((p: any) => p.id_project == this.editForm.id_project)?.nama_project || 'Proyek';
            this.closeEdit();
            this.cdr.detectChanges();
            setTimeout(
              () =>
                Swal.fire({
                  icon: 'success',
                  title: 'Berhasil',
                  text: `Pembayaran "${proyek}" berhasil diperbarui.`,
                  timer: 3000,
                  showConfirmButton: false
                }).then(() => this.loadInvoice(false)),
              100
            );
          },
          error: (err: any) => {
            this.isSubmitting = false;
            Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Pembaruan gagal.' });
          }
        });
      return;
    }

    this.api.updateInvoice({ ...this.editForm, barang: this.editBarang }).subscribe({
      next: () => {
        this.isSubmitting = false;
        const proyek = this.project.find((p: any) => p.id_project == this.editForm.id_project)?.nama_project || 'Proyek';
        this.closeEdit();
        this.cdr.detectChanges();
        setTimeout(
          () =>
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Pemesanan "${proyek}" berhasil diperbarui.`,
              timer: 3000,
              showConfirmButton: false
            }).then(() => this.loadInvoice(false)),
          100
        );
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Pemesanan gagal diperbarui.' });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Hapus
  // ─────────────────────────────────────────────
  onDelete(i: any): void {
    this.activeMenuId = null;
    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus pemesanan "${i.nama_project}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteInvoice(i.id_invoice).subscribe({
          next: () =>
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `"${i.nama_project}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            }).then(() => this.loadInvoice(false)),
          error: (err: any) => Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Gagal dihapus.' })
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Modal Detail
  // ─────────────────────────────────────────────
  detailRetur2: any[] = [];

  openDetail(i: any): void {
    this.activeMenuId = null;
    this.detailInvoice = i;
    this.detailBarang = [];
    this.detailRetur = [];
    this.suratJalanData = null;
    this.loadingAnimation();

    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        this.detailBarang = Array.isArray(res) ? res : (res?.val ?? []);

        this.api.getReturByInvoice(i.id_invoice).subscribe({
          next: (retur: any) => {
            this.detailRetur = Array.isArray(retur) ? retur : (retur?.val ?? []);
          },
          error: () => {
            this.detailRetur = [];
          }
        });

        this.api.getSuratJalan(i.id_invoice).subscribe({
          next: (sj: any) => {
            this.suratJalanData = sj;
            Swal.close();
            this.showDetailModal = true;
            this.cdr.detectChanges();
          },
          error: () => {
            Swal.close();
            this.showDetailModal = true;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Detail gagal dimuat.' });
      }
    });
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.detailInvoice = null;
    this.detailBarang = [];
    this.detailRetur = [];
  }

  // ─────────────────────────────────────────────
  // Modal Retur (terpisah)
  // ─────────────────────────────────────────────
  openRetur(i: any): void {
    this.activeMenuId = null;
    this.returInvoice = i;
    this.returBarang = [];
    this.loadingAnimation();

    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.val ?? []);
        this.returBarang = data.map((item: any) => ({
          id_barang: item.id_barang,
          nama_barang: item.nama_barang,
          jumlah: item.jumlah,
          harga_jual: Number(item.harga_jual), // harga jual asli
          hpp: Number(item.harga_jual) - Number(item.profit ?? 0),
          satuan: item.satuan || '',
          checked: false,
          jumlah_retur: 1,
          kondisi: ''
        }));
        Swal.close();
        this.showReturModal = true;
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data barang gagal dimuat.' });
      }
    });
  }

  closeRetur(): void {
    this.showReturModal = false;
    this.returInvoice = null;
    this.returBarang = [];
  }

  submitRetur(): void {
    if (this.isSubmitting) return;

    const selected = this.returBarang.filter((x: any) => x.checked);
    if (selected.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih Barang', text: 'Pilih minimal satu barang untuk diretur.' });
      return;
    }
    for (const item of selected) {
      if (item.jumlah_retur > item.jumlah) {
        Swal.fire({ icon: 'warning', title: 'Validasi', text: `Qty retur "${item.nama_barang}" melebihi jumlah.` });
        return;
      }
      if (!item.kondisi?.trim()) {
        Swal.fire({ icon: 'warning', title: 'Validasi', text: `Kondisi "${item.nama_barang}" wajib diisi.` });
        return;
      }
    }

    this.isSubmitting = true;
    const proyek = this.returInvoice?.nama_project || 'Proyek';
    let done = 0;

    selected.forEach((item: any) => {
      this.api
        .addRetur({
          id_barang: item.id_barang,
          id_invoice: this.returInvoice.id_invoice,
          jumlah: item.jumlah_retur,
          harga_jual: item.harga_jual,
          hpp: item.hpp,
          kondisi: item.kondisi
        })
        .subscribe({
          next: () => {
            done++;
            if (done === selected.length) {
              this.isSubmitting = false;
              this.closeRetur();
              this.cdr.detectChanges();
              setTimeout(
                () =>
                  Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: `Retur "${proyek}" berhasil disimpan.`,
                    timer: 2500,
                    showConfirmButton: false
                  }).then(() => this.loadInvoice(false)),
                100
              );
            }
          },
          error: (err: any) => {
            this.isSubmitting = false;
            Swal.fire({
              icon: 'error',
              title: 'Retur Gagal',
              text: err?.error?.message || err?.error?.detail || 'Retur gagal disimpan.'
            });
          }
        });
    });
  }

  // ─────────────────────────────────────────────
  // Modal Surat Jalan
  // ─────────────────────────────────────────────
  openSuratJalan(): void {
    this.suratJalanForm = {
      id_invoice: this.detailInvoice?.id_invoice,
      no_surat_jalan: this.suratJalanData?.no_surat_jalan || '',
      plat_kendaraan: this.suratJalanData?.plat_kendaraan || ''
    };
    this.showSuratJalanModal = true;
  }

  closeSuratJalan(): void {
    this.showSuratJalanModal = false;
    this.isSubmitting = false;
  }

  submitSuratJalan(): void {
    if (this.isSubmitting) return;
    if (!this.suratJalanForm.no_surat_jalan?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validasi', text: 'No surat jalan wajib diisi.' });
      return;
    }
    if (!this.suratJalanForm.plat_kendaraan?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Plat kendaraan wajib diisi.' });
      return;
    }

    this.isSubmitting = true;
    const isUpdate = !!this.suratJalanData;
    const apiCall = isUpdate ? this.api.updateSuratJalan(this.suratJalanForm) : this.api.addSuratJalan(this.suratJalanForm);

    apiCall.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.suratJalanData = { ...this.suratJalanForm };
        this.closeSuratJalan();
        this.cdr.detectChanges();
        setTimeout(
          () =>
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Surat jalan berhasil ${isUpdate ? 'diperbarui' : 'dibuat'}.`,
              timer: 2000,
              showConfirmButton: false
            }),
          100
        );
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Surat jalan gagal disimpan.' });
      }
    });
  }

  downloadSuratJalan(): void {
    if (!this.suratJalanData) return;
    const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const rows = this.detailBarang.map(
      (item: any, index: number) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(index + 1))] }),
            new TableCell({ children: [new Paragraph(item.nama_barang)] }),
            new TableCell({ children: [new Paragraph(`${item.jumlah} ${item.satuan}`)] })
          ]
        })
    );
    const bs = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
    const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ children: [new TextRun({ text: 'PANGLONG BBS', bold: true, size: 34 })], spacing: { after: 80 } }),
            new Paragraph({ text: 'Jl Gatot Subroto', spacing: { after: 40 } }),
            new Paragraph({ text: 'Medan', spacing: { after: 400 } }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Medan, ${tanggal}`, bold: true })],
              spacing: { after: 300 }
            }),
            new Paragraph({ children: [new TextRun({ text: `Kepada Yth : ${this.detailInvoice?.name}`, bold: true })] }),
            new Paragraph({
              children: [new TextRun({ text: `${this.detailInvoice?.nama_project}`, bold: true })],
              spacing: { after: 300 }
            }),
            new Paragraph({ text: `Surat Jalan : ${this.suratJalanData.no_surat_jalan}` }),
            new Paragraph({ text: `No Plat Kendaraan : ${this.suratJalanData.plat_kendaraan}`, spacing: { after: 300 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: bs, bottom: bs, left: bs, right: bs, insideHorizontal: bs, insideVertical: bs },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true })] })]
                    }),
                    new TableCell({
                      width: { size: 60, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: 'Nama Barang', bold: true })] })]
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: 'Quantity', bold: true })] })]
                    })
                  ]
                }),
                ...rows
              ]
            }),
            new Paragraph({
              spacing: { before: 250 },
              children: [
                new TextRun({ text: 'Catatan : ', bold: true, italics: true }),
                new TextRun({ text: 'Mohon di cek kembali bahan-bahan yang diantar', italics: true })
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 700 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: nb, bottom: nb, left: nb, right: nb, insideHorizontal: nb, insideVertical: nb },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ text: 'Hormat Kami,', alignment: AlignmentType.LEFT }),
                        new Paragraph({ text: '', spacing: { after: 900 } }),
                        new Paragraph({ text: '................................', alignment: AlignmentType.LEFT }),
                        new Paragraph({ text: '(                           )', alignment: AlignmentType.LEFT })
                      ]
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ text: 'Diterima Oleh :', alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: '', spacing: { after: 900 } }),
                        new Paragraph({ text: '................................', alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: '(                           )', alignment: AlignmentType.CENTER })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }
      ]
    });
    Packer.toBlob(doc).then((blob) => saveAs(blob, `Surat-Jalan-${this.suratJalanData.no_surat_jalan}.docx`));
  }

  downloadInvoice(): void {
    if (!this.detailInvoice) return;

    const tanggal = new Date(this.detailInvoice.created_at).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const borderCell = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const cellBorders = {
      top: borderCell,
      bottom: borderCell,
      left: borderCell,
      right: borderCell
    };

    const headerShading = { fill: '1e3a5f', type: ShadingType.CLEAR };
    const altRowShading = { fill: 'f1f5f9', type: ShadingType.CLEAR };

    // ── Baris item barang ──
    const itemRows = this.detailBarang.map(
      (item: any, index: number) =>
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 500, type: WidthType.DXA },
              shading: index % 2 !== 0 ? altRowShading : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(index + 1), size: 20, font: 'Arial' })]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 4200, type: WidthType.DXA },
              shading: index % 2 !== 0 ? altRowShading : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.nama_barang || '—', size: 20, font: 'Arial' })]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1000, type: WidthType.DXA },
              shading: index % 2 !== 0 ? altRowShading : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${item.jumlah} ${item.satuan}`, size: 20, font: 'Arial' })]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 2000, type: WidthType.DXA },
              shading: index % 2 !== 0 ? altRowShading : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: item.harga_jual ? 'Rp ' + Number(item.harga_jual).toLocaleString('id-ID') : '—',
                      size: 20,
                      font: 'Arial'
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 2300, type: WidthType.DXA },
              shading: index % 2 !== 0 ? altRowShading : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text:
                        item.harga_jual && item.jumlah
                          ? 'Rp ' + (Number(item.harga_jual) * Number(item.jumlah)).toLocaleString('id-ID')
                          : '—',
                      size: 20,
                      font: 'Arial'
                    })
                  ]
                })
              ]
            })
          ]
        })
    );

    // ── Baris retur (jika ada) ──
    const returRows = this.detailRetur.map(
      (r: any, index: number) =>
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 500, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(index + 1), size: 20, font: 'Arial' })]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 4200, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: r.nama_barang || '—', size: 20, font: 'Arial' })]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1500, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${r.jumlah} ${r.satuan}`, size: 20, font: 'Arial' })]
                })
              ]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 3800, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: r.kondisi || '—', size: 20, font: 'Arial' })]
                })
              ]
            })
          ]
        })
    );

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: 'Arial', size: 22 } }
        }
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
            }
          },
          children: [
            // ── Header: Nama Perusahaan ──
            // ── Header: Nama Perusahaan ──
            new Paragraph({
              children: [new TextRun({ text: 'BINTANG BERJAYA SEJAHTERA', bold: true, size: 40, color: '1e3a5f', font: 'Arial' })],
              spacing: { after: 40 }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'MENJUAL BAHAN-BAHAN BANGUNAN', size: 22, bold: true, color: '374151', font: 'Arial' })],
              spacing: { after: 20 }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'PAVING BLOK, LEVERANSIR DAN KUSEN', size: 20, color: '374151', font: 'Arial' })],
              spacing: { after: 20 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'DUSUN XIX PASAR IV NO. 16 KLAMBIR 5 KEBUN - HAMPARAN PERAK',
                  size: 19,
                  color: '6b7280',
                  font: 'Arial'
                })
              ],
              spacing: { after: 20 }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'HP. 0811 6081 974  -  0813 6194 0033', size: 19, color: '6b7280', font: 'Arial' })],
              spacing: { after: 20 }
            }),
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '1e3a5f', space: 1 } },
              spacing: { after: 280 }
            }),

            // ── Judul Invoice ──
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'INVOICE PEMESANAN BARANG', bold: true, size: 32, color: '1e3a5f', font: 'Arial' })],
              spacing: { after: 280 }
            }),

            // ── Info Invoice (2 kolom pakai tab stop) ──
            new Table({
              width: { size: 9638, type: WidthType.DXA },
              columnWidths: [4819, 4819],
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 0, right: 0 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Proyek', size: 20, color: '6b7280', font: 'Arial' })] }),
                        new Paragraph({
                          children: [new TextRun({ text: this.detailInvoice.nama_project || '—', size: 22, bold: true, font: 'Arial' })],
                          spacing: { after: 80 }
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 0, right: 0 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Tanggal', size: 20, color: '6b7280', font: 'Arial' })] }),
                        new Paragraph({
                          children: [new TextRun({ text: tanggal, size: 22, bold: true, font: 'Arial' })],
                          spacing: { after: 80 }
                        })
                      ]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 0, right: 0 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Pemesan', size: 20, color: '6b7280', font: 'Arial' })] }),
                        new Paragraph({
                          children: [new TextRun({ text: this.detailInvoice.name || '—', size: 22, bold: true, font: 'Arial' })],
                          spacing: { after: 80 }
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 0, right: 0 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Status', size: 20, color: '6b7280', font: 'Arial' })] }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: (this.detailInvoice.status || '—').charAt(0).toUpperCase() + (this.detailInvoice.status || '').slice(1),
                              size: 22,
                              bold: true,
                              font: 'Arial'
                            })
                          ],
                          spacing: { after: 80 }
                        })
                      ]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 0, right: 0 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Pembayaran', size: 20, color: '6b7280', font: 'Arial' })] }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: this.detailInvoice.pembayaran === 'lunas' ? 'Lunas' : 'Belum Lunas',
                              size: 22,
                              bold: true,
                              font: 'Arial'
                            })
                          ],
                          spacing: { after: 80 }
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 60, bottom: 60, left: 0, right: 0 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Detail / Catatan', size: 20, color: '6b7280', font: 'Arial' })] }),
                        new Paragraph({
                          children: [new TextRun({ text: this.detailInvoice.detail || '—', size: 22, bold: true, font: 'Arial' })],
                          spacing: { after: 80 }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),

            new Paragraph({ spacing: { after: 280 } }),

            // ── Tabel Barang ──
            new Paragraph({
              children: [new TextRun({ text: 'Daftar Barang', bold: true, size: 24, color: '1e3a5f', font: 'Arial' })],
              spacing: { after: 120 }
            }),
            new Table({
              width: { size: 10000, type: WidthType.DXA },
              columnWidths: [500, 4200, 1000, 2000, 2300],
              rows: [
                // Header row
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: headerShading,
                      width: { size: 500, type: WidthType.DXA },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'No', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                        })
                      ]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      shading: headerShading,
                      width: { size: 4200, type: WidthType.DXA },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Nama Barang', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                        })
                      ]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      shading: headerShading,
                      width: { size: 1000, type: WidthType.DXA },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Jumlah', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                        })
                      ]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      shading: headerShading,
                      width: { size: 2000, type: WidthType.DXA },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: 'Harga Satuan', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                        })
                      ]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      shading: headerShading,
                      width: { size: 2300, type: WidthType.DXA },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: 'Subtotal', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                        })
                      ]
                    })
                  ]
                }),
                ...itemRows,
                // Row total
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      columnSpan: 4,
                      shading: { fill: 'e8f0fe', type: ShadingType.CLEAR },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: 'TOTAL', bold: true, size: 22, font: 'Arial' })]
                        })
                      ]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'e8f0fe', type: ShadingType.CLEAR },
                      width: { size: 2300, type: WidthType.DXA },
                      margins: { top: 100, bottom: 100, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({
                              text: this.detailInvoice.total_harga
                                ? 'Rp ' + Number(this.detailInvoice.total_harga).toLocaleString('id-ID')
                                : '—',
                              bold: true,
                              size: 22,
                              font: 'Arial'
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            }),

            // ── Tabel Retur (jika ada) ──
            ...(this.detailRetur.length > 0
              ? [
                  new Paragraph({ spacing: { after: 280 } }),
                  new Paragraph({
                    children: [new TextRun({ text: 'Retur Barang', bold: true, size: 24, color: '92400e', font: 'Arial' })],
                    spacing: { after: 120 }
                  }),
                  new Table({
                    width: { size: 10000, type: WidthType.DXA },
                    columnWidths: [500, 4200, 1500, 3800],
                    rows: [
                      new TableRow({
                        tableHeader: true,
                        children: [
                          new TableCell({
                            borders: cellBorders,
                            shading: { fill: '92400e', type: ShadingType.CLEAR },
                            width: { size: 500, type: WidthType.DXA },
                            margins: { top: 100, bottom: 100, left: 120, right: 120 },
                            children: [
                              new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: 'No', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                              })
                            ]
                          }),
                          new TableCell({
                            borders: cellBorders,
                            shading: { fill: '92400e', type: ShadingType.CLEAR },
                            width: { size: 4200, type: WidthType.DXA },
                            margins: { top: 100, bottom: 100, left: 120, right: 120 },
                            children: [
                              new Paragraph({
                                children: [new TextRun({ text: 'Nama Barang', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                              })
                            ]
                          }),
                          new TableCell({
                            borders: cellBorders,
                            shading: { fill: '92400e', type: ShadingType.CLEAR },
                            width: { size: 1500, type: WidthType.DXA },
                            margins: { top: 100, bottom: 100, left: 120, right: 120 },
                            children: [
                              new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: 'Qty Retur', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                              })
                            ]
                          }),
                          new TableCell({
                            borders: cellBorders,
                            shading: { fill: '92400e', type: ShadingType.CLEAR },
                            width: { size: 3800, type: WidthType.DXA },
                            margins: { top: 100, bottom: 100, left: 120, right: 120 },
                            children: [
                              new Paragraph({
                                children: [new TextRun({ text: 'Kondisi', bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
                              })
                            ]
                          })
                        ]
                      }),
                      ...returRows
                    ]
                  })
                ]
              : []),

            // ── Footer tanda tangan ──
            new Paragraph({ spacing: { after: 560 } }),
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'e5e7eb', space: 1 } },
              spacing: { after: 400 }
            }),
            new Table({
              width: { size: 9638, type: WidthType.DXA },
              columnWidths: [4819, 4819],
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 0, bottom: 0, left: 0, right: 0 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Hormat Kami,', size: 20, font: 'Arial' })]
                        }),
                        new Paragraph({ spacing: { after: 900 } }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: '(                              )', size: 20, font: 'Arial' })]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 4819, type: WidthType.DXA },
                      margins: { top: 0, bottom: 0, left: 0, right: 0 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'Pemesan,', size: 20, font: 'Arial' })]
                        }),
                        new Paragraph({ spacing: { after: 900 } }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: `( ${this.detailInvoice.name || ''} )`, size: 20, font: 'Arial' })]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }
      ]
    });

    Packer.toBlob(doc).then((blob) => {
      const filename = `Invoice-${this.detailInvoice.nama_project?.replace(/\s+/g, '-') || 'Pemesanan'}-${tanggal.replace(/\s/g, '-')}.docx`;
      saveAs(blob, filename);
    });
  }

  // ─────────────────────────────────────────────
  // Barang helpers
  // ─────────────────────────────────────────────
  onBarangChange(item: any): void {
    const b = this.barang.find((b: any) => b.id_barang == item.id_barang);
    if (b) {
      item.harga_jual = b.harga_jual;
      item.satuan = b.satuan;
    }
    this.calculateTotal();
  }

  isBarangSelected(id: any, cur: any): boolean {
    return this.selectedBarang.some((i) => i !== cur && i.id_barang == id);
  }

  calculateTotal(): void {
    this.addForm.total_harga = this.selectedBarang.reduce((t, i) => t + (Number(i.jumlah) || 0) * (Number(i.harga_jual) || 0), 0);
  }

  calculateEditTotal(): void {
    this.editForm.total_harga = this.editBarang.reduce((t, i) => t + (Number(i.jumlah) || 0) * (Number(i.harga_jual) || 0), 0);
  }

  isBarangSelectedEdit(id: any, cur: any): boolean {
    return this.editBarang.some((i) => i !== cur && i.id_barang == id);
  }

  onJumlahJenisBarangChange(value: any): void {
    const angka = String(value).replace(/[^0-9]/g, '');
    this.jumlahJenisBarang = angka ? Number(angka) : null;
    this.generateBarangSelect();
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return Number(value).toLocaleString('id-ID');
  }

  onHargaInput(event: any, item: any): void {
    let value = (event.target.value || '').replace(/\D/g, '');
    item.harga_jual = Number(value);
    event.target.value = this.formatNumber(value);
    this.calculateTotal();
  }

  onHargaInputEdit(event: any, item: any): void {
    let value = (event.target.value || '').replace(/\D/g, '');
    item.harga_jual = Number(value);
    event.target.value = this.formatNumber(value);
    this.calculateEditTotal();
  }

  loadingAnimation(): void {
    Swal.fire({
      text: 'Sedang Mengambil Data',
      icon: 'info',
      timerProgressBar: true,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });
  }

  hasAnyAction(invoice: any): boolean {
    return this.canEdit(invoice) || this.canUpdateStatus(invoice) || this.canRetur(invoice) || this.canDelete(invoice);
  }

  // ─────────────────────────────────────────────
  // Source badge helpers
  // ─────────────────────────────────────────────
  getSourceLabel(invoice: any): string {
    if (this.isOwner(invoice)) return 'Saya';
    switch (invoice.user_role) {
      case 'Lapangan':     return 'Lapangan';
      case 'Gudang':       return 'Gudang';
      case 'Admin Kantor': return 'Admin Kantor';
      default:             return invoice.user_role || '—';
    }
  }

  getSourceClass(invoice: any): string {
    if (this.isOwner(invoice)) return 'src-self';
    switch (invoice.user_role) {
      case 'Lapangan':     return 'src-lapangan';
      case 'Gudang':       return 'src-gudang';
      case 'Admin Kantor': return 'src-kantor';
      default:             return 'src-other';
    }
  }

  formatWIB(dateString: string): string {
    if (!dateString) return '-';

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(dateString));
  }
}
