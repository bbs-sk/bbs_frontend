// angular import
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import tableData from 'src/fake-data/default-data.json';

import { MonthlyBarChartComponent } from 'src/app/theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';

// icons
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { FallOutline, ArrowDownOutline, ArrowUpOutline, CloseOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CardComponent, IconDirective, MonthlyBarChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private iconService = inject(IconService);
  // constructor
  constructor(private api: ApiService) {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, ArrowDownOutline, ArrowUpOutline, CloseOutline]);
  }

  recentOrder = tableData;
  invoice: any[] = [];
  activity: any[] = [];

  AnalyticEcommerce = [
    {
      title: 'Total Barang',
      amount: '0',
      color: 'text-primary',
      detail: 'Item Digudang'
    },
    {
      title: 'Barang Masuk',
      amount: '0',
      color: 'text-primary',
      detail: 'Bulan ini'
    },
    {
      title: 'Barang Keluar',
      amount: '0',
      color: 'text-primary',
      detail: 'Bulan ini'
    },
    {
      title: 'Pesanan',
      amount: '0',
      color: 'text-warning',
      detail: 'Menunggu Persetujuan'
    }
  ];

  ngOnInit(): void {
    this.loadDashboard();
    this.loadInvoice();
  }

  loadDashboard() {
    // TOTAL BARANG
    this.api.getTotalBarang().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[0].amount = res.total;
      },
      error: (err) => console.log(err)
    });

    // BARANG MASUK
    this.api.getMonthlyBrgMasuk().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[1].amount = res.total;
      },
      error: (err) => console.log(err)
    });

    // BARANG KELUAR
    this.api.getMonthlyBrgKeluar().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[2].amount = res.total;
      },
      error: (err) => console.log(err)
    });

    // PESANAN MENUNGGU
    this.api.getWait().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[3].amount = res.total;
      },
      error: (err) => console.log(err)
    });

    this.api.getActivity().subscribe({
      next: (res: any) => {
        this.activity = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }
  loadInvoice() {
    this.api.getInvoiceRecent().subscribe({
      next: (res: any) => {
        this.invoice = Array.isArray(res) ? res : (res?.val ?? []);
      },
      error: (err) => console.log(err)
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'menunggu':
        return 'bg-warning';

      case 'disetujui':
        return 'bg-primary';

      case 'selesai':
        return 'bg-success';

      case 'ditolak':
        return 'bg-danger';

      default:
        return 'bg-secondary';
    }
  }

  getActivityBackground(activity: string): string {
    switch (activity) {
      case 'Barang Masuk':
        return 'text-success bg-light-success';

      case 'Barang Keluar':
        return 'text-primary bg-light-primary';

      case 'Retur':
        return 'text-danger bg-light-danger';

      default:
        return 'text-secondary bg-light-secondary';
    }
  }

  getActivityIcon(activity: string): string {
    switch (activity) {
      case 'Barang Masuk':
        return 'arrow-down';

      case 'Barang Keluar':
        return 'arrow-up';

      case 'Retur':
        return 'close';

      default:
        return 'infocircle';
    }
  }

  getActivityAmount(activity: string): string {
    switch (activity) {
      case 'Barang Masuk':
        return '-';

      case 'Barang Keluar':
        return '+';

      case 'Retur':
        return '!';

      default:
        return '';
    }
  }
}
