// src/components/Erc20VolumeChart.tsx
import React, { useState, useCallback } from 'react';
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

// --- Register Chart.js components (including BarElement) ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement, // Register BarElement
  Title,
  Tooltip,
  Legend
);

// --- Environment Variable & Provider Setup (same as BaseFeeChart) ---
const ALCHEMY_API_KEY = "SaPOUALvqdzgN_e8i300eXfszDP4cHsu";
const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const provider = ALCHEMY_API_KEY ? new ethers.JsonRpcProvider(ALCHEMY_URL) : null;

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

const Erc20VolumeChart: React.FC = () => {
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
    if (!provider) {
      setError("Alchemy provider not initialized. Check API Key.");
      return;
    }
    if (!ethers.isAddress(address)) {
      setError("Invalid Ethereum address provided.");
      return;
    }

    setLoading(true);
    setError(null);
    setChartData(null); // Clear previous chart
    setTokenDecimals(null);
    setTokenSymbol(null);
    setLastBlockChecked(null);

    try {
      // 1. Get Token Info (Decimals, Symbol)
      let decimals: number;
      let symbol: string;
      try {
        const contract = new ethers.Contract(address, erc20Abi, provider);
        // Use Promise.all for concurrent fetching
        [decimals, symbol] = await Promise.all([
          contract.decimals().then(d => Number(d)), // Convert BigInt/number result to number
          contract.symbol()
        ]);
        setTokenDecimals(decimals);
        setTokenSymbol(symbol);
      } catch (contractError: any) {
        console.error("Error fetching token details:", contractError);
        throw new Error(`Failed to fetch details for token ${address}. Is it a valid ERC20 contract? (${contractError.message})`);
      }

      // 2. Get Block Range
      const latestBlockNumber = await provider.getBlockNumber();
      setLastBlockChecked(latestBlockNumber);
      const fromBlock = latestBlockNumber - BLOCKS_TO_CHECK + 1; // Inclusive range

      // 3. Fetch Transfer Logs using eth_getLogs
      console.log(`Workspaceing 'Transfer' logs for ${symbol} (${address}) from block ${fromBlock} to ${latestBlockNumber}`);
      const logs: TransferLog[] = await provider.send('eth_getLogs', [{
        fromBlock: ethers.toBeHex(fromBlock),
        toBlock: ethers.toBeHex(latestBlockNumber),
        address: address, // Filter by token contract address
        topics: [TRANSFER_EVENT_SIGNATURE] // Filter by Transfer event signature
      }]);

      console.log(`Found ${logs.length} Transfer logs.`);

      // 4. Process Logs and Aggregate Volume per Block
      const volumePerBlock = new Map<number, bigint>(); // Use Map<blockNumber, totalVolumeBigInt>
      for (let i = 0; i < BLOCKS_TO_CHECK; i++) {
         volumePerBlock.set(fromBlock + i, 0n); // Initialize volume for all blocks in range
      }

      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      logs.forEach(log => {
        try {
          // Convert hex block number to decimal
          const blockNumber = typeof log.blockNumber === 'string' ? 
            parseInt(log.blockNumber, 16) : 
            log.blockNumber;
          
          const decodedData = abiCoder.decode(['uint256'], log.data);
          const value = decodedData[0] as bigint;

          const currentVolume = volumePerBlock.get(blockNumber) ?? 0n;
          console.log("volumePerBlock");
          volumePerBlock.set(blockNumber, currentVolume + value);
        } catch (decodeError) {
          console.warn(`Failed to decode log data at block ${log.blockNumber}:`, log.data, decodeError);
          // Decide how to handle: skip log, set error state, etc.
        }
      });

      // 5. Format Data for Chart.js
      const labels: string[] = [];
      const dataPoints: number[] = [];
      console.log(volumePerBlock);
      volumePerBlock.forEach((volumeWei, blockNumber) => {
         labels.push(blockNumber.toString());
         // Convert BigInt volume (in wei-like units) to number using decimals for display
         const volumeFormatted = parseFloat(ethers.formatUnits(volumeWei, decimals));
         dataPoints.push(volumeFormatted);
      });
      console.log(labels);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: `Volume (${symbol})`,
            data: dataPoints,
            backgroundColor: 'rgba(255, 99, 132, 0.6)', // Example color
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      });

    } catch (err: unknown) {
      console.error("Error fetching ERC20 volume:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching volume data.');
      }
      // Clear potentially partial data on error
      setChartData(null);
      setTokenDecimals(null);
      setTokenSymbol(null);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback dependency array is empty as provider is stable

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
        <button onClick={handleFetchClick} disabled={loading || !tokenAddress || !provider}>
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