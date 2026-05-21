import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const redirectGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  // jika belum login
  if (!token) {
    router.navigate(['/login']);

    return false;
  }

  // ambil user
  const userString = localStorage.getItem('user');

  if (!userString) {
    router.navigate(['/login']);

    return false;
  }

  const user = JSON.parse(userString);

  const role = user.role;

  // redirect berdasarkan role
  if (role === 'Admin Kantor') {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/barang']);
  }

  return false;
};
