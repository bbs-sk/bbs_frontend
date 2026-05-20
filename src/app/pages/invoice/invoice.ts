import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice.html',
  styleUrls: ['./invoice.scss', '../../app.component.scss']
})
export class Invoice {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  invoice: any[] = [];
  project: any[] = [];
  barang: any[] = [];
  selectedBarang: any[] = [];
  editBarang: any[] = [];
  statusInvoice: any = null;
  returBarang: any[] = [];
  jumlahJenisBarang = 0;
  idUser = 1;
  status = 'menunggu';

  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showDetailModal = false;
  showStatusModal = false;

  detailInvoice: any = null;
  detailBarang: any[] = [];

  statusForm: any = {
    id_invoice: null,
    status: ''
  };

  addForm: any = {
    id_user: null,
    id_project: null,
    total_harga: 0,
    pembayaran: ''
  };

  editForm: any = {};
  deleteTarget: any = null;

  ngOnInit() {
    this.loadInvoice();
    this.getProject();
    this.getBarang();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning';

      case 'approved':
        return 'bg-primary';

      case 'delivery':
        return 'bg-info';

      case 'finish':
        return 'bg-success';

      case 'rejected':
        return 'bg-danger';

      default:
        return 'bg-secondary';
    }
  }

  loadInvoice() {
    this.api.getInvoice().subscribe({
      next: (res: any) => {
        this.invoice = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  openAdd() {
    this.addForm = {
      id_user: this.idUser,
      id_project: null,
      total_harga: 0,
      pembayaran: ''
    };
    this.jumlahJenisBarang = 0;
    this.selectedBarang = [];
    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  submitAdd() {
    const payload = {
      ...this.addForm,
      status: this.status,
      barang: this.selectedBarang
    };

    this.api.addInvoice(payload).subscribe({
      next: (res) => {
        this.loadInvoice();

        setTimeout(() => {
          this.closeAdd();
        });
      },

      error: (err) => {
        alert(JSON.stringify(err.error));
      }
    });
  }

  onEdit(i: any) {
    this.editForm = {
      id_invoice: i.id_invoice,
      id_project: i.id_project,
      pembayaran: i.pembayaran,
      total_harga: i.total_harga
    };

    this.editBarang = [];

    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.val ?? []);

        this.editBarang = data.map((item: any) => {
          // cari data barang lengkap
          const barang = this.barang.find((b: any) => b.id_barang == item.id_barang);

          return {
            id_brg_keluar: item.id_brg_keluar,
            id_barang: item.id_barang,
            jumlah: item.jumlah,
            harga_jual: item.harga_jual,

            // isi satuan langsung
            satuan: barang?.satuan || ''
          };
        });
        this.calculateEditTotal();
        this.editBarang = [...this.editBarang];
        this.showEditModal = true;
        this.cdr.detectChanges();
      },

      error: (err) => console.log(err)
    });
  }

  closeEdit() {
    this.showEditModal = false;
  }

  submitEdit() {
    const payload = {
      ...this.editForm,
      barang: this.editBarang
    };

    this.api.updateInvoice(payload).subscribe({
      next: () => {
        this.closeEdit();

        this.loadInvoice();
      },

      error: (err) => {
        console.log(err);
      }
    });
  }

  onDelete(i: any) {
    this.deleteTarget = i;
    this.showDeleteModal = true;
  }

  closeDelete() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    const id = this.deleteTarget?.id_invoice;

    this.api.deleteInvoice(id).subscribe({
      next: () => {
        this.closeDelete();
        this.loadInvoice();
      },
      error: (err) => console.log(err)
    });
  }

  openDetail(i: any) {
    this.detailInvoice = i;

    this.detailBarang = [];

    this.api.getBrgKeluarId(i.id_invoice).subscribe({
      next: (res: any) => {
        this.detailBarang = Array.isArray(res) ? res : (res?.val ?? []);
        this.showDetailModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  closeDetail() {
    this.showDetailModal = false;
    this.detailInvoice = null;
    this.detailBarang = [];
  }

  openStatus(data: any): void {
    this.statusInvoice = data;

    this.statusForm = {
      id_invoice: data.id_invoice,
      status: data.status
    };

    this.detailBarang = [];

    this.returBarang = [];

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

        this.showStatusModal = true;

        this.cdr.detectChanges();
      },

      error: (err) => console.log(err)
    });
  }

  addReturItem(): void {
    this.returBarang.push({
      id_barang: null,
      jumlah: 1,
      alasan: ''
    });
  }

  closeStatus() {
    this.showStatusModal = false;
  }

  submitStatus() {
    const returSelected = this.returBarang.filter((x: any) => x.checked);

    // VALIDASI
    for (const item of returSelected) {
      if (item.jumlah_retur > item.jumlah) {
        alert('Jumlah retur melebihi qty barang');

        return;
      }

      if (!item.kondisi) {
        alert('Kondisi barang wajib diisi');

        return;
      }
    }

    // UPDATE STATUS
    this.api.updateStatusInvoice(this.statusForm).subscribe({
      next: () => {
        // JIKA ADA RETUR
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

                  this.loadInvoice();
                }
              },

              error: (err) => {
                console.log(err);
              }
            });
          });
        } else {
          this.closeStatus();

          this.loadInvoice();
        }
      },

      error: (err) => console.log(err)
    });
  }

  getProject() {
    this.api.getProject().subscribe({
      next: (res: any) => {
        this.project = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }

  getBarang() {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barang = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }

  generateBarangSelect() {
    this.selectedBarang = [];

    for (let i = 0; i < this.jumlahJenisBarang; i++) {
      this.selectedBarang.push({
        id_barang: null,
        jumlah: 1,
        harga_jual: 0
      });
    }
  }

  onBarangChange(item: any) {
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

  calculateTotal() {
    this.addForm.total_harga = this.selectedBarang.reduce((total, item) => {
      const jumlah = Number(item.jumlah) || 0;
      const harga = Number(item.harga_jual) || 0;

      return total + jumlah * harga;
    }, 0);
  }

  onBarangChangeEdit(item: any) {
    const barang = this.barang.find((b: any) => b.id_barang == item.id_barang);

    if (barang) {
      item.harga_jual = barang.harga_jual;
      item.satuan = barang.satuan;
    }

    this.calculateEditTotal();
  }

  calculateEditTotal() {
    this.editForm.total_harga = this.editBarang.reduce((total, item) => {
      const jumlah = Number(item.jumlah) || 0;
      const harga = Number(item.harga_jual) || 0;

      return total + jumlah * harga;
    }, 0);
  }

  isBarangSelectedEdit(id_barang: any, currentItem: any): boolean {
    return this.editBarang.some((item: any) => item !== currentItem && item.id_barang == id_barang);
  }
}
