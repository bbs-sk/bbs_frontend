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
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, BorderStyle } from 'docx';
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
    return invoice.id_user === this.userLogin?.id_user;
  }

  // ─── Modal flags ────────────────────────────
  showAddModal = false;
  showEditModal = false;
  showDetailModal = false;
  showReturModal = false;
  showSuratJalanModal = false;

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

  // FIX: jumlahJenisBarang dihapus, diganti dengan addBarangRow/removeBarangRow
  // Property dipertahankan sementara agar tidak breaking change jika ada tempat lain yang masih pakai
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

        if (this.role === 'Gudang') {
          data = data.filter((p: any) => p.id_project == 0);
        } else if (this.role === 'Lapangan') {
          data = data.filter((p: any) => p.id_user1 == this.userLogin?.id_user || p.id_user2 == this.userLogin?.id_user);
        } else {
          data = data.filter((p: any) => p.id_project != 0);
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
    const base = [...this.invoice];
    this.filteredInvoice = this.filterStatus ? base.filter((i: any) => i.status === this.filterStatus) : base;
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
    this.statusInvoice = null;
    this.statusForm = { id_invoice: null, status: '' };
  }

  submitStatus(): void {
    if (!this.statusForm.status) {
      Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Pilih status baru terlebih dahulu.' });
      return;
    }
    const proyek = this.statusInvoice?.nama_project || 'Proyek';
    this.api.updateStatusInvoice(this.statusForm).subscribe({
      next: () => {
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
    this.activeMenuId = this.activeMenuId === id ? null : id;
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
    if (this.role === 'Admin Kantor' || 'Gudang') {
      const lockedStatus = ['menunggu', 'disetujui', 'dikirim', 'selesai', 'ditolak'];
      return this.editForm?.id_user !== this.userLogin?.id_user || lockedStatus.includes(this.editForm?.status);
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
    if (this.role === 'Admin Kantor') return s !== 'dikirim' && s !== 'selesai';
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
    if (this.role === 'Gudang') return false;
    const s = invoice.status;
    return this.isOwner(invoice) && (s === 'dikirim' || s === 'selesai');
  }

  showSuratJalanBtn(): boolean {
    if (this.role !== 'Gudang') return false;
    const s = this.detailInvoice?.status;
    return s === 'dikirim' || s === 'selesai';
  }

  isSuratJalanReadOnly(): boolean {
    return this.detailInvoice?.status === 'selesai';
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
      id_project: this.role === 'Gudang' ? 0 : null,
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
    if (Number(item.jumlah) < 1 || !item.jumlah) item.jumlah = 1;
    this.calculateTotal();
  }

  submitAdd(): void {
    if (!this.validateAdd()) return; // ← validasi dulu

    this.api.addInvoice({ ...this.addForm, barang: this.selectedBarang }).subscribe({
      next: () => {
        const proyek = this.project.find((p: any) => p.id_project == this.addForm.id_project)?.nama_project || 'Proyek';
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
      error: (err: any) => Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Pemesanan gagal ditambahkan.' })
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
      pembayaran: i.pembayaran,
      detail: i.detail,
      total_harga: i.total_harga,
      status: i.status
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
  }

  submitEdit(): void {
    // Jika field terkunci (hanya update pembayaran), skip validasi barang
    if (!this.isFieldsLockedOnEdit() && !this.validateEdit()) return;

    if (this.isFieldsLockedOnEdit()) {
      this.api
        .updatePembayaranInvoice({
          id_invoice: this.editForm.id_invoice,
          pembayaran: this.editForm.pembayaran,
          detail: this.editForm.detail
        })
        .subscribe({
          next: () => {
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
          error: (err: any) => Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Pembaruan gagal.' })
        });
      return;
    }

    this.api.updateInvoice({ ...this.editForm, barang: this.editBarang }).subscribe({
      next: () => {
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
      error: (err: any) => Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Pemesanan gagal diperbarui.' })
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
          harga_jual: Number(item.harga_jual) - Number(item.profit),
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

    const proyek = this.returInvoice?.nama_project || 'Proyek';
    let done = 0;

    selected.forEach((item: any) => {
      this.api
        .addRetur({
          id_barang: item.id_barang,
          id_invoice: this.returInvoice.id_invoice,
          jumlah: item.jumlah_retur,
          harga_jual: item.harga_jual,
          kondisi: item.kondisi
        })
        .subscribe({
          next: () => {
            done++;
            if (done === selected.length) {
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
  }

  submitSuratJalan(): void {
    if (!this.suratJalanForm.no_surat_jalan?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validasi', text: 'No surat jalan wajib diisi.' });
      return;
    }
    if (!this.suratJalanForm.plat_kendaraan?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Plat kendaraan wajib diisi.' });
      return;
    }

    const isUpdate = !!this.suratJalanData;
    const apiCall = isUpdate ? this.api.updateSuratJalan(this.suratJalanForm) : this.api.addSuratJalan(this.suratJalanForm);

    apiCall.subscribe({
      next: () => {
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
      error: (err: any) => Swal.fire({ icon: 'error', title: 'Gagal', text: err?.error?.message || 'Surat jalan gagal disimpan.' })
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
}
