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

const BaseFeeChart: React.FC = () => {
  // --- State Variables with Types ---
  const [chartData, setChartData] = useState<LineChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blockCount] = useState<number>(10); // Number of blocks

  // --- Data Fetching Effect ---
  useEffect(() => {
    // Check if provider was successfully initialized
    if (!provider) {
        setError("Alchemy provider could not be initialized. Check API Key.");
        setLoading(false);
        return; // Stop execution if provider isn't available
    }

    const fetchBaseFeeHistory = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        console.log(`Workspaceing base fee history for the last ${blockCount} blocks...`);

        // Type assertion: Assume the response matches our interface
        // Alternatively, use a type guard for safer parsing
        const feeHistory = await provider.send('eth_feeHistory', [
          ethers.toBeHex(blockCount), // blockCount as hex string
          'latest',                  // newestBlock tag
          [],                        // rewardPercentiles (empty array)
        ]) as FeeHistoryResponse; // Assert the expected type

        console.log("Fee History Response:", feeHistory);

        // Basic validation of the response structure
        if (!feeHistory || !feeHistory.baseFeePerGas || !Array.isArray(feeHistory.baseFeePerGas) || feeHistory.baseFeePerGas.length === 0) {
            throw new Error("Invalid or empty fee history data received from Alchemy.");
        }

        // --- Process Data ---
        const oldestBlockNumber = parseInt(feeHistory.oldestBlock, 16); // Convert hex string to number
        const labels: string[] = [];
        const dataPoints: number[] = [];

        feeHistory.baseFeePerGas.forEach((feeHex, index) => {
          // Skip the fee for the block *after* the requested range
          if (index < blockCount) {
            const blockNumber = oldestBlockNumber + index;
            try {
                const feeWei = BigInt(feeHex); // Use BigInt for Wei values
                const feeGweiString = ethers.formatUnits(feeWei, 'gwei'); // Convert to Gwei string
                const feeGwei = parseFloat(feeGweiString); // Convert Gwei string to number for chart

                labels.push(blockNumber.toString());
                dataPoints.push(feeGwei);
            } catch (conversionError) {
                console.error(`Error converting fee ${feeHex} at index ${index}:`, conversionError);
                // Handle problematic data point - e.g., skip or push a default value like 0 or NaN
                // labels.push(blockNumber.toString());
                // dataPoints.push(NaN); // Or some other indicator
            }
          }
        });

        // Update state with formatted chart data
        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Base Fee per Gas (Gwei)',
              data: dataPoints,
              borderColor: 'rgb(53, 162, 235)', // Different color example
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              tension: 0.1,
              pointRadius: 2,
            },
          ],
        });

      } catch (err: unknown) { // Catch block error type is 'unknown'
        console.error("Error fetching base fee history:", err);
        // Type guard to check if it's an Error object
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching data.');
        }
      } finally {
        setLoading(false); // Ensure loading is set to false in all cases
      }
    };

    fetchBaseFeeHistory();
    // Disable exhaustive-deps linting rule for this line if blockCount is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockCount]); // Dependency array

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
  const options: ChartOptions<'line'> = { // Use ChartOptions type
    responsive: true,
    maintainAspectRatio: true, // Adjust as needed
    plugins: {
      legend: {
        position: 'top' as const, // Use 'as const' for literal types
      },
      title: {
        display: true,
        text: `Ethereum Base Fee per Gas (Last ${blockCount} Blocks)`,
      },
       tooltip: {
         callbacks: {
            label: (context: TooltipItem<'line'>): string => { // Type the context
               let label = context.dataset.label || '';
               if (label) {
                  label += ': ';
               }
               if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(4) + ' Gwei'; // Format Gwei value
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
            beginAtZero: false // Sensible default for fee charts
        }
    }
  };

  // --- Render Chart ---
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto', border: '1px solid #eee' }}>
      <h2 style={{ textAlign: 'center' }}>Base Fee Chart</h2>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default BaseFeeChart;