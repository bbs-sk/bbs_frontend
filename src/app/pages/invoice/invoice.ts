import { Component, ChangeDetectorRef } from '@angular/core';
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
  status = '';
  userLogin: any = null;

  // ─── Modal flags ────────────────────────────
  showAddModal = false;
  showEditModal = false;
  showDetailModal = false;
  showStatusModal = false;
  showSuratJalanModal = false;

  suratJalanData: any = null;
  suratJalanForm: any = {
    id_invoice: null,
    no_surat_jalan: '',
    plat_kendaraan: ''
  };

  // ─── Form state ─────────────────────────────
  addForm: any = {
    id_user: null,
    id_project: null,
    total_harga: 0,
    pembayaran: null,
    detail: ''
  };

  editForm: any = {};

  selectedBarang: any[] = [];
  editBarang: any[] = [];
  jumlahJenisBarang: number | null = null;

  detailInvoice: any = null;
  detailBarang: any[] = [];

  statusInvoice: any = null;
  returBarang: any[] = [];
  statusForm: any = { id_invoice: null, status: '' };

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────
  ngOnInit(): void {
    const userData = localStorage.getItem('user');

    if (userData) {
      this.userLogin = JSON.parse(userData);
      this.idUser = this.userLogin.id_user;

      if (this.userLogin.role === 'Admin Kantor') {
        this.status = 'disetujui';
      } else if (this.userLogin.role === 'Lapangan') {
        this.status = 'menunggu';
      } else if (this.userLogin.role === 'Gudang') {
        this.status = 'selesai';
      }
    }

    this.loadInvoice();
    this.getProject();
    this.getBarang();
  }

  // ─────────────────────────────────────────────
  // Load data
  // ─────────────────────────────────────────────
  loadInvoice(showLoading: boolean = true): void {
    this.isLoading = true;

    if (showLoading) {
      this.loadingAnimation();
    }

    const payload = {
      role: this.userLogin?.role,
      id_user: this.userLogin?.id_user
    };

    this.api.getInvoiceRole(payload).subscribe({
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

        if (this.userLogin?.role === 'Gudang') {
          data = data.filter((p: any) => p.id_project == 0);
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
  // Pagination
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

  // ─────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────
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

    this.api
      .searchPemesanan({
        keyword,
        role: this.userLogin?.role,
        id_user: this.userLogin?.id_user
      })
      .subscribe({
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

          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Pencarian gagal dilakukan.'
          });

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
  // Modal Tambah
  // ─────────────────────────────────────────────
  openAdd(): void {
    this.addForm = {
      id_user: this.idUser,
      id_project: this.userLogin?.role === 'Gudang' ? 0 : null,
      total_harga: 0,
      pembayaran: null,
      detail: ''
    };

    // status otomatis selesai untuk gudang
    if (this.userLogin?.role === 'Gudang') {
      this.status = 'selesai';
    }

    this.jumlahJenisBarang = null;
    this.selectedBarang = [];
    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
  }

  getStock(id_barang: any): number {
    const barang = this.barang.find((b: any) => b.id_barang == id_barang);

    return barang ? Number(barang.jumlah) : 0;
  }

  onJumlahChange(item: any): void {
    const stock = this.getStock(item.id_barang);

    if (Number(item.jumlah) > stock) {
      item.jumlah = stock;

      Swal.fire({
        icon: 'warning',
        title: 'Stok Tidak Mencukupi',
        text: `Jumlah barang melebihi stok tersedia (${stock}).`
      });
    }

    if (Number(item.jumlah) < 1 || !item.jumlah) {
      item.jumlah = 1;
    }

    this.calculateTotal();
  }

  submitAdd(): void {
    const payload = {
      ...this.addForm,
      status: this.status,
      barang: this.selectedBarang
    };

    this.api.addInvoice(payload).subscribe({
      next: () => {
        const proyek = this.project.find((p: any) => p.id_project == this.addForm.id_project)?.nama_project || 'Proyek';

        this.closeAdd();
        this.cdr.detectChanges();

        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Pemesanan proyek "${proyek}" berhasil ditambahkan.`,
            timer: 2500,
            showConfirmButton: false
          }).then(() => {
            this.loadInvoice(false);
          });
        }, 100);
      },

      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Pemesanan gagal ditambahkan.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Modal Edit
  // ─────────────────────────────────────────────
  canEdit(invoice: any): boolean {
    const isOwner = invoice.id_user === this.userLogin?.id_user;
    const role = this.userLogin?.role;
    if (role === 'Admin Kantor') {
      return true;
    }
    if (role === 'Gudang') {
      return isOwner;
    }
    const allowedStatus = invoice.status === 'menunggu' || invoice.status === 'dipesan';
    return isOwner && allowedStatus;
  }

  isAdminEditOtherUser(): boolean {
    const isAdmin = this.userLogin?.role === 'Admin Kantor' || 'Gudang';
    const isOtherUser = this.editForm?.id_user !== this.userLogin?.id_user;
    const lockedStatus = this.editForm?.status !== 'menunggu' && this.editForm?.status !== 'dipesan';
    return isAdmin && (isOtherUser || lockedStatus);
  }
  onEdit(i: any): void {
    this.editForm = {
      id_invoice: i.id_invoice,
      id_user: i.id_user,
      id_project: i.id_project,
      pembayaran: i.pembayaran,
      detail: i.detail,
      total_harga: i.total_harga
    };
    this.editBarang = [];

    this.loadingAnimation();

    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.val ?? []);

        this.editBarang = data.map((item: any) => {
          const barang = this.barang.find((b: any) => b.id_barang == item.id_barang);
          return {
            id_brg_keluar: item.id_brg_keluar,
            id_barang: item.id_barang,
            jumlah: item.jumlah,
            harga_jual: item.harga_jual,
            satuan: barang?.satuan || ''
          };
        });

        this.calculateEditTotal();
        this.editBarang = [...this.editBarang];
        Swal.close();
        this.showEditModal = true;
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data barang pemesanan gagal dimuat.' });
      }
    });
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  submitEdit(): void {
    // =========================
    // ADMIN EDIT USER LAIN
    // =========================
    if (this.isAdminEditOtherUser()) {
      const payload = {
        id_invoice: this.editForm.id_invoice,
        pembayaran: this.editForm.pembayaran,
        detail: this.editForm.detail
      };

      this.api.updatePembayaranInvoice(payload).subscribe({
        next: () => {
          const proyek = this.project.find((p: any) => p.id_project == this.editForm.id_project)?.nama_project || 'Proyek';

          this.closeEdit();

          this.cdr.detectChanges();

          setTimeout(() => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Pembayaran proyek "${proyek}" berhasil diperbarui.`,
              timer: 3000,
              showConfirmButton: false
            }).then(() => {
              this.loadInvoice(false);
            });
          }, 100);
        },

        error: (err: any) => {
          const msg = err?.error?.message || err?.message || 'Pembaruan pembayaran gagal.';

          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: msg
          });
        }
      });

      return;
    }

    // =========================
    // EDIT NORMAL
    // =========================
    const payload = {
      ...this.editForm,
      barang: this.editBarang
    };

    this.api.updateInvoice(payload).subscribe({
      next: () => {
        const proyek = this.project.find((p: any) => p.id_project == this.editForm.id_project)?.nama_project || 'Proyek';

        this.closeEdit();

        this.cdr.detectChanges();

        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Pemesanan proyek "${proyek}" berhasil diperbarui.`,
            timer: 3000,
            showConfirmButton: false
          }).then(() => {
            this.loadInvoice(false);
          });
        }, 100);
      },

      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Pemesanan gagal diperbarui.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Modal Hapus
  // ─────────────────────────────────────────────
  canDelete(invoice: any): boolean {
    const role = this.userLogin?.role;
    const isOwner = invoice.id_user === this.userLogin?.id_user;
    if (role === 'Gudang') {
      return isOwner;
    }
    if (role === 'Admin Kantor') {
      return isOwner && invoice.status === 'disetujui';
    }
    const allowedStatus = invoice.status === 'menunggu' || invoice.status === 'dipesan';
    return isOwner && allowedStatus;
  }

  onDelete(i: any): void {
    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus pemesanan proyek "${i.nama_project}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteInvoice(i.id_invoice).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Pemesanan "${i.nama_project}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            }).then(() => {
              // reload tanpa loading animation
              this.loadInvoice(false);
            });
          },

          error: (err: any) => {
            const msg = err?.error?.message || err?.message || 'Pemesanan gagal dihapus.';

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

  // ─────────────────────────────────────────────
  // Modal Detail
  // ─────────────────────────────────────────────
  openDetail(i: any): void {
    this.detailInvoice = i;
    this.detailBarang = [];
    this.suratJalanData = null;

    this.loadingAnimation();

    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        this.detailBarang = Array.isArray(res) ? res : (res?.val ?? []);

        // CEK SURAT JALAN
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

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Detail pemesanan gagal dimuat.'
        });
      }
    });
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.detailInvoice = null;
    this.detailBarang = [];
  }

  // ─────────────────────────────────────────────
  // Modal Update Status
  // ─────────────────────────────────────────────
  canUpdateStatus(invoice: any): boolean {
    const role = this.userLogin?.role;
    const status = invoice.status;
    const isOwner = invoice.id_user === this.userLogin?.id_user;

    // ADMIN KANTOR
    if (role === 'Admin Kantor') {
      // boleh untuk semua invoice
      if (status === 'menunggu' || status === 'disetujui' || status === 'ditolak') {
        return true;
      }

      // hanya pemilik invoice
      if (isOwner && (status === 'dikirim' || status === 'selesai')) {
        return true;
      }

      return false;
    }

    // GUDANG
    if (role === 'Gudang') {
      return status === 'disetujui' || status === 'dikirim';
    }

    // LAPANGAN
    if (role === 'Lapangan') {
      return status === 'dikirim' || status === 'selesai';
    }

    return false;
  }

  getAvailableStatus(invoice: any): string[] {
    const role = this.userLogin?.role;
    const isOwner = invoice.id_user === this.userLogin?.id_user;

    if (role === 'Admin Kantor') {
      if (invoice.status === 'menunggu' || invoice.status === 'disetujui' || invoice.status === 'ditolak') {
        return ['menunggu', 'disetujui', 'ditolak'];
      }

      if (isOwner && (invoice.status === 'dikirim' || invoice.status === 'selesai')) {
        return ['dikirim', 'selesai'];
      }
    }

    if (role === 'Gudang') {
      return ['disetujui', 'dikirim'];
    }

    if (role === 'Lapangan') {
      return ['dikirim', 'selesai'];
    }

    return [];
  }

  openStatus(data: any): void {
    this.statusInvoice = data;
    this.statusForm = { id_invoice: data.id_invoice, status: data.status };
    this.detailBarang = [];
    this.returBarang = [];

    this.loadingAnimation();

    this.api.getBrgKeluarId(data.id_invoice).subscribe({
      next: (res: any) => {
        const result = Array.isArray(res) ? res : (res?.val ?? []);
        this.detailBarang = result;
        this.returBarang = result.map((item: any) => ({
          id_barang: item.id_barang,
          nama_barang: item.nama_barang,
          jumlah: item.jumlah,
          harga_jual: item.harga_jual,
          checked: false,
          jumlah_retur: 1,
          kondisi: ''
        }));

        Swal.close();
        this.showStatusModal = true;
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data barang pemesanan gagal dimuat.' });
      }
    });
  }

  closeStatus(): void {
    this.showStatusModal = false;
  }

  submitStatus(): void {
    const returSelected = this.returBarang.filter((x: any) => x.checked);

    // Validasi retur
    for (const item of returSelected) {
      if (item.jumlah_retur > item.jumlah) {
        Swal.fire({
          icon: 'warning',
          title: 'Validasi',
          text: `Jumlah retur "${item.nama_barang}" melebihi qty barang.`
        });
        return;
      }

      if (!item.kondisi?.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Validasi',
          text: `Kondisi barang "${item.nama_barang}" wajib diisi.`
        });
        return;
      }
    }

    const proyek = this.statusInvoice?.nama_project || 'Proyek';

    this.api.updateStatusInvoice(this.statusForm).subscribe({
      next: () => {
        if (returSelected.length > 0) {
          let selesai = 0;

          returSelected.forEach((item: any) => {
            const payload = {
              id_barang: item.id_barang,
              id_invoice: this.statusInvoice.id_invoice,
              jumlah: item.jumlah_retur,
              harga_jual: item.harga_jual,
              kondisi: item.kondisi
            };

            this.api.addRetur(payload).subscribe({
              next: () => {
                selesai++;

                if (selesai === returSelected.length) {
                  this.closeStatus();
                  this.cdr.detectChanges();

                  setTimeout(() => {
                    Swal.fire({
                      icon: 'success',
                      title: 'Berhasil',
                      text: `Status pemesanan proyek "${proyek}" berhasil diperbarui.`,
                      timer: 2500,
                      showConfirmButton: false
                    }).then(() => {
                      this.loadInvoice(false);
                    });
                  }, 100);
                }
              },

              error: (err: any) => {
                const msg = err?.error?.message || err?.message || 'Retur gagal disimpan.';

                Swal.fire({
                  icon: 'error',
                  title: 'Gagal',
                  text: msg
                });
              }
            });
          });
        } else {
          this.closeStatus();
          this.cdr.detectChanges();

          setTimeout(() => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Status pemesanan proyek "${proyek}" berhasil diperbarui.`,
              timer: 2500,
              showConfirmButton: false
            }).then(() => {
              this.loadInvoice(false);
            });
          }, 100);
        }
      },

      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Status pemesanan gagal diperbarui.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // Modal Surat Jalan
  // ─────────────────────────────────────────────

  openSuratJalan(): void {
    // JIKA SUDAH ADA SURAT JALAN
    if (this.suratJalanData) {
      this.suratJalanForm = {
        id_invoice: this.detailInvoice?.id_invoice,
        no_surat_jalan: this.suratJalanData.no_surat_jalan,
        plat_kendaraan: this.suratJalanData.plat_kendaraan
      };
    }

    // JIKA BELUM ADA
    else {
      this.suratJalanForm = {
        id_invoice: this.detailInvoice?.id_invoice,
        no_surat_jalan: '',
        plat_kendaraan: ''
      };
    }

    this.showSuratJalanModal = true;
  }

  closeSuratJalan(): void {
    this.showSuratJalanModal = false;
  }

  submitSuratJalan(): void {
    if (!this.suratJalanForm.no_surat_jalan?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validasi',
        text: 'No surat jalan wajib diisi.'
      });
      return;
    }

    if (!this.suratJalanForm.plat_kendaraan?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validasi',
        text: 'Plat kendaraan wajib diisi.'
      });
      return;
    }

    // =========================
    // MODE UPDATE
    // =========================
    if (this.suratJalanData) {
      this.api.updateSuratJalan(this.suratJalanForm).subscribe({
        next: () => {
          this.suratJalanData = {
            ...this.suratJalanForm
          };

          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Surat jalan berhasil diperbarui.',
            timer: 2500,
            showConfirmButton: false
          });

          this.closeSuratJalan();
        },

        error: (err: any) => {
          const msg = err?.error?.message || err?.message || 'Surat jalan gagal diperbarui.';

          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: msg
          });
        }
      });

      return;
    }

    // =========================
    // MODE TAMBAH
    // =========================
    this.api.addSuratJalan(this.suratJalanForm).subscribe({
      next: () => {
        this.suratJalanData = {
          ...this.suratJalanForm
        };

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Surat jalan berhasil dibuat.',
          timer: 2500,
          showConfirmButton: false
        });

        this.closeSuratJalan();
      },

      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Surat jalan gagal dibuat.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  downloadSuratJalan(): void {
    if (!this.suratJalanData) return;

    const tanggal = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const rows = this.detailBarang.map((item: any, index: number) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(String(index + 1))]
          }),

          new TableCell({
            children: [new Paragraph(item.nama_barang)]
          }),

          new TableCell({
            children: [new Paragraph(`${item.jumlah} ${item.satuan}`)]
          })
        ]
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},

          children: [
            // =========================
            // HEADER
            // =========================
            new Paragraph({
              children: [
                new TextRun({
                  text: 'PANGLONG BBS',
                  bold: true,
                  size: 34
                })
              ],
              spacing: {
                after: 80
              }
            }),

            new Paragraph({
              text: 'Jl Gatot Subroto',
              spacing: {
                after: 40
              }
            }),

            new Paragraph({
              text: 'Medan',
              spacing: {
                after: 400
              }
            }),

            // =========================
            // TANGGAL
            // =========================
            new Paragraph({
              alignment: AlignmentType.RIGHT,

              children: [
                new TextRun({
                  text: `Medan, ${tanggal}`,
                  bold: true
                })
              ],

              spacing: {
                after: 300
              }
            }),

            // =========================
            // PENERIMA
            // =========================
            new Paragraph({
              children: [
                new TextRun({
                  text: `Kepada Yth : ${this.detailInvoice?.name}`,
                  bold: true
                })
              ]
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `${this.detailInvoice?.nama_project}`,
                  bold: true
                })
              ],

              spacing: {
                after: 300
              }
            }),

            // =========================
            // INFORMASI SURAT
            // =========================
            new Paragraph({
              text: `Surat Jalan : ${this.suratJalanData.no_surat_jalan}`
            }),

            new Paragraph({
              text: `No Plat Kendaraan : ${this.suratJalanData.plat_kendaraan}`,

              spacing: {
                after: 300
              }
            }),

            // =========================
            // TABEL
            // =========================
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },

              borders: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: '000000'
                },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: '000000'
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: '000000'
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: '000000'
                },
                insideHorizontal: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: '000000'
                },
                insideVertical: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: '000000'
                }
              },

              rows: [
                // HEADER TABLE
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 10,
                        type: WidthType.PERCENTAGE
                      },

                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'No',
                              bold: true
                            })
                          ]
                        })
                      ]
                    }),

                    new TableCell({
                      width: {
                        size: 60,
                        type: WidthType.PERCENTAGE
                      },

                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'Nama Barang',
                              bold: true
                            })
                          ]
                        })
                      ]
                    }),

                    new TableCell({
                      width: {
                        size: 30,
                        type: WidthType.PERCENTAGE
                      },

                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'Quantity',
                              bold: true
                            })
                          ]
                        })
                      ]
                    })
                  ]
                }),

                ...rows
              ]
            }),

            // =========================
            // CATATAN
            // =========================
            new Paragraph({
              spacing: {
                before: 250
              },

              children: [
                new TextRun({
                  text: 'Catatan : ',
                  bold: true,
                  italics: true
                }),

                new TextRun({
                  text: 'Mohon di cek kembali bahan-bahan yang diantar',
                  italics: true
                })
              ]
            }),

            // =========================
            // SPASI TTD
            // =========================
            new Paragraph({
              text: '',
              spacing: {
                after: 700
              }
            }),

            // =========================
            // TTD SEJAJAR
            // =========================
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },

              borders: {
                top: {
                  style: BorderStyle.NONE,
                  size: 0,
                  color: 'FFFFFF'
                },
                bottom: {
                  style: BorderStyle.NONE,
                  size: 0,
                  color: 'FFFFFF'
                },
                left: {
                  style: BorderStyle.NONE,
                  size: 0,
                  color: 'FFFFFF'
                },
                right: {
                  style: BorderStyle.NONE,
                  size: 0,
                  color: 'FFFFFF'
                },
                insideHorizontal: {
                  style: BorderStyle.NONE,
                  size: 0,
                  color: 'FFFFFF'
                },
                insideVertical: {
                  style: BorderStyle.NONE,
                  size: 0,
                  color: 'FFFFFF'
                }
              },

              rows: [
                new TableRow({
                  children: [
                    // HORMAT KAMI
                    new TableCell({
                      width: {
                        size: 50,
                        type: WidthType.PERCENTAGE
                      },

                      children: [
                        new Paragraph({
                          text: 'Hormat Kami,',
                          alignment: AlignmentType.LEFT
                        }),

                        new Paragraph({
                          text: '',
                          spacing: {
                            after: 900
                          }
                        }),

                        new Paragraph({
                          text: '................................',
                          alignment: AlignmentType.LEFT
                        }),

                        new Paragraph({
                          text: '(                           )',
                          alignment: AlignmentType.LEFT
                        })
                      ]
                    }),

                    // DITERIMA OLEH
                    new TableCell({
                      width: {
                        size: 50,
                        type: WidthType.PERCENTAGE
                      },

                      children: [
                        new Paragraph({
                          text: 'Diterima Oleh :',
                          alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                          text: '',
                          spacing: {
                            after: 900
                          }
                        }),

                        new Paragraph({
                          text: '................................',
                          alignment: AlignmentType.CENTER
                        }),

                        new Paragraph({
                          text: '(                           )',
                          alignment: AlignmentType.CENTER
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
      saveAs(blob, `Surat-Jalan-${this.suratJalanData.no_surat_jalan}.docx`);
    });
  }

  // ─────────────────────────────────────────────
  // Barang helpers
  // ─────────────────────────────────────────────
  generateBarangSelect(): void {
    this.selectedBarang = [];

    const total = Number(this.jumlahJenisBarang) || 0;

    for (let i = 0; i < total; i++) {
      this.selectedBarang.push({
        id_barang: null,
        jumlah: 1,
        harga_jual: 0,
        satuan: ''
      });
    }
  }

  onBarangChange(item: any): void {
    const barang = this.barang.find((b: any) => b.id_barang == item.id_barang);
    if (barang) {
      item.harga_jual = barang.harga_jual;
      item.satuan = barang.satuan;
    }
    this.calculateTotal();
  }

  isBarangSelected(id_barang: any, currentItem: any): boolean {
    return this.selectedBarang.some((item: any) => item !== currentItem && item.id_barang == id_barang);
  }

  calculateTotal(): void {
    this.addForm.total_harga = this.selectedBarang.reduce((total, item) => {
      return total + (Number(item.jumlah) || 0) * (Number(item.harga_jual) || 0);
    }, 0);
  }

  onBarangChangeEdit(item: any): void {
    const barang = this.barang.find((b: any) => b.id_barang == item.id_barang);
    if (barang) {
      item.harga_jual = barang.harga_jual;
      item.satuan = barang.satuan;
    }
    this.calculateEditTotal();
  }

  calculateEditTotal(): void {
    this.editForm.total_harga = this.editBarang.reduce((total, item) => {
      return total + (Number(item.jumlah) || 0) * (Number(item.harga_jual) || 0);
    }, 0);
  }

  isBarangSelectedEdit(id_barang: any, currentItem: any): boolean {
    return this.editBarang.some((item: any) => item !== currentItem && item.id_barang == id_barang);
  }

  // ─────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────
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

  formatRupiah(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return Number(value).toLocaleString('id-ID');
  }
  onJumlahJenisBarangChange(value: any): void {
    const angka = String(value).replace(/[^0-9]/g, '');

    this.jumlahJenisBarang = angka ? Number(angka) : null;

    this.generateBarangSelect();
  }

  onHargaInput(event: any, item: any): void {
    let value = event.target.value || '';

    // hanya angka
    value = value.replace(/\D/g, '');

    // simpan angka asli
    item.harga_jual = Number(value);

    // tampilkan format ribuan
    event.target.value = this.formatNumber(value);

    this.calculateTotal();
  }

  onHargaInputEdit(event: any, item: any): void {
    let value = event.target.value || '';

    value = value.replace(/\D/g, '');

    item.harga_jual = Number(value);

    event.target.value = this.formatNumber(value);

    this.calculateEditTotal();
  }
}
