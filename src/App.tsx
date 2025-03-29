// src/App.tsx
import React from 'react';
import BaseFeeChart from './components/BaseFeeChart';
import Erc20VolumeChart from './components/Erc20VolumeChart';
import GasRatioChart from './components/GasRatioChart'; // Import the new ratio chart
import './App.css';

// Assume ChartJS elements are registered globally as shown previously

const App: React.FC = () => {
  return (
    <div className="App">
      <header>
        <h1>Ethereum Data Dashboard</h1>
      </header>
      <main style={{ padding: '20px 0' }}>
        <BaseFeeChart />
        <hr style={{ margin: '40px auto', width: '90%', maxWidth: '900px' }} />
        <Erc20VolumeChart />
        <hr style={{ margin: '40px auto', width: '90%', maxWidth: '900px' }} /> {/* Separator */}
        <GasRatioChart /> {/* Add the new chart component */}
      </main>
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontSize: '0.8em'}}>
          Data provided by Alchemy.
          Current Time: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
      </footer>
    </div>
  );
}

export default App;