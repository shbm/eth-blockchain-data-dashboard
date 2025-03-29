import React from 'react';

interface ChartWrapperProps {
  title: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, loading, error, children }) => {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '30px auto', border: '1px solid #eee' }}>
      <h2 style={{ textAlign: 'center' }}>{title}</h2>
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading Data...</div>}
      {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginTop: '10px' }}>Error: {error}</div>}
      {!loading && !error && children}
    </div>
  );
};

export default ChartWrapper; 