import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project.html',
  styleUrl: './project.scss'
})
export class Project {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  project: any[] = [];
  isLoading = false;

  showAddModal = false;
  showEditModal = false;

  addForm: any = {
    nama_project: '',
    alamat: ''
  };

  editForm: any = {
    id_project: null,
    nama_project: '',
    alamat: ''
  };

  ngOnInit() {
    this.loadProject();
  }

  // ================= LOAD DATA =================

  loadProject() {
    this.api.getProject().subscribe({
      next: (res: any) => {
        this.project = Array.isArray(res) ? res : (res?.val ?? []);

        this.cdr.detectChanges();

        console.log(this.project);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  // ================= ADD =================

  openAdd() {
    this.addForm = {
      nama_project: '',
      alamat: ''
    };

    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  submitAdd() {
    this.api.addProject(this.addForm).subscribe({
      next: () => {
        const nama = this.addForm.nama_project;

        this.closeAdd();
        this.loadProject();

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Proyek "${nama}" berhasil ditambahkan.`,
          timer: 2500,
          showConfirmButton: false
        });
      },

      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Proyek gagal ditambahkan. Silakan coba lagi.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // ================= EDIT =================

  onEdit(p: any) {
    this.editForm = {
      id_project: p.id_project,
      nama_project: p.nama_project,
      alamat: p.alamat
    };

    this.showEditModal = true;
  }

  closeEdit() {
    this.showEditModal = false;
  }

  submitEdit() {
    this.api.updateProject(this.editForm).subscribe({
      next: () => {
        const nama = this.editForm.nama_project;

        this.closeEdit();
        this.loadProject();

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Proyek "${nama}" berhasil diperbarui.`,
          timer: 3000,
          showConfirmButton: false
        });
      },

      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Proyek gagal diperbarui. Silakan coba lagi.';

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg
        });
      }
    });
  }

  // ================= DELETE (SOFT DELETE) =================
  onDelete(p: any) {
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
            this.loadProject();

            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: `Proyek "${p.nama_project}" berhasil dihapus.`,
              timer: 2500,
              showConfirmButton: false
            });
          },

          error: (err) => {
            const msg = err?.error?.message || err?.message || 'Proyek gagal dihapus. Silakan coba lagi.';

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
