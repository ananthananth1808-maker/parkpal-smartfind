
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { ParkingLot } from '@/types/parking';
import 'leaflet/dist/leaflet.css'; // Idhu dhaan romba mukkiyam!



const HITS_POSITION = [12.8396, 80.2201];

// Custom icon for parking lots
const createParkingIcon = (price?: number) => {
  const priceText = price ? `₹${price}` : '🅿️';
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        border: 4px solid white;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <div>${priceText}</div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  });
};

// Custom icon for current location
const createLocationIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">📍</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface ParkingMapProps {
  parkingLots?: ParkingLot[];
  selectedLot?: ParkingLot | null;
  onSelectLot?: (lot: ParkingLot) => void;
  userLocation?: { lat: number; lng: number };
  onParkingLotClick?: (lot: ParkingLot) => void;
}

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
    <Marker position={userPosition} icon={createLocationIcon()}>
      <Popup>Your Current Location</Popup>
    </Marker>
  ) : null;
}

function ParkingMap({ 
  parkingLots = [], 
  selectedLot, 
  onSelectLot, 
  userLocation,
  onParkingLotClick 
}: ParkingMapProps) {
  const [userPosition, setUserPosition] = useState(null);
  const [recenter, setRecenter] = useState(false);

  // Use onSelectLot if provided, otherwise use onParkingLotClick
  const handleLotClick = (lot: ParkingLot) => {
    onSelectLot?.(lot) || onParkingLotClick?.(lot);
  };

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
        
        {/* Parking lot markers */}
        {parkingLots.map((lot) => (
          <Marker 
            key={lot.id} 
            position={[lot.lat, lot.lng]} 
            icon={createParkingIcon(lot.pricePerHour)}
            eventHandlers={{
              click: () => handleLotClick(lot),
            }}
          >
            <Popup>
              <div className="parking-popup" style={{ minWidth: 260, padding: '12px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '15px', color: '#1f2937' }}>
                  {lot.name}
                </h3>
                <p style={{ margin: '2px 0 8px 0', fontSize: '11px', color: '#9ca3af' }}>
                  📍 {lot.address}
                </p>
                
                <div style={{ margin: '10px 0', borderTop: '2px solid #e5e7eb', paddingTop: '10px' }}>
                  {/* Price Highlight */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>Price per hour</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{lot.pricePerHour}</div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Available</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                        {lot.availableSlots}/{lot.totalSlots}
                      </div>
                    </div>
                    <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Rating</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b' }}>
                        ⭐ {lot.rating}
                      </div>
                    </div>
                  </div>

                  {/* Distance and Features */}
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                    <div style={{ marginBottom: '2px' }}>📏 {lot.distance} km away</div>
                    {lot.hasCamera && <div style={{ marginBottom: '2px' }}>📹 Security Camera</div>}
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  onClick={() => handleLotClick(lot)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  🎯 Book Now
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* HITS location marker (original) */}
        <Marker position={HITS_POSITION} icon={createParkingIcon()}>
          <Popup>
            <div className="parking-popup" style={{ minWidth: 200 }}>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
                SmartSpot HITS
              </h3>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                Entry Gate Parking
              </p>
            </div>
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
