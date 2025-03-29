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
import ChartWrapper from './ChartWrapper';
import { createChartOptions } from '../config/chartConfig';

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
  const options: ChartOptions<'line'> = useMemo(() => 
    createChartOptions<'line'>(
      `Block Gas Utilization (${startBlock !== null && endBlock !== null ? `Blocks ${startBlock} to ${endBlock}` : `Last ${BLOCKS_TO_DISPLAY} Blocks`})`,
      'Block Number',
      'Gas Usage (%)',
      (context: TooltipItem<'line'>): string => {
        let label = context.dataset.label || '';
        if (label) label += ': ';
        if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + '%';
        return label;
      }
    ),
    [startBlock, endBlock]
  );

  // --- Render Logic ---
  return (
    <ChartWrapper
      title="Block Gas Utilization (%)"
      loading={loading}
      error={error}
    >
      {chartData && <Line options={options} data={chartData} />}
    </ChartWrapper>
  );
};

export default GasRatioChart;