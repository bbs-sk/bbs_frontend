// angular import
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import tableData from 'src/fake-data/default-data.json';
import { MonthlyBarChartComponent } from 'src/app/theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';

// icons
import { IconService } from '@ant-design/icons-angular';
import { FallOutline, ArrowDownOutline, ArrowUpOutline, CloseOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule, MonthlyBarChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private iconService = inject(IconService);

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {
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
    this.api.getTotalBarang().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[0].amount = res.total;
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });

    this.api.getMonthlyBrgMasuk().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[1].amount = res.total;
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });

    this.api.getMonthlyBrgKeluar().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[2].amount = res.total;
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });

    this.api.getWait().subscribe({
      next: (res: any) => {
        this.AnalyticEcommerce[3].amount = res.total;
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });

    this.api.getActivity().subscribe({
      next: (res: any) => {
        this.activity = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => console.log(err)
    });
  }

  loadInvoice() {
    this.api.getInvoiceRecent().subscribe({
      next: (res: any) => {
        this.invoice = Array.isArray(res) ? res : (res?.val ?? []);
        this.cdr.detectChanges();
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

  getCardColor(index: number): string {
    return ['blue', 'teal', 'coral', 'amber'][index] ?? 'blue';
  }

  getCardIcon(index: number): string {
    return ['inventory_2', 'south', 'north', 'pending_actions'][index] ?? 'dashboard';
  }

  getActivityIcon(activity: string): string {
    switch (activity) {
      case 'Barang Masuk':
        return 'south';
      case 'Barang Keluar':
        return 'north';
      case 'Retur':
        return 'refresh';
      default:
        return 'info';
    }
  }

  getActivityClass(activity: string): string {
    switch (activity) {
      case 'Barang Masuk':
        return 'masuk';
      case 'Barang Keluar':
        return 'keluar';
      case 'Retur':
        return 'retur';
      default:
        return 'default';
    }
  }

  formatRupiah(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return 'Rp ' + Number(value).toLocaleString('id-ID');
  }

  getStatusClass(status: string): string {
    const s = status?.toLowerCase()?.trim();

    const map: Record<string, string> = {
      menunggu: 'warning',
      pending: 'warning',
      disetujui: 'info',
      dikirim: 'success',
      delivery: 'success',
      selesai: 'success',
      ditolak: 'danger'
    };

    return map[s] ?? 'default';
  }
}
