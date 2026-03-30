
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css'; // Idhu dhaan romba mukkiyam!



const HITS_POSITION = [12.8396, 80.2201];

function LocationMarker({ userPosition, setUserPosition, recenter, setRecenter }) {
  const map = useMap();
  const watchId = useRef(null);

  // Start watching user location
  useEffect(() => {
    if (!map) return;
    let first = true;
    function onLocationFound(e) {
      setUserPosition([e.latitude, e.longitude]);
      if (first || recenter) {
        map.setView([e.latitude, e.longitude], map.getZoom(), { animate: true });
        first = false;
        setRecenter(false);
      }
    }
    map.on('locationfound', onLocationFound);
    map.locate({ watch: true, enableHighAccuracy: true });
    return () => {
      map.stopLocate();
      map.off('locationfound', onLocationFound);
    };
  }, [map, recenter, setUserPosition, setRecenter]);

  return userPosition ? (
    <Marker position={userPosition} icon={L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    })}>
      <Popup>Current Location</Popup>
    </Marker>
  ) : null;
}

function ParkingMap() {
  const [userPosition, setUserPosition] = useState(null);
  const [recenter, setRecenter] = useState(false);

  return (
    <div 
      className="leaflet-map-section" 
      style={{ 
        height: 500, 
        width: '100%', 
        maxWidth: '100%', 
        position: 'relative', 
        zIndex: 1, 
        borderRadius: 16, 
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
      }}
    >
      <MapContainer 
        center={HITS_POSITION} 
        zoom={15} 
        style={{ height: '100%', width: '100%', borderRadius: 16, zIndex: 1, position: 'relative' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={HITS_POSITION}>
          <Popup>
            SmartSpot HITS: Entry Gate Parking.
          </Popup>
        </Marker>
        <LocationMarker userPosition={userPosition} setUserPosition={setUserPosition} recenter={recenter} setRecenter={setRecenter} />
      </MapContainer>
      <Button 
        variant="hero" 
        size="sm" 
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}
        onClick={() => setRecenter(true)}
      >
        Recenter
      </Button>
    </div>
  );
}

export default ParkingMap;
