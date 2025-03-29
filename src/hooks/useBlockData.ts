import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { httpProvider } from '../config/provider';

export interface BlockData {
  number: number;
  timestamp: number;
}

interface UseBlockDataReturn {
  data: BlockData[] | null;
  loading: boolean;
  error: string | null;
  startBlock: number | null;
  endBlock: number | null;
}

export const useBlockData = (blockCount: number): UseBlockDataReturn => {
  const [data, setData] = useState<BlockData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startBlock, setStartBlock] = useState<number | null>(null);
  const [endBlock, setEndBlock] = useState<number | null>(null);

  useEffect(() => {
    if (!httpProvider) {
      setError("Provider not initialized. Check API Key.");
      setLoading(false);
      return;
    }
    if (blockCount <= 0) {
      setError("Block count must be greater than zero.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchBlocks = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setStartBlock(null);
      setEndBlock(null);

      try {
        if (!httpProvider) throw new Error("Provider not initialized");
        const latestBlockNumber = await httpProvider.getBlockNumber();
        const end = latestBlockNumber;
        const start = Math.max(0, end - blockCount + 1);

        if (!isMounted) return;
        setStartBlock(start);
        setEndBlock(end);

        const blockNumbersToFetch = Array.from(
          { length: end - start + 1 },
          (_, i) => start + i
        );

        if (!httpProvider) throw new Error("Provider not initialized");
        const provider = httpProvider;
        const blockPromises = blockNumbersToFetch.map(blockNum =>
          provider.getBlock(blockNum, false)
        );
        
        const resolvedBlocks = await Promise.all(blockPromises);
        const validBlocks = resolvedBlocks.filter(block => block !== null) as ethers.Block[];

        if (!isMounted) return;

        if (validBlocks.length === 0) {
          throw new Error("No valid block data received.");
        }

        validBlocks.sort((a, b) => a.number - b.number);

        const formattedData: BlockData[] = validBlocks.map(block => ({
          number: block.number,
          timestamp: block.timestamp
        }));

        setData(formattedData);

      } catch (err: unknown) {
        console.error("Error fetching block data:", err);
        if (isMounted) {
          if (err instanceof Error) setError(err.message);
          else setError('An unknown error occurred.');
          setData(null);
          setStartBlock(null);
          setEndBlock(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBlocks();

    return () => {
      isMounted = false;
    };
  }, [blockCount]);

  return { data, loading, error, startBlock, endBlock };
}; 