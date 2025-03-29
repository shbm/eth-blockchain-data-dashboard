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
        <div style={{ marginBottom: '10px' }}>
          <a 
            href="https://github.com/shbm/eth-blockchain-data-dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#888', 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
            View on GitHub
          </a>
        </div>
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
 
        <div>Data provided by Alchemy.</div>
        <div>Current Time: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</div>
      </footer>
    </div>
  );
}

export default App;