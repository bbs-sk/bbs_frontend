import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatPaginatorModule, MatButtonModule, MatIconModule, NgSelectModule],
  templateUrl: './project.html',
  styleUrl: './project.scss'
})
export class Project {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  userLogin: any = null;
  isRole = false;

  project: any[] = [];
  filteredProject: any[] = [];
  paginatedProject: any[] = [];
  userLapangan: any[] = [];

  isLoading = false;
  pageSize = 10;
  pageIndex = 0;
  isSubmitting = false;
  searchKeyword = '';
  searchFocused = false;

  showAddModal = false;
  showEditModal = false;

  addProjectForm!: FormGroup;
  editProjectForm!: FormGroup;

  get totalPages(): number {
    return Math.ceil(this.filteredProject.length / this.pageSize) || 1;
  }

  ngOnInit(): void {
    this.userLogin = JSON.parse(localStorage.getItem('user') || '{}');

    this.isRole = this.userLogin?.role !== 'Lapangan';

    this.loadProject();
    this.loadUserLapangan();

    this.addProjectForm = this.fb.group({
      nama_project: ['', Validators.required],
      alamat: ['', Validators.required],
      id_user1: [null],
      id_user2: [null]
    });

    this.editProjectForm = this.fb.group({
      id_project: [null],
      nama_project: ['', Validators.required],
      alamat: ['', Validators.required],
      id_user1: [null],
      id_user2: [null]
    });
  }

  getAddUser1() {
    return this.userLapangan.filter((u) => u.id_user !== this.addProjectForm.get('id_user2')?.value);
  }

  getAddUser2() {
    return this.userLapangan.filter((u) => u.id_user !== this.addProjectForm.get('id_user1')?.value);
  }

  getEditUser1() {
    return this.userLapangan.filter((u) => u.id_user !== this.editProjectForm.get('id_user2')?.value);
  }

  getEditUser2() {
    return this.userLapangan.filter((u) => u.id_user !== this.editProjectForm.get('id_user1')?.value);
  }

  loadProject(showLoading: boolean = true): void {
    this.isLoading = true;

    if (showLoading) {
      this.loadingAnimation();
    }

    this.api.getProject().subscribe({
      next: (res: any) => {
        this.project = Array.isArray(res) ? res : (res?.val ?? []);

        if (!this.isRole) {
          this.project = this.project.filter((p: any) => p.id_user1 === this.userLogin.id_user || p.id_user2 === this.userLogin.id_user);
        }

        this.filteredProject = [...this.project];

        this.pageIndex = 0;

        this.updatePaginatedData();

        this.isLoading = false;

        if (showLoading) {
          Swal.close();
        }

        this.cdr.detectChanges();
      },

      error: () => {
        this.project = [];
        this.filteredProject = [];
        this.paginatedProject = [];

        this.isLoading = false;

        if (showLoading) {
          Swal.close();
        }

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Data proyek gagal dimuat.'
        });

        this.cdr.detectChanges();
      }
    });
  }

  loadUserLapangan(): void {
    this.api.getUserLapangan().subscribe({
      next: (res: any) => {
        this.userLapangan = Array.isArray(res) ? res : (res?.val ?? []);
      },

      error: () => {
        this.userLapangan = [];
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedProject = this.filteredProject.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.updatePaginatedData();
  }

  searchData(): void {
    const keyword = this.searchKeyword.trim();

    if (!keyword) {
      this.filteredProject = [...this.project];

      this.pageIndex = 0;

      this.updatePaginatedData();

      this.cdr.detectChanges();

      return;
    }

    this.loadingAnimation();

    this.api.searchProject({ keyword }).subscribe({
      next: (res: any) => {
        this.filteredProject = Array.isArray(res) ? res : (res?.val ?? []);

        this.pageIndex = 0;

        this.updatePaginatedData();

        Swal.close();

        this.cdr.detectChanges();
      },

      error: () => {
        this.filteredProject = [];

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

    this.filteredProject = [...this.project];

    this.pageIndex = 0;

    this.updatePaginatedData();
  }

  openAdd(): void {
    this.addProjectForm.reset({
      nama_project: '',
      alamat: '',
      id_user1: null,
      id_user2: null
    });

    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
    this.isSubmitting = false;
  }

  submitAdd(): void {
    if (this.isSubmitting) return;
    if (this.addProjectForm.invalid) {
      this.addProjectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.api.addProject(this.addProjectForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        const nama = this.addProjectForm.value.nama_project;
        this.closeAdd();
        this.cdr.detectChanges();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Proyek "${nama}" berhasil ditambahkan.`,
            timer: 2500,
            showConfirmButton: false
          }).then(() => this.loadProject(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error?.message || err?.message || 'Proyek gagal ditambahkan.'
        });
      }
    });
  }

  onEdit(p: any): void {
    const user1Exist = this.userLapangan.some((u) => u.id_user === p.id_user1);

    const user2Exist = this.userLapangan.some((u) => u.id_user === p.id_user2);

    this.editProjectForm.patchValue({
      id_project: p.id_project,
      nama_project: p.nama_project ?? '',
      alamat: p.alamat ?? '',
      id_user1: user1Exist ? p.id_user1 : null,
      id_user2: user2Exist ? p.id_user2 : null
    });

    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.isSubmitting = false;
  }

  submitEdit(): void {
    if (this.isSubmitting) return;
    if (this.editProjectForm.invalid) {
      this.editProjectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.api.updateProject(this.editProjectForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        const nama = this.editProjectForm.value.nama_project;
        this.closeEdit();
        this.cdr.detectChanges();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Proyek "${nama}" berhasil diperbarui.`,
            timer: 3000,
            showConfirmButton: false
          }).then(() => this.loadProject(false));
        }, 100);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error?.message || err?.message || 'Proyek gagal diperbarui.'
        });
      }
    });
  }

  onDelete(p: any): void {
    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus proyek "${p.nama_project}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteProject(p.id_project).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Proyek "${p.nama_project}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            }).then(() => {
              this.loadProject(false);
            });
          },

          error: (err: any) => {
            const msg = err?.error?.message || err?.message || 'Proyek gagal dihapus.';

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
