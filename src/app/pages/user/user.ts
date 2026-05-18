import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrl: './user.scss'
})
export class User {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  users: any[] = [];
  isLoading = false;

  showAddModal = false;
  showEditModal = false;

  addForm: any = {
    name: '',
    role: 1,
    username: '',
    password: '',
    email: ''
  };

  editForm: any = {
    id_user: null,
    name: '',
    role: 1,
    username: '',
    password: '',
    email: ''
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res?.val ?? []);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.users = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===== Helpers =====
  roleLabel(role: any): string {
    const r = Number(role);
    return r === 1 ? 'Admin' : r === 2 ? 'Gudang' : r === 3 ? 'Lapangan' : '-';
  }

  roleBadgeClass(role: any): string {
    const r = Number(role);
    return r === 1 ? 'text-success' : r === 2 ? 'text-primary' : r === 3 ? 'text-warning' : 'text-secondary';
  }

  // ===== Add =====
  openAdd(): void {
    this.addForm = { name: '', role: 1, username: '', password: '' };
    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
  }

  submitAdd(): void {
    const payload = {
      name: this.addForm.name,
      role: Number(this.addForm.role),
      username: this.addForm.username,
      password: this.addForm.password
    };

    this.api.addUser(payload).subscribe({
      next: () => {
        const nama = this.addForm.name;

        this.closeAdd();
        this.loadUsers();

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Pengguna "${nama}" berhasil ditambahkan.`,
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Pengguna gagal ditambahkan. Silakan coba lagi.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // ===== Edit =====
  onEdit(u: any): void {
    // clone agar tidak langsung mengubah table sebelum save
    this.editForm = {
      id_user: u.id_user,
      name: u.name ?? '',
      role: Number(u.role ?? 1),
      username: u.username ?? '',
      password: u.password ?? ''
    };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  submitEdit(): void {
    const payload = {
      id_user: this.editForm.id_user,
      name: this.editForm.name,
      role: Number(this.editForm.role),
      username: this.editForm.username,
      password: this.editForm.password
    };

    this.api.updateUser(payload).subscribe({
      next: () => {
        const nama = this.editForm.name;

        this.closeEdit();
        this.loadUsers();

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Pengguna "${nama}" berhasil diperbarui.`,
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Pengguna gagal diperbarui. Silakan coba lagi.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  onDelete(u: any): void {
    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus pengguna "${u.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteUser(u.id_user).subscribe({
          next: () => {
            this.loadUsers();

            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Pengguna "${u.name}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            const msg = err?.error?.message || err?.message || 'Pengguna gagal dihapus. Silakan coba lagi.';

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

  closeAllModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
  }
}
