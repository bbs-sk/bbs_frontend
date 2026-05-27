import { Component, OnInit, inject, viewChild } from '@angular/core';

import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';

@Component({
  selector: 'app-monthly-bar-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './monthly-bar-chart.component.html',
  styleUrl: './monthly-bar-chart.component.scss'
})
export class MonthlyBarChartComponent implements OnInit {
  private api = inject(ApiService);

  chart = viewChild.required<ChartComponent>('chart');

  chartOptions!: Partial<ApexOptions>;

  ngOnInit(): void {
    this.loadChart();
  }

  loadChart() {
    this.api.getMonthly().subscribe({
      next: (res: any) => {
        const categories = res.map((item: any) => item.bulan);

        const totals = res.map((item: any) => Number(item.total));

        this.chartOptions = {
          chart: {
            height: 420,
            type: 'area',
            toolbar: { show: false },
            fontFamily: 'inherit',
            sparkline: { enabled: false }
          },
          series: [{ name: 'Total Penjualan', data: totals }],
          colors: ['#185FA5'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.35,
              opacityTo: 0.02,
              stops: [0, 90, 100]
            }
          },
          dataLabels: { enabled: false },
          stroke: {
            curve: 'smooth',
            width: 2.5
          },
          xaxis: {
            categories: categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
              style: {
                fontSize: '12px',
                colors: '#888'
              }
            }
          },
          yaxis: {
            labels: {
              style: { fontSize: '11px', colors: ['#aaa'] },
              formatter: (value: number) => 'Rp ' + Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)
            }
          },
          tooltip: {
            theme: 'light',
            y: {
              formatter: (value: number) => 'Rp ' + value.toLocaleString('id-ID')
            }
          },
          grid: {
            borderColor: 'rgba(0,0,0,0.05)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { left: 10, right: 10, bottom: 0 }
          },
          markers: {
            size: 4,
            colors: ['#fff'],
            strokeColors: '#185FA5',
            strokeWidth: 2,
            hover: { size: 6 }
          }
        };

        // PENTING
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 200);
      },

      error: (err) => {
        console.log(err);
      }
    });
  }
}
