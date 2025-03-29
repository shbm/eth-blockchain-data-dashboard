// src/components/BlockGasChart.tsx
import React, { useState, useEffect, useMemo } from 'react';
// Removed ethers import as direct provider interaction is gone
import { Line } from 'react-chartjs-2';
import {
  ChartData,
  ChartOptions,
  TooltipItem,
  // Assume ChartJS elements like scales, LineElement etc. are registered globally
} from 'chart.js';
import { useBlockGasData } from '../hooks/useBlockGasData'; // Import the custom hook

// Type Definitions (can be simplified if hook exports chart-ready data, but keeping separate for now)
type GasLineChartData = ChartData<'line', number[], string>;
const BLOCKS_TO_DISPLAY = 10;

const BlockGasChart: React.FC = () => {
  // --- Use the custom hook ---
  const { data: blockData, loading, error, startBlock, endBlock } = useBlockGasData(BLOCKS_TO_DISPLAY);

  // --- State for Chart.js specific data structure ---
  const [chartData, setChartData] = useState<GasLineChartData | null>(null);

  // --- Effect to process data from hook into chart format ---
  useEffect(() => {
    if (blockData && blockData.length > 0) {
      const labels: string[] = [];
      const gasUsedData: number[] = [];
      const gasLimitData: number[] = [];

      blockData.forEach(block => {
        labels.push(block.number.toString());
        gasUsedData.push(Number(block.gasUsed));
        gasLimitData.push(Number(block.gasLimit));
      });

      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Gas Used',
            data: gasUsedData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            yAxisID: 'y',
            tension: 0.1,
          },
          {
            label: 'Gas Limit',
            data: gasLimitData,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            yAxisID: 'y1',
            tension: 0.1,
          },
        ],
      });
    } else {
        setChartData(null); // Clear chart if no data from hook
    }
  }, [blockData]); // Re-run processing when blockData from hook changes


  // --- Chart Options --- (Use useMemo for performance if options are complex/depend on state)
  const options: ChartOptions<'line'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { position: 'top' as const },
            title: {
                display: true,
                text: `Block Gas Usage vs Limit (${startBlock !== null && endBlock !== null ? `Blocks ${startBlock} to ${endBlock}` : `Last ${BLOCKS_TO_DISPLAY} Blocks`})`,
            },
            tooltip: { /* Tooltip callback remains the same */
                callbacks: {
                    label: (context: TooltipItem<'line'>): string => {
                       let label = context.dataset.label || '';
                       if (label) label += ': ';
                       if (context.parsed.y !== null) label += context.parsed.y.toLocaleString();
                       return label;
                    }
                 }
            }
        },
        scales: { /* Scales definition remains the same with y and y1 */
            x: { title: { display: true, text: 'Block Number' } },
            y: {
                type: 'linear' as const, display: true, position: 'left' as const,
                title: { display: true, text: 'Gas Used', color: 'rgb(255, 99, 132)'},
                beginAtZero: false, ticks: { color: 'rgb(255, 99, 132)', callback: function(value) { /* Formatter */ if (typeof value === 'number') { if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M'; if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k'; return value.toLocaleString(); } return value; } }
            },
            y1: {
                type: 'linear' as const, display: true, position: 'right' as const,
                title: { display: true, text: 'Gas Limit', color: 'rgb(53, 162, 235)' },
                beginAtZero: false, ticks: { color: 'rgb(53, 162, 235)', callback: function(value) { /* Formatter */ if (typeof value === 'number') { if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M'; return value.toLocaleString(); } return value; } },
                grid: { drawOnChartArea: false },
            },
        },
  }), [startBlock, endBlock]); // Recalculate options only if block range changes


  // --- Render Logic --- (Uses loading/error from hook)
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '30px auto', border: '1px solid #eee' }}>
      <h2 style={{ textAlign: 'center' }}>Block Gas Usage</h2>
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Block Gas Data...</div>}
      {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginTop: '10px' }}>Error: {error}</div>}
      {!loading && !error && !chartData && <div style={{ padding: '20px', textAlign: 'center' }}>No block gas data available.</div>}
      {chartData && (
          <Line options={options} data={chartData} />
      )}
    </div>
  );
};

export default BlockGasChart;