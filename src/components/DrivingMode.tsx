import { useState, useEffect } from 'react';
import { Navigation, Car, Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParkingLot } from '@/types/parking';

interface DrivingModeProps {
  parkingLots: ParkingLot[];
  onSelectLot: (lot: ParkingLot) => void;
}

const DrivingMode = ({ parkingLots, onSelectLot }: DrivingModeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentSpeed] = useState(45);
  const [nearbyLots, setNearbyLots] = useState<ParkingLot[]>([]);
  const [currentLocation, setCurrentLocation] = useState({ lat: 40.7128, lng: -74.006 });

  useEffect(() => {
    if (isActive) {
      // Simulate location updates and finding nearby parking
      const interval = setInterval(() => {
        // Sort by distance and take closest 3
        const sorted = [...parkingLots]
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 3);
        setNearbyLots(sorted);
        
        // Simulate movement
        setCurrentLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isActive, parkingLots]);

  if (!isActive) {
    return (
      <section id="driving" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Driving Mode
            </h2>
            <p className="text-muted-foreground mb-8">
              Enable driving mode to automatically track nearby parking lots as you drive. 
              Get real-time updates and voice alerts for available parking spots.
            </p>
            <Button variant="hero" size="xl" onClick={() => setIsActive(true)}>
              <Car className="w-5 h-5" />
              Start Driving Mode
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="driving" className="py-8">
      <div className="container mx-auto px-4">
        {/* Driving Mode Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center driving-pulse">
                <Navigation className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Driving Mode Active</h3>
                <p className="text-sm text-muted-foreground">Tracking nearby parking in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={voiceEnabled ? 'hero' : 'outline'}
                size="icon"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" onClick={() => setIsActive(false)}>
                End Drive
              </Button>
            </div>
          </div>

          {/* Speed and Location */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">Current Speed</p>
              <p className="text-2xl font-display font-bold text-foreground">{currentSpeed} <span className="text-sm font-normal">km/h</span></p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">Nearby Parking</p>
              <p className="text-2xl font-display font-bold text-primary">{nearbyLots.length} <span className="text-sm font-normal">lots</span></p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">Available Spots</p>
              <p className="text-2xl font-display font-bold text-available">
                {nearbyLots.reduce((sum, lot) => sum + lot.availableSlots, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">ETA to Nearest</p>
              <p className="text-2xl font-display font-bold text-foreground">2 <span className="text-sm font-normal">min</span></p>
            </div>
          </div>
        </div>

        {/* Nearby Lots List */}
        <div className="space-y-4">
          <h4 className="font-display text-lg font-semibold text-foreground">Nearby Parking</h4>
          
          {nearbyLots.map((lot, index) => (
            <div
              key={lot.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                index === 0 
                  ? 'bg-primary/10 border-primary' 
                  : 'bg-card border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectLot(lot)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold ${
                    index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground">{lot.name}</h5>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{lot.distance} km away</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>~{Math.ceil((lot.distance || 0.5) * 2)} min</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    lot.availableSlots > 10 ? 'text-available' : lot.availableSlots > 0 ? 'text-reserved' : 'text-occupied'
                  }`}>
                    {lot.availableSlots} spots
                  </p>
                  <p className="text-sm text-muted-foreground">${lot.pricePerHour}/hr</p>
                </div>
              </div>

              {index === 0 && (
                <div className="mt-3 pt-3 border-t border-primary/30">
                  <Button variant="hero" size="sm" className="w-full">
                    Navigate & Book
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DrivingMode;
