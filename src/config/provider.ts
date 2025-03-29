import { ethers } from 'ethers';

// Get API key from environment variables
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
    console.warn("Alchemy API Key not found in environment variables. Please ensure VITE_ALCHEMY_API_KEY is set.");
}

const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const ALCHEMY_WSS_URL = `wss://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Initialize providers only if API key exists
export const httpProvider = ALCHEMY_API_KEY ? new ethers.JsonRpcProvider(ALCHEMY_URL) : null;

// WebSocket Provider
let webSocketProvider: ethers.WebSocketProvider | null = null;
if (!webSocketProvider && ALCHEMY_API_KEY) {
    try {
        webSocketProvider = new ethers.WebSocketProvider(ALCHEMY_WSS_URL);
        console.log("WebSocket Provider initialized.");
    } catch (error) { 
        console.error("Failed to initialize WebSocket Provider:", error); 
    }
}

export { webSocketProvider }; 