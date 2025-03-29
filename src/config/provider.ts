import { ethers } from 'ethers';

// --- Environment Variable & Provider Setup ---
const ALCHEMY_API_KEY = "SaPOUALvqdzgN_e8i300eXfszDP4cHsu";
const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const ALCHEMY_WSS_URL = import.meta.env.VITE_ALCHEMY_WSS_URL || process.env.REACT_APP_ALCHEMY_WSS_URL;

// HTTP Provider
export const httpProvider = ALCHEMY_API_KEY ? new ethers.JsonRpcProvider(ALCHEMY_URL) : null;

// WebSocket Provider
let webSocketProvider: ethers.WebSocketProvider | null = null;
if (!webSocketProvider && ALCHEMY_WSS_URL) {
    try {
        webSocketProvider = new ethers.WebSocketProvider(ALCHEMY_WSS_URL);
        console.log("WebSocket Provider initialized.");
    } catch (error) { 
        console.error("Failed to initialize WebSocket Provider:", error); 
    }
}

export { webSocketProvider }; 