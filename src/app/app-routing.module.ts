import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { authGuard } from './shared/guard/auth.guard';
import { redirectGuard } from './shared/guard/redirect.guard';
import { roleGuard } from './shared/guard/role.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [redirectGuard],
    pathMatch: 'full',
    children: []
  },
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [authGuard, roleGuard(['Admin Kantor'])],
        loadComponent: () => import('./pages/dashboard/dashboard').then((c) => c.Dashboard)
      },
      {
        path: 'daftar-pengguna',
        canActivate: [authGuard, roleGuard(['Admin Kantor'])],
        loadComponent: () => import('./pages/user/user').then((c) => c.User)
      },
      {
        path: 'proyek',
        canActivate: [authGuard, roleGuard(['Admin Kantor', 'Lapangan'])],
        loadComponent: () => import('./pages/project/project').then((c) => c.Project)
      },
      {
        path: 'barang',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/barang/barang').then((c) => c.Barang)
      },
      {
        path: 'pemesanan',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/invoice/invoice').then((c) => c.Invoice)
      },
      {
        path: 'transaksi-barang',
        canActivate: [authGuard, roleGuard(['Admin Kantor', 'Gudang'])],
        loadComponent: () => import('./pages/transaksi/transaksi').then((c) => c.Transaksi)
      },
      {
        path: 'laporan-penjualan',
        canActivate: [authGuard, roleGuard(['Admin Kantor'])],
        loadComponent: () => import('./pages/laporan/laporan').then((c) => c.Laporan)
      }
    ]
  },
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((c) => c.Login)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
