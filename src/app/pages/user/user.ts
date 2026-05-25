import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatButtonModule, MatIconModule, NgSelectModule],
  templateUrl: './user.html',
  styleUrl: './user.scss'
})
export class User implements OnInit {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];
  isLoading = false;
  pageSize = 10;
  pageIndex = 0;
  searchKeyword = '';
  showAddModal = false;
  showEditModal = false;
  searchFocused = false;

  addForm: any = {
    name: '',
    role: 'Admin Kantor',
    username: '',
    password: ''
  };

  editForm: any = {
    id_user: null,
    name: '',
    role: 'Admin Kantor',
    username: '',
    password: ''
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(showLoading: boolean = true): void {
    this.isLoading = true;
    if (showLoading) {
      this.loadingAnimation();
    }
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res?.val ?? []);
        this.filteredUsers = [...this.users];
        this.pageIndex = 0;
        this.updatePaginatedData();
        this.isLoading = false;
        if (showLoading) {
          Swal.close();
        }
        this.cdr.detectChanges();
      },

      error: () => {
        this.users = [];
        this.filteredUsers = [];
        this.paginatedUsers = [];
        this.isLoading = false;
        if (showLoading) {
          Swal.close();
        }
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Data pengguna gagal dimuat.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  updatePaginatedData(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  searchData(): void {
    const keyword = this.searchKeyword.trim();
    if (!keyword) {
      this.filteredUsers = [...this.users];
      this.pageIndex = 0;
      this.updatePaginatedData();
      this.cdr.detectChanges();
      return;
    }
    this.loadingAnimation();
    this.api.searchUser({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredUsers = Array.isArray(res) ? res : (res?.val ?? []);
        this.pageIndex = 0;
        this.updatePaginatedData();
        Swal.close();
        this.cdr.detectChanges();
      },
      error: () => {
        this.filteredUsers = [];
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
    this.filteredUsers = [...this.users];
    this.pageIndex = 0;
    this.updatePaginatedData();
  }

  roleLabel(role: string): string {
    return role || '-';
  }

  roleBadgeClass(role: string): string {
    if (role === 'Admin Kantor') {
      return 'admin';
    }
    if (role === 'Gudang') {
      return 'gudang';
    }
    if (role === 'Lapangan') {
      return 'lapangan';
    }
    return 'default';
  }

  openAdd(): void {
    this.addForm = {
      name: '',
      role: 'Admin Kantor',
      username: '',
      password: ''
    };
    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
  }

  submitAdd(): void {
    if (!this.addForm.name || !this.addForm.role || !this.addForm.username || !this.addForm.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Semua field wajib diisi.'
      });
      return;
    }
    const payload = {
      name: this.addForm.name,
      role: this.addForm.role,
      username: this.addForm.username,
      password: this.addForm.password
    };
    this.api.addUser(payload).subscribe({
      next: () => {
        const nama = this.addForm.name;
        this.closeAdd();
        this.loadUsers(false);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Pengguna "${nama}" berhasil ditambahkan.`,
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Pengguna gagal ditambahkan.';
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  onEdit(u: any): void {
    this.editForm = {
      id_user: u.id_user,
      name: u.name ?? '',
      role: u.role ?? 'Admin Kantor',
      username: u.username ?? '',
      password: u.password ?? ''
    };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  submitEdit(): void {
    if (!this.editForm.name || !this.editForm.role || !this.editForm.username || !this.editForm.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Semua field wajib diisi.'
      });
      return;
    }

    const payload = {
      id_user: this.editForm.id_user,
      name: this.editForm.name,
      role: this.editForm.role,
      username: this.editForm.username,
      password: this.editForm.password
    };

    this.api.updateUser(payload).subscribe({
      next: () => {
        const nama = this.editForm.name;
        this.closeEdit();
        this.loadUsers(false);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Pengguna "${nama}" berhasil diperbarui.`,
          timer: 2500,
          showConfirmButton: false
        });
      },

      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Pengguna gagal diperbarui.';
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
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteUser(u.id_user).subscribe({
          next: () => {
            this.loadUsers(false);
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Pengguna "${u.name}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            const msg = err?.error?.message || err?.message || 'Pengguna gagal dihapus.';
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
