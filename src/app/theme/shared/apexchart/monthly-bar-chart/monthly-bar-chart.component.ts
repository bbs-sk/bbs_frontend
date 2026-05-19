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
            height: 450,
            type: 'area',
            toolbar: {
              show: false
            }
          },

          series: [
            {
              name: 'Total Penjualan',
              data: totals
            }
          ],

          colors: ['#1677ff'],

          dataLabels: {
            enabled: false
          },

          stroke: {
            curve: 'smooth',
            width: 3
          },

          xaxis: {
            categories: categories,
            axisBorder: {
              show: true,
              color: '#f0f0f0'
            }
          },

          yaxis: {
            labels: {
              formatter: function (value) {
                return 'Rp ' + value.toLocaleString('id-ID');
              }
            }
          },

          tooltip: {
            y: {
              formatter: function (value) {
                return 'Rp ' + value.toLocaleString('id-ID');
              }
            }
          },

          grid: {
            borderColor: '#f5f5f5'
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
