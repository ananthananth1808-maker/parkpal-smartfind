import { useState } from 'react';
import { MapPin, Navigation2, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParkingLot } from '@/types/parking';

interface ParkingMapProps {
  parkingLots: ParkingLot[];
  selectedLot: ParkingLot | null;
  onSelectLot: (lot: ParkingLot) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const ParkingMap = ({ parkingLots, selectedLot, onSelectLot, userLocation }: ParkingMapProps) => {
  const [zoom, setZoom] = useState(14);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-border">
      {/* Map Background - Simulated dark map */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-secondary">
        {/* Grid lines to simulate map */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full h-px bg-border"
              style={{ top: `${(i + 1) * 5}%` }}
            />
          ))}
          {[...Array(20)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-px bg-border"
              style={{ left: `${(i + 1) * 5}%` }}
            />
          ))}
        </div>

        {/* Simulated roads */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/20 transform -translate-y-1/2"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-muted-foreground/20 transform -translate-x-1/2"></div>
          <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-muted-foreground/10"></div>
          <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-muted-foreground/10"></div>
        </div>
      </div>

      {/* User Location Marker */}
      {userLocation && (
        <div
          className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
          style={{ top: '50%', left: '50%' }}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-sidebar-ring rounded-full border-2 border-foreground driving-pulse"></div>
            <div className="absolute -inset-2 bg-sidebar-ring/20 rounded-full animate-ping"></div>
          </div>
        </div>
      )}

      {/* Parking Markers */}
      {parkingLots.map((lot, index) => {
        const isSelected = selectedLot?.id === lot.id;
        const availability = lot.availableSlots / lot.totalSlots;
        const markerColor = availability > 0.3 ? 'bg-available' : availability > 0 ? 'bg-reserved' : 'bg-occupied';
        
        // Position markers in different spots around the map
        const positions = [
          { top: '30%', left: '25%' },
          { top: '45%', left: '65%' },
          { top: '60%', left: '35%' },
          { top: '25%', left: '70%' },
          { top: '70%', left: '60%' },
        ];
        
        const pos = positions[index % positions.length];

        return (
          <button
            key={lot.id}
            onClick={() => onSelectLot(lot)}
            className={`absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              isSelected ? 'scale-125 z-20' : 'hover:scale-110'
            }`}
            style={{ top: pos.top, left: pos.left }}
          >
            <div className={`relative group`}>
              <div className={`w-10 h-10 ${markerColor} rounded-full flex items-center justify-center shadow-lg map-marker ${
                isSelected ? 'ring-4 ring-foreground' : ''
              }`}>
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                <p className="font-semibold text-sm text-foreground">{lot.name}</p>
                <p className="text-xs text-primary">{lot.availableSlots} spots available</p>
              </div>
            </div>
          </button>
        );
      })}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="glass"
          size="icon"
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="glass"
          size="icon"
          onClick={() => setZoom(Math.max(zoom - 1, 10))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="glass" size="icon">
          <Layers className="w-4 h-4" />
        </Button>
      </div>

      {/* Center on User Button */}
      <Button
        variant="hero"
        size="sm"
        className="absolute bottom-4 right-4"
      >
        <Navigation2 className="w-4 h-4" />
        My Location
      </Button>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card rounded-lg p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Availability</p>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-available"></div>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-reserved"></div>
            <span className="text-muted-foreground">Limited</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-occupied"></div>
            <span className="text-muted-foreground">Full</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingMap;
