import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

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
  showDeleteModal = false;

  addForm: any = {
    nama_project: '',
    alamat: ''
  };

  editForm: any = {
    id_project: null,
    nama_project: '',
    alamat: ''
  };

  deleteTarget: any = null;

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
        this.closeAdd();

        this.loadProject();
      },

      error: (err) => console.log(err)
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
        this.closeEdit();

        this.loadProject();
      },

      error: (err) => console.log(err)
    });
  }

  // ================= DELETE (SOFT DELETE) =================

  onDelete(p: any) {
    this.deleteTarget = p;

    this.showDeleteModal = true;
  }

  closeDelete() {
    this.showDeleteModal = false;

    this.deleteTarget = null;
  }

  confirmDelete() {
    const id = this.deleteTarget?.id_project;

    this.api.deleteProject(id).subscribe({
      next: () => {
        this.closeDelete();

        this.loadProject();
      },

      error: (err) => console.log(err)
    });
  }
}
