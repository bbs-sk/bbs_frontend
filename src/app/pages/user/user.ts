import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './user.html',
  styleUrl: './user.scss'
})
export class User {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}
  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];
  isLoading = false;
  pageSize = 5;
  pageIndex = 0;
  searchKeyword = '';
  showAddModal = false;
  showEditModal = false;

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

  loadUsers(): void {
    this.isLoading = true;
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res?.val ?? []);
        this.filteredUsers = [...this.users];
        this.pageIndex = 0;
        this.updatePaginatedData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.users = [];
        this.filteredUsers = [];
        this.paginatedUsers = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
    this.api.searchUser({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredUsers = Array.isArray(res) ? res : (res?.val ?? []);
        this.pageIndex = 0;
        this.updatePaginatedData();
        this.cdr.detectChanges();
      },
      error: () => {
        this.filteredUsers = [];
        this.pageIndex = 0;
        this.updatePaginatedData();
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

  roleLabel(role: any): string {
    return role || '-';
  }
  roleBadgeClass(role: any): string {
    if (role === 'Admin Kantor') {
      return 'text-success';
    }
    if (role === 'Gudang') {
      return 'text-primary';
    }
    if (role === 'Lapangan') {
      return 'text-warning';
    }
    return 'text-secondary';
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

  closeAllModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
  }
}
