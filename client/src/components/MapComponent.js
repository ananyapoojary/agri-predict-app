import React from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// A simple component to capture click events on the map
function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onClick(lat, lng);
    }
  });
  return null;
}

const MapComponent = ({ onLocationSelect, selectedPosition }) => {
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onLocationSelect} />
      {selectedPosition && <Marker position={selectedPosition} />}
    </MapContainer>
  );
};

export default MapComponent;
