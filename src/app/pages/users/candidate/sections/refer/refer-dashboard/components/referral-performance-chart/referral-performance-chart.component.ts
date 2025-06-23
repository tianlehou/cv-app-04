import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ReferralService } from '../../../referral.service';

@Component({
  selector: 'app-referral-performance-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './referral-performance-chart.component.html',
  styleUrls: ['./referral-performance-chart.component.css']
})
export class ReferralPerformanceChartComponent implements OnInit {
  @Input() referrals: any[] = [];

  // Opciones del gráfico
  view: [number, number] = [700, 300];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Meses';
  showYAxisLabel = true;
  yAxisLabel = 'Referidos';
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C']
  };

  // Datos para el gráfico
  chartData: any[] = [];

  constructor(private referralService: ReferralService) {}

  ngOnInit() {
    this.prepareChartData();
  }

  prepareChartData() {
    // Agrupar referidos por mes
    const monthlyData = this.referrals.reduce((acc, referral) => {
      const date = new Date(referral.timestamp);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = { converted: 0, total: 0 };
      }
      
      acc[monthYear].total++;
      if (referral.converted === 'Sí') {
        acc[monthYear].converted++;
      }
      
      return acc;
    }, {});

    // Preparar datos para el gráfico
    this.chartData = Object.keys(monthlyData).map(month => {
      return {
        name: month,
        series: [
          {
            name: 'Referidos',
            value: monthlyData[month].total
          },
          {
            name: 'Conversiones',
            value: monthlyData[month].converted
          }
        ]
      };
    });

    // Ordenar por fecha
    this.chartData.sort((a, b) => {
      const [aMonth, aYear] = a.name.split('/').map(Number);
      const [bMonth, bYear] = b.name.split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    });
  }

  onSelect(event: any) {
    console.log('Item seleccionado', event);
  }
}