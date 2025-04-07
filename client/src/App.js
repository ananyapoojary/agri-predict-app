import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import SearchBar from './components/SearchBar';
import { getDataAndPrediction } from './services/api';

function App() {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = async (lat, lon) => {
    setSelectedPosition([lat, lon]);
    await fetchData(lat, lon);
  };

  const handleSearch = async (lat, lon) => {
    setSelectedPosition([lat, lon]);
    await fetchData(lat, lon);
  };

  const fetchData = async (lat, lon) => {
    setLoading(true);
    try {
      const data = await getDataAndPrediction(lat, lon);
      setResults(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Agri Prediction App</h1>
      <SearchBar onSearch={handleSearch} />
      <MapComponent onLocationSelect={handleLocationSelect} selectedPosition={selectedPosition} />
      {loading && <p>Loading data...</p>}
      {results && (
        <div style={{ marginTop: '20px' }}>
          <h2>Fetched Data</h2>
          <pre>{JSON.stringify(results.fetchedData, null, 2)}</pre>
          <h2>Prediction</h2>
          <pre>{JSON.stringify(results.prediction, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
