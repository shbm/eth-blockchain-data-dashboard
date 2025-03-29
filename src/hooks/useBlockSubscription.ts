import { useState, useEffect } from 'react';
import { webSocketProvider } from '../config/provider';

export const useBlockSubscription = () => {
  const [latestBlockNumber, setLatestBlockNumber] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!webSocketProvider) {
      console.error("WebSocket provider not initialized");
      return;
    }

    const handleNewBlock = (blockNumber: number) => {
      console.log("New block received:", blockNumber);
      setLatestBlockNumber(blockNumber);
    };

    const setupConnection = async () => {
      try {
        if (!webSocketProvider) throw new Error("WebSocket provider not initialized");
        const provider = webSocketProvider;
        const initialBlock = await provider.getBlockNumber();
        setLatestBlockNumber(initialBlock);
        setIsConnected(true);
        
        provider.on('block', handleNewBlock);
      } catch (error) {
        console.error("Error setting up block subscription:", error);
        setIsConnected(false);
      }
    };

    setupConnection();

    return () => {
      if (webSocketProvider) {
        webSocketProvider.off('block', handleNewBlock);
      }
    };
  }, []);

  return { latestBlockNumber, isConnected };
}; 