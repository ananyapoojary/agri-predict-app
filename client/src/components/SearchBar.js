import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if(lat && lon) {
      onSearch(parseFloat(lat), parseFloat(lon));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="number"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        required
        step="any"
      />
      <input
        type="number"
        placeholder="Longitude"
        value={lon}
        onChange={(e) => setLon(e.target.value)}
        required
        step="any"
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;
