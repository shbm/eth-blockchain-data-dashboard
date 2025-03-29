// src/components/GasRatioChart.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  ChartData,
  ChartOptions,
  TooltipItem,
  // Assume ChartJS elements are registered globally
} from 'chart.js';
import { useBlockGasData } from '../hooks/useBlockGasData'; // Import the custom hook

// Type Definitions
type RatioLineChartData = ChartData<'line', number[], string>;
const BLOCKS_TO_DISPLAY = 10;

const GasRatioChart: React.FC = () => {
  // --- Use the custom hook ---
  // Note: This triggers a separate fetch if rendered concurrently with BlockGasChart
  // For true shared fetching, Lift State Up or use Context/Recoil/Zustand might be needed
  // But for this example, the hook provides good code reuse.
  const { data: blockData, loading, error, startBlock, endBlock } = useBlockGasData(BLOCKS_TO_DISPLAY);

  // --- State for Chart.js specific data structure ---
  const [chartData, setChartData] = useState<RatioLineChartData | null>(null);

  // --- Effect to calculate ratio and format chart data ---
  useEffect(() => {
    if (blockData && blockData.length > 0) {
      const labels: string[] = [];
      const ratioData: number[] = [];

      blockData.forEach(block => {
        labels.push(block.number.toString());

        // Calculate ratio: (gasUsed / gasLimit) * 100
        // Convert BigInt to Number for floating-point division
        const gasUsedNum = Number(block.gasUsed);
        const gasLimitNum = Number(block.gasLimit);

        let ratioPercent = 0; // Default to 0 if limit is 0
        if (gasLimitNum > 0) {
          // Calculate percentage and handle potential NaN (though unlikely with check)
          ratioPercent = parseFloat(((gasUsedNum / gasLimitNum) * 100).toFixed(2)); // Keep 2 decimal places
        } else {
            console.warn(`Block ${block.number} has gasLimit 0.`);
        }

        ratioData.push(ratioPercent);
      });

      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Gas Usage (%)',
            data: ratioData,
            borderColor: 'rgb(75, 192, 192)', // Teal color
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            fill: true, // Optional: Fill area under line
            tension: 0.1,
            pointRadius: 2,
          },
        ],
      });
    } else {
        setChartData(null); // Clear chart if no data
    }
  }, [blockData]); // Re-run calculation when blockData changes

  // --- Chart Options ---
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `Block Gas Utilization (${startBlock !== null && endBlock !== null ? `Blocks ${startBlock} to ${endBlock}` : `Last ${BLOCKS_TO_DISPLAY} Blocks`})`,
      },
      tooltip: {
        callbacks: {
            label: (context: TooltipItem<'line'>): string => {
               let label = context.dataset.label || '';
               if (label) label += ': ';
               // Add '%' sign to tooltip value
               if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + '%';
               return label;
            }
         }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Block Number' }
      },
      y: { // Primary Y-axis (Percentage)
        title: { display: true, text: 'Gas Usage (%)' },
        min: 0,   // Set minimum value for Y-axis
        max: 100, // Set maximum value for Y-axis
        ticks: {
            // Optional: Add '%' sign to axis ticks
            callback: function(value) {
                return value + '%';
            }
        }
      },
    },
  }), [startBlock, endBlock]);


  // --- Render Logic ---
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '30px auto', border: '1px solid #eee' }}>
      <h2 style={{ textAlign: 'center' }}>Block Gas Utilization (%)</h2>
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Block Data...</div>}
      {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginTop: '10px' }}>Error: {error}</div>}
      {!loading && !error && !chartData && <div style={{ padding: '20px', textAlign: 'center' }}>No gas ratio data available.</div>}
      {chartData && (
          <Line options={options} data={chartData} />
      )}
    </div>
  );
};

export default GasRatioChart;