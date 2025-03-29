// Import necessary components from ethers v6+
import { ethers, Log, Interface, LogDescription } from "ethers";

// --- Configuration ---
// IMPORTANT: Replace with your actual Alchemy RPC URL containing your API key

const ALCHEMY_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/SaPOUALvqdzgN_e8i300eXfszDP4cHsu`;

// USDC Configuration (Example for Ethereum Mainnet)
const USDC_CONTRACT_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_DECIMALS = 6;

// --- ABI and Interface ---
// Minimal ABI fragment containing only the Transfer event is sufficient
const erc20Abi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Create an ethers Interface instance to help parse logs
const usdcInterface = new Interface(erc20Abi);

// You can also get the topic hash directly from the interface if needed:
// const TRANSFER_EVENT_TOPIC = usdcInterface.getEvent("Transfer")?.topicHash;
// console.log("Transfer Event Topic Hash:", TRANSFER_EVENT_TOPIC);
// Or use the known hash:
const TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// -----------------------


async function getLatestBlockUsdcVolumeEthers(): Promise<string | null> {
    try {
        // 1. Initialize Provider using Alchemy RPC URL
        // JsonRpcProvider is the standard way to connect to any JSON-RPC endpoint
        const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);

        // Optional: Verify connection (can throw an error if URL is invalid)
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

        // 2. Get the latest block number
        const latestBlockNum = await provider.getBlockNumber();
        console.log(`Workspaceing logs for latest block: ${latestBlockNum}`);

        // 3. Define the filter for getLogs
        // Find all logs matching the Transfer event signature from the USDC contract
        // within the specified block range (only the latest block here).
        const filter = {
            address: USDC_CONTRACT_ADDRESS,
            topics: [TRANSFER_EVENT_TOPIC], // Filter by event signature
            fromBlock: latestBlockNum,
            toBlock: latestBlockNum,
        };

        // 4. Fetch logs from the provider
        const logs: Log[] = await provider.getLogs(filter);
        console.log(`Found ${logs.length} USDC transfer logs in block ${latestBlockNum}.`);

        // 5. Parse logs and sum amounts using BigInt
        let totalVolumeSmallestUnit = 0n; // Use native BigInt (0n) for summation

        for (const log of logs) {
            try {
                // Use the interface to parse the log data and topics
                const parsedLog: LogDescription | null = usdcInterface.parseLog({
                    topics: log.topics as string[], // Type assertion needed by ethers v6
                    data: log.data
                });

                // Check if parsing was successful and it's the correct event
                if (parsedLog && parsedLog.name === "Transfer") {
                    // Access the 'value' argument defined in the ABI
                    // In ethers v6, this will be a native BigInt
                    const amount: bigint = parsedLog.args.value;
                    totalVolumeSmallestUnit += amount;
                } else {
                     // This might happen if the log matches the topic but has unexpected data/topics structure
                     console.warn(`Log topic matched but could not be parsed as Transfer event:`, log);
                }
            } catch (parseError) {
                // Catch errors during individual log parsing
                console.warn(`Error parsing log data/topics:`, log, parseError);
            }
        }

        // 6. Format the total amount using the token's decimals
        // ethers.formatUnits converts a BigInt value from smallest units to a decimal string
        const totalVolumeUsdc = ethers.formatUnits(totalVolumeSmallestUnit, USDC_DECIMALS);

        console.log(`\nTotal USDC transfer volume in block ${latestBlockNum}: ${totalVolumeUsdc} USDC`);

        return totalVolumeUsdc; // Return the formatted string representation

    } catch (error) {
        console.error("An error occurred during the process:", error);
        return null; // Indicate failure
    }
}

// --- Run the async function ---
(async () => {
    console.log("Starting calculation using ethers.js and Alchemy provider...");
    const startTime = Date.now();
    const volume = await getLatestBlockUsdcVolumeEthers();
    const endTime = Date.now();

    if (volume !== null) {
        console.log(`Calculation finished successfully in ${endTime - startTime}ms.`);
    } else {
        console.log(`Calculation failed after ${endTime - startTime}ms.`);
    }
})();