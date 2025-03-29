# Ethereum Blockchain Data Dashboard

A real-time dashboard for monitoring Ethereum blockchain metrics including base fees, gas utilization, and ERC20 token transfer volumes. Built with React, TypeScript, and Chart.js.

![Ethereum Dashboard](https://img.shields.io/badge/Ethereum-Mainnet-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-3178C6)

## 🌟 Features

- **Real-time Block Monitoring**: Live updates of the latest Ethereum block number
- **Base Fee Chart**: Visualization of Ethereum base fees over time
- **Gas Utilization Chart**: Track block gas usage and utilization rates
- **ERC20 Volume Chart**: Monitor token transfer volumes for any ERC20 token
- **WebSocket Integration**: Real-time data updates using WebSocket connections

## 🚀 Live Demo

Visit the live dashboard at: [eth-blockchain-data-dashboard.vercel.app](https://eth-blockchain-data-dashboard.vercel.app)

## 🛠️ Tech Stack

- **Frontend Framework**: React with TypeScript
- **Charts**: Chart.js with React-ChartJS-2
- **Ethereum Interaction**: ethers.js
- **API Provider**: Alchemy
- **Build Tool**: Vite
- **Styling**: CSS Modules

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/shbm/eth-blockchain-data-dashboard.git
cd eth-blockchain-data-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your Alchemy API key to the `.env` file:
```bash
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

The dashboard uses the following environment variables:
- `VITE_ALCHEMY_API_KEY`: Your Alchemy API key for Ethereum mainnet

## 📊 Charts

### Base Fee Chart
- Shows the base fee per gas for the last 10 blocks
- Updates in real-time as new blocks are mined
- Displays data in Gwei units

### ERC20 Volume Chart
- Monitors transfer volumes for any ERC20 token
- Supports custom token address input
- Shows volume data for the last 10 blocks

### Gas Utilization Chart
- Tracks block gas usage and utilization rates
- Helps identify network congestion
- Updates automatically with new blocks


## 🙏 Acknowledgments

- [Alchemy](https://www.alchemy.com/) for providing the Ethereum API
- [ethers.js](https://docs.ethers.org/) for Ethereum interaction
- [Chart.js](https://www.chartjs.org/) for data visualization

---
Made with ❤️ for the Ethereum community
