import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  fieldError: boolean = false;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  onLogin() {
    // Reset state
    this.errorMessage = '';
    this.fieldError = false;

    // Validasi field kosong
    if (!this.username.trim() || !this.password.trim()) {
      this.fieldError = true;
      this.errorMessage = 'Username dan password wajib diisi.';
      return;
    }

    this.isLoading = true;

    const payload = {
      username: this.username.trim(),
      password: this.password
    };

    this.api.login(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        const role = response.user.role;
        if (role === 'Admin Kantor') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/barang']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      }
    });
  }
}
