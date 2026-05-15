// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: '/dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'user',
        loadComponent: () => import('./pages/user/user').then((c) => c.User)
      },
      {
        path: 'project',
        loadComponent: () => import('./pages/project/project').then((c) => c.Project)
      },
      {
        path: 'barang',
        loadComponent: () => import('./pages/barang/barang').then((c) => c.Barang)
      },
      {
        path: 'invoice',
        loadComponent: () => import('./pages/invoice/invoice').then((c) => c.Invoice)
      },
      {
        path: 'order',
        loadComponent: () => import('./pages/order/order').then((c) => c.Order)
      },
      {
        path: 'stock',
        loadComponent: () => import('./pages/stock/stock').then((c) => c.Stock)
      },
      {
        path: 'transaksi',
        loadComponent: () => import('./pages/transaksi/transaksi').then((c) => c.Transaksi)
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
        loadComponent: () => import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
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
