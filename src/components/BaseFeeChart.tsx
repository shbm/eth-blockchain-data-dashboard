// src/components/BaseFeeChart.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData, // Import ChartData type
  ChartOptions, // Import ChartOptions type
  TooltipItem // Import TooltipItem type
} from 'chart.js';

// --- Register Chart.js components ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Environment Variable Access (Type Safe) ---
// Vite (Recommended)
// Create React App
// Choose the one that's defined based on your build tool
const ALCHEMY_API_KEY = "SaPOUALvqdzgN_e8i300eXfszDP4cHsu";


if (!ALCHEMY_API_KEY) {
    console.warn("Alchemy API Key not found in environment variables (.env). Please ensure VITE_ALCHEMY_API_KEY (for Vite) or REACT_APP_ALCHEMY_API_KEY (for CRA) is set.");
}

const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Initialize provider only if API key exists
const provider = ALCHEMY_API_KEY ? new ethers.JsonRpcProvider(ALCHEMY_URL) : null;

// --- Type Definitions ---
// Define an interface for the expected structure from eth_feeHistory
interface FeeHistoryResponse {
    oldestBlock: string; // Hex block number
    baseFeePerGas: string[]; // Array of hex Wei values
    // Add other fields if needed, e.g., gasUsedRatio, reward
}

// Define the structure for our chart data state
type LineChartData = ChartData<'line', number[], string>;

interface BaseFeeChartProps {
  latestBlockNumber: number | null;
}

const BaseFeeChart: React.FC<BaseFeeChartProps> = ({ latestBlockNumber }) => {
  // --- State Variables with Types ---
  const [chartData, setChartData] = useState<LineChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blockCount] = useState<number>(10); // Number of blocks
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // --- Data Fetching Effect ---
  useEffect(() => {
    // Check if provider was successfully initialized
    if (!provider) {
        setError("Alchemy provider could not be initialized. Check API Key.");
        setLoading(false);
        return;
    }

    const fetchBaseFeeHistory = async () => {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      try {
        const feeHistory = await provider.send('eth_feeHistory', [
          ethers.toBeHex(blockCount),
          'latest',
          [],
        ]) as FeeHistoryResponse;

        if (!feeHistory || !feeHistory.baseFeePerGas || !Array.isArray(feeHistory.baseFeePerGas) || feeHistory.baseFeePerGas.length === 0) {
            throw new Error("Invalid or empty fee history data received from Alchemy.");
        }

        const oldestBlockNumber = parseInt(feeHistory.oldestBlock, 16);
        const labels: string[] = [];
        const dataPoints: number[] = [];

        feeHistory.baseFeePerGas.forEach((feeHex, index) => {
          if (index < blockCount) {
            const blockNumber = oldestBlockNumber + index;
            try {
                const feeWei = BigInt(feeHex);
                const feeGweiString = ethers.formatUnits(feeWei, 'gwei');
                const feeGwei = parseFloat(feeGweiString);

                labels.push(blockNumber.toString());
                dataPoints.push(feeGwei);
            } catch (conversionError) {
                console.error(`Error converting fee ${feeHex} at index ${index}:`, conversionError);
            }
          }
        });

        // If we don't have chart data yet, initialize it
        if (!chartData) {
          setChartData({
            labels: labels,
            datasets: [
              {
                label: 'Base Fee per Gas (Gwei)',
                data: dataPoints,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.1,
                pointRadius: 2,
              },
            ],
          });
        } else {
          // For incremental updates, only update the last data point
          const lastBlockNumber = oldestBlockNumber + blockCount - 1;
          if (!chartData.labels || lastBlockNumber.toString() !== chartData.labels[chartData.labels.length - 1]) {
            const lastFeeHex = feeHistory.baseFeePerGas[blockCount - 1];
            const feeWei = BigInt(lastFeeHex);
            const feeGweiString = ethers.formatUnits(feeWei, 'gwei');
            const feeGwei = parseFloat(feeGweiString);

            setChartData(prevData => {
              if (!prevData || !prevData.labels) return prevData;
              return {
                ...prevData,
                labels: [...prevData.labels.slice(1), lastBlockNumber.toString()],
                datasets: prevData.datasets.map(dataset => ({
                  ...dataset,
                  data: [...dataset.data.slice(1), feeGwei]
                }))
              };
            });
          }
        }

      } catch (err: unknown) {
        console.error("Error fetching base fee history:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching data.');
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchBaseFeeHistory();
  }, [blockCount, latestBlockNumber, isInitialLoad]);

  // --- Render Logic ---
  if (error) {
    return <div style={{ color: 'red', padding: '20px', border: '1px solid red' }}>Error: {error}</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading Base Fee Data...</div>;
  }

  if (!chartData || chartData.datasets[0].data.length === 0) {
    return <div style={{ padding: '20px' }}>No data available or failed to process data points.</div>;
  }

  // --- Typed Chart Options ---
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Ethereum Base Fee per Gas (Last ${blockCount} Blocks)`,
      },
       tooltip: {
         callbacks: {
            label: (context: TooltipItem<'line'>): string => {
               let label = context.dataset.label || '';
               if (label) {
                  label += ': ';
               }
               if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(4) + ' Gwei';
               }
               return label;
            }
         }
      }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Block Number'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Base Fee (Gwei)'
            },
            beginAtZero: false
        }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto', border: '1px solid #eee' }}>
      <h2 style={{ textAlign: 'center' }}>Base Fee Chart</h2>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default BaseFeeChart;