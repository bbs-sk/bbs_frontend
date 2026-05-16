import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-barang',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barang.html',
  styleUrl: './barang.scss'
})
export class Barang {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  barang: any[] = [];
  isLoading = false;

  showAddModal = false;
  showEditModal = false;

  addForm: any = {
    kode_barang: '',
    nama_barang: '',
    satuan: '',
    harga_jual: 0
  };

  editForm: any = {
    kode_barang: '',
    nama_barang: '',
    satuan: '',
    harga_jual: 0
  };

  ngOnInit() {
    this.loadBarang();
  }

  loadBarang() {
    this.api.getBarang().subscribe({
      next: (res: any) => {
        this.barang = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
        console.log(this.barang);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  statusLabel(status: any) {
    return Number(status) === 1 ? 'Aktif' : 'Tidak Aktif';
  }

  statusClass(status: any) {
    return Number(status) === 1 ? 'bg-success' : 'bg-danger';
  }

  openAdd() {
    this.addForm = {
      kode_barang: '',
      nama_barang: '',
      satuan: '',
      harga_jual: 0
    };

    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  submitAdd() {
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

      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Barang gagal ditambahkan. Silakan coba lagi.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  onEdit(b: any) {
    this.editForm = { ...b };

    this.showEditModal = true;
  }

  closeEdit() {
    this.showEditModal = false;
  }

  submitEdit() {
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

      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Barang gagal diperbarui. Silakan coba lagi.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  onDelete(b: any) {
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

          error: (err) => {
            const msg = err?.error?.message || err?.message || 'Barang gagal dihapus. Silakan coba lagi.';

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
}
