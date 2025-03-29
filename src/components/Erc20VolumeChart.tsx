// src/components/Erc20VolumeChart.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement, // Import BarElement for Bar chart
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { erc20Abi, TRANSFER_EVENT_SIGNATURE } from '../config/erc20Abi'; // Adjust path if needed
import { httpProvider } from '../config/provider';

// --- Register Chart.js components (including BarElement) ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement, // Register BarElement
  Title,
  Tooltip,
  Legend
);

// --- Type Definitions ---
interface TransferLog {
    blockNumber: number;
    data: string; // The amount (uint256) as hex string
    // topics: string[]; // includes from, to addresses if needed
}
type BarChartData = ChartData<'bar', number[], string>;

// Default example token (e.g., USDC on Mainnet) - Replace if desired
const DEFAULT_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const BLOCKS_TO_CHECK = 10;

const Erc20VolumeChart: React.FC<{ latestBlockNumber: number | null }> = ({ latestBlockNumber }) => {
  // --- State ---
  const [tokenAddress, setTokenAddress] = useState<string>(DEFAULT_TOKEN_ADDRESS);
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [chartData, setChartData] = useState<BarChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBlockChecked, setLastBlockChecked] = useState<number | null>(null);

  // --- Data Fetching Function ---
  const fetchVolumeData = useCallback(async (address: string) => {
    if (!httpProvider) {
      setError("Alchemy provider not initialized. Check API Key.");
      return;
    }
    if (!ethers.isAddress(address)) {
      setError("Invalid Ethereum address provided.");
      return;
    }

    setLoading(true);
    setError(null);
    setTokenDecimals(null);
    setTokenSymbol(null);
    setLastBlockChecked(null);

    try {
      // 1. Get Token Info (Decimals, Symbol)
      let decimals: number;
      let symbol: string;
      try {
        const tokenContract = new ethers.Contract(address, erc20Abi, httpProvider);
        [decimals, symbol] = await Promise.all([
          tokenContract.decimals().then(d => Number(d)),
          tokenContract.symbol()
        ]);
        setTokenDecimals(decimals);
        setTokenSymbol(symbol);
      } catch (contractError: any) {
        console.error("Error fetching token details:", contractError);
        throw new Error(`Failed to fetch details for token ${address}. Is it a valid ERC20 contract? (${contractError.message})`);
      }

      // 2. Get Block Range
      const latestBlockNumber = await httpProvider.getBlockNumber();
      setLastBlockChecked(latestBlockNumber);
      const fromBlock = latestBlockNumber - BLOCKS_TO_CHECK + 1;

      // 3. Fetch Transfer Logs using eth_getLogs
      const logs: TransferLog[] = await httpProvider.send('eth_getLogs', [{
        fromBlock: ethers.toBeHex(fromBlock),
        toBlock: ethers.toBeHex(latestBlockNumber),
        address: address,
        topics: [TRANSFER_EVENT_SIGNATURE]
      }]);

      // 4. Process Logs and Aggregate Volume per Block
      const volumePerBlock = new Map<number, bigint>();
      for (let i = 0; i < BLOCKS_TO_CHECK; i++) {
         volumePerBlock.set(fromBlock + i, 0n);
      }

      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      logs.forEach(log => {
        try {
          const blockNumber = typeof log.blockNumber === 'string' ? 
            parseInt(log.blockNumber, 16) : 
            log.blockNumber;
          
          const decodedData = abiCoder.decode(['uint256'], log.data);
          const value = decodedData[0] as bigint;

          const currentVolume = volumePerBlock.get(blockNumber) ?? 0n;
          volumePerBlock.set(blockNumber, currentVolume + value);
        } catch (decodeError) {
          console.warn(`Failed to decode log data at block ${log.blockNumber}:`, log.data, decodeError);
        }
      });

      // 5. Format Data for Chart.js
      const labels: string[] = [];
      const dataPoints: number[] = [];
      volumePerBlock.forEach((volumeWei, blockNumber) => {
         labels.push(blockNumber.toString());
         const volumeFormatted = parseFloat(ethers.formatUnits(volumeWei, decimals));
         dataPoints.push(volumeFormatted);
      });

      // If we don't have chart data yet, initialize it
      if (!chartData) {
        setChartData({
          labels: labels,
          datasets: [
            {
              label: `Volume (${symbol})`,
              data: dataPoints,
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        });
      } else {
        // For incremental updates, only update the last data point
        const lastBlockNumber = latestBlockNumber;
        if (!chartData.labels || lastBlockNumber.toString() !== chartData.labels[chartData.labels.length - 1]) {
          const lastBlockVolume = volumePerBlock.get(lastBlockNumber) ?? 0n;
          const volumeFormatted = parseFloat(ethers.formatUnits(lastBlockVolume, decimals));

          setChartData(prevData => {
            if (!prevData || !prevData.labels) return prevData;
            return {
              ...prevData,
              labels: [...prevData.labels.slice(1), lastBlockNumber.toString()],
              datasets: prevData.datasets.map(dataset => ({
                ...dataset,
                data: [...dataset.data.slice(1), volumeFormatted]
              }))
            };
          });
        }
      }

    } catch (err: unknown) {
      console.error("Error fetching ERC20 volume:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching volume data.');
      }
      setChartData(null);
      setTokenDecimals(null);
      setTokenSymbol(null);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback dependency array is empty as provider is stable

  // Update useEffect to react to new blocks
  useEffect(() => {
    if (latestBlockNumber !== null) {
      fetchVolumeData(tokenAddress);
    }
  }, [latestBlockNumber, tokenAddress, fetchVolumeData]);

  // --- Event Handler ---
  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(event.target.value);
    // Optional: Clear error/chart when address changes before fetch
    // setError(null);
    // setChartData(null);
  };

  const handleFetchClick = () => {
     fetchVolumeData(tokenAddress);
  };

  // --- Render Logic ---
  // Typed Chart Options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `ERC20 Transfer Volume per Block (${tokenSymbol || 'Token'}) - Last ${BLOCKS_TO_CHECK} Blocks (Ending ${lastBlockChecked ?? 'N/A'})`,
      },
       tooltip: {
         callbacks: {
            label: (context: TooltipItem<'bar'>): string => {
               let label = context.dataset.label || '';
               if (label) {
                  label += ': ';
               }
               if (context.parsed.y !== null) {
                   // Format for potentially large numbers or add units
                   label += context.parsed.y.toLocaleString(undefined, { maximumFractionDigits: tokenDecimals ?? 2 });
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
                text: `Volume (${tokenSymbol || 'Units'})` // Use fetched symbol
            },
            beginAtZero: true // Volume starts at 0
        }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '30px auto', border: '1px solid #eee' }}>
      <h2 style={{ textAlign: 'center' }}>ERC20 Token Transfer Volume</h2>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="tokenAddressInput" style={{flexShrink: 0}}>Token Address:</label>
        <input
          id="tokenAddressInput"
          type="text"
          value={tokenAddress}
          onChange={handleAddressChange}
          placeholder="Enter ERC20 Token Address"
          style={{ flexGrow: 1, minWidth: '300px', padding: '8px' }}
          disabled={loading}
        />
        <button onClick={handleFetchClick} disabled={loading || !tokenAddress || !httpProvider}>
          {loading ? 'Fetching...' : 'Fetch Volume'}
        </button>
      </div>

       {/* Display Token Info */}
       {tokenSymbol && tokenDecimals !== null && (
         <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#555' }}>
             Tracking: {tokenSymbol} ({tokenDecimals} decimals)
         </div>
       )}

      {/* Display Loading / Error / Chart */}
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Volume Data...</div>}
      {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginTop: '10px' }}>Error: {error}</div>}
      {!loading && !error && !chartData && <div style={{ padding: '20px', textAlign: 'center' }}>Enter a token address and click fetch.</div>}
      {chartData && (
         <Bar options={options} data={chartData} />
      )}
    </div>
  );
};

export default Erc20VolumeChart;