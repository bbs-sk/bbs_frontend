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
    this.loadUsers(); // <= ini yang bikin data balik lagi setelah refresh/HMR
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
    // sesuaikan payload dengan backend kamu
    const payload = {
      name: this.addForm.name,
      role: Number(this.addForm.role),
      username: this.addForm.username,
      password: this.addForm.password
    };

    // pastikan ApiService punya method ini
    this.api.addUser(payload).subscribe({
      next: () => {
        this.closeAdd();
        this.loadUsers(); // penting: refresh list
      },
      error: (err) => console.error(err)
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

    // pastikan ApiService punya method ini
    this.api.updateUser(payload).subscribe({
      next: () => {
        this.closeEdit();
        this.loadUsers();
      },
      error: (err) => console.error(err)
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
            Swal.fire({
              title: 'Berhasil!',
              text: `Pengguna "${u.name}" berhasil dihapus`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });

            this.loadUsers();
          },
          error: (err) => {
            console.error(err);

            Swal.fire({
              title: 'Gagal!',
              text: 'Pengguna gagal dihapus',
              icon: 'error'
            });
          }
        });
      }
    });
  }

  // tutup modal via klik backdrop / esc (opsional sederhana)
  closeAllModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
  }
}
