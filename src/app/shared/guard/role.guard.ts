import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);

    const userData = localStorage.getItem('user');

    if (!userData) {
      router.navigate(['/login']);

      return false;
    }

    const user = JSON.parse(userData);

    // cek role
    if (roles.includes(user.role)) {
      return true;
    }

    // redirect berdasarkan role
    if (user.role !== 'Admin Kantor') {
      router.navigate(['/barang']);
    } else {
      router.navigate(['/dashboard']);
    }

    return false;
  };
};
