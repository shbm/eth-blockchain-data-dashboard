import { ChartOptions, TooltipItem } from 'chart.js';

export const createChartOptions = <T extends 'line' | 'bar'>(
  title: string,
  xAxisLabel: string,
  yAxisLabel: string,
  tooltipFormatter?: (context: TooltipItem<T>) => string
): ChartOptions<T> => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'top' as const },
    title: {
      display: true,
      text: title,
    },
    tooltip: {
      callbacks: {
        label: tooltipFormatter || ((context: TooltipItem<T>): string => {
          const dataset = context.dataset as { label?: string };
          let label = dataset.label || '';
          if (label) label += ': ';
          const value = context.parsed as { y: number };
          if (value.y !== null) {
            label += value.y.toLocaleString();
          }
          return label;
        })
      }
    }
  },
  scales: {
    x: {
      title: { display: true, text: xAxisLabel }
    },
    y: {
      title: { display: true, text: yAxisLabel },
      beginAtZero: true
    }
  }
} as unknown as ChartOptions<T>); 