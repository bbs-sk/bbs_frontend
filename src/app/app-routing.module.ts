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
        path: 'user',
        canActivate: [authGuard, roleGuard(['Admin Kantor'])],
        loadComponent: () => import('./pages/user/user').then((c) => c.User)
      },
      {
        path: 'project',
        canActivate: [authGuard, roleGuard(['Admin Kantor', 'Lapangan'])],
        loadComponent: () => import('./pages/project/project').then((c) => c.Project)
      },
      {
        path: 'barang',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/barang/barang').then((c) => c.Barang)
      },
      {
        path: 'invoice',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/invoice/invoice').then((c) => c.Invoice)
      },
      {
        path: 'transaksi',
        canActivate: [authGuard, roleGuard(['Admin Kantor', 'Gudang'])],
        loadComponent: () => import('./pages/transaksi/transaksi').then((c) => c.Transaksi)
      },
      {
        path: 'laporan',
        canActivate: [authGuard, roleGuard(['Admin Kantor'])],
        loadComponent: () => import('./pages/laporan/laporan').then((c) => c.Laporan)
      },
      {
        path: 'typography',
        loadComponent: () => import('./demo/component/basic-component/typography/typography.component').then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () => import('./demo/component/basic-component/color/color.component').then((c) => c.ColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
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
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
