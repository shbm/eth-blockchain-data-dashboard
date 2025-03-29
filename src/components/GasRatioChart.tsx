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

interface GasRatioChartProps {
  latestBlockNumber: number | null;
}

const GasRatioChart: React.FC<GasRatioChartProps> = ({ latestBlockNumber }) => {
  // --- Use the custom hook ---
  const { data: blockData, loading, error, startBlock, endBlock } = useBlockGasData(BLOCKS_TO_DISPLAY, latestBlockNumber);

  // --- State for Chart.js specific data structure ---
  const [chartData, setChartData] = useState<RatioLineChartData | null>(null);

  // --- Effect to calculate ratio and format chart data ---
  useEffect(() => {
    if (!blockData || blockData.length === 0) {
      setChartData(null);
      return;
    }

    // If we don't have chart data yet, initialize it
    if (!chartData) {
      const labels: string[] = [];
      const ratioData: number[] = [];

      blockData.forEach(block => {
        labels.push(block.number.toString());
        const gasUsedNum = Number(block.gasUsed);
        const gasLimitNum = Number(block.gasLimit);
        let ratioPercent = 0;
        if (gasLimitNum > 0) {
          ratioPercent = parseFloat(((gasUsedNum / gasLimitNum) * 100).toFixed(2));
        }
        ratioData.push(ratioPercent);
      });

      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Gas Usage (%)',
            data: ratioData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            fill: true,
            tension: 0.1,
            pointRadius: 2,
          },
        ],
      });
      return;
    }

    // For incremental updates, only update the last data point
    const lastBlock = blockData[blockData.length - 1];
    const lastBlockNumber = lastBlock.number;
    
    // Check if this is a new block we haven't processed yet
    if (!chartData.labels || lastBlockNumber.toString() !== chartData.labels[chartData.labels.length - 1]) {
      const gasUsedNum = Number(lastBlock.gasUsed);
      const gasLimitNum = Number(lastBlock.gasLimit);
      let ratioPercent = 0;
      if (gasLimitNum > 0) {
        ratioPercent = parseFloat(((gasUsedNum / gasLimitNum) * 100).toFixed(2));
      }

      setChartData(prevData => {
        if (!prevData || !prevData.labels) return prevData;
        return {
          ...prevData,
          labels: [...prevData.labels.slice(1), lastBlockNumber.toString()],
          datasets: prevData.datasets.map(dataset => ({
            ...dataset,
            data: [...dataset.data.slice(1), ratioPercent]
          }))
        };
      });
    }
  }, [blockData]);

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