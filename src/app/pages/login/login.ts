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

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  onLogin() {
    const payload = {
      username: this.username,
      password: this.password
    };

    this.api.login(payload).subscribe({
      next: (response) => {
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
        console.log(err);

        alert(err.error.message);
      }
    });
  }
}
