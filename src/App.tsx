// src/App.tsx
import React from 'react';
import BaseFeeChart from './components/BaseFeeChart';
import Erc20VolumeChart from './components/Erc20VolumeChart';
import GasRatioChart from './components/GasRatioChart';
import { useBlockSubscription } from './hooks/useBlockSubscription';
import './App.css';

// Assume ChartJS elements are registered globally as shown previously

const App: React.FC = () => {
  const { latestBlockNumber, isConnected } = useBlockSubscription();

  return (
    <div className="App">
      <header>
        <h1>Ethereum Data Dashboard</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected 
            ? `Connected | Latest Block: ${latestBlockNumber ?? 'Loading...'}`
            : 'Connecting...'}
        </div>
      </header>
      <main style={{ padding: '20px 0' }}>
        <BaseFeeChart latestBlockNumber={latestBlockNumber} />
        <hr style={{ margin: '40px auto', width: '90%', maxWidth: '900px' }} />
        <Erc20VolumeChart latestBlockNumber={latestBlockNumber} />
        <hr style={{ margin: '40px auto', width: '90%', maxWidth: '900px' }} />
        <GasRatioChart latestBlockNumber={latestBlockNumber} />
      </main>
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontSize: '0.8em'}}>
        Data provided by Alchemy.
        Current Time: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
      </footer>
    </div>
  );
}

export default App;