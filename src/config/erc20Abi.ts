// src/config/erc20Abi.ts (or place inside the component file)

export const erc20Abi = [
    // Standard ERC20 Transfer Event
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  
    // Standard ERC20 decimals function
    "function decimals() view returns (uint8)",
  
    // Standard ERC20 symbol function
    "function symbol() view returns (string)",
  ];
  
  // Keccak256 hash of the Transfer event signature
  export const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';