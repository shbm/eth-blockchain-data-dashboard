// src/hooks/useBlockGasData.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// --- Environment Variable & Provider Setup ---
// It's often better practice to pass the provider into the hook or configure it centrally
// but for simplicity here, we repeat the setup. Consider refactoring provider setup later.
const ALCHEMY_API_KEY = "SaPOUALvqdzgN_e8i300eXfszDP4cHsu";
const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const provider = ALCHEMY_API_KEY ? new ethers.JsonRpcProvider(ALCHEMY_URL) : null;

// --- Type Definition for Hook Output ---
export interface BlockGasInfo {
    number: number;
    gasUsed: bigint;
    gasLimit: bigint;
    timestamp: number; // Add timestamp for potential future use
}

interface UseBlockGasDataReturn {
    data: BlockGasInfo[] | null;
    loading: boolean;
    error: string | null;
    startBlock: number | null;
    endBlock: number | null;
}

export const useBlockGasData = (blockCount: number): UseBlockGasDataReturn => {
  const [data, setData] = useState<BlockGasInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startBlock, setStartBlock] = useState<number | null>(null);
  const [endBlock, setEndBlock] = useState<number | null>(null);

  useEffect(() => {
    if (!provider) {
      setError("Alchemy provider not initialized. Check API Key.");
      setLoading(false);
      return;
    }
    if (blockCount <= 0) {
        setError("Block count must be greater than zero.");
        setLoading(false);
        return;
    }

    let isMounted = true; // Prevent state updates on unmounted component
    const fetchBlocks = async () => {
      setLoading(true);
      setError(null);
      setData(null); // Clear previous data
      setStartBlock(null);
      setEndBlock(null);

      try {
        const latestBlockNumber = await provider.getBlockNumber();
        const end = latestBlockNumber;
        const start = Math.max(0, end - blockCount + 1); // Ensure start isn't negative

        if (!isMounted) return; // Check before setting state
        setStartBlock(start);
        setEndBlock(end);

        const blockNumbersToFetch: number[] = [];
        for (let i = start; i <= end; i++) {
          blockNumbersToFetch.push(i);
        }
        console.log(`Hook fetching gas data for blocks: ${start} to ${end}`);

        const blockPromises = blockNumbersToFetch.map(blockNum =>
          provider.getBlock(blockNum, false) // Fetch header only
        );
        const resolvedBlocks = await Promise.all(blockPromises);
        const validBlocks = resolvedBlocks.filter(block => block !== null) as ethers.Block[];

        if (!isMounted) return; // Check again before final state updates

        if (validBlocks.length !== blockNumbersToFetch.length) {
             console.warn(`Hook expected ${blockNumbersToFetch.length} blocks, but received ${validBlocks.length}.`);
             if(validBlocks.length === 0) throw new Error("No valid block data received by hook.");
        }

        validBlocks.sort((a, b) => a.number - b.number);

        // Map to our specific BlockGasInfo structure
        const formattedData: BlockGasInfo[] = validBlocks.map(block => ({
            number: block.number,
            gasUsed: block.gasUsed,
            gasLimit: block.gasLimit,
            timestamp: block.timestamp
        }));

        setData(formattedData);

      } catch (err: unknown) {
        console.error("Hook error fetching block gas data:", err);
        if (isMounted) {
            if (err instanceof Error) setError(err.message);
            else setError('Hook: An unknown error occurred.');
            setData(null);
            setStartBlock(null);
            setEndBlock(null);
        }
      } finally {
         if (isMounted) setLoading(false);
      }
    };

    fetchBlocks();

    // Cleanup function
    return () => {
        isMounted = false;
    };
  }, [blockCount]); // Re-run effect if blockCount changes

  return { data, loading, error, startBlock, endBlock };
};