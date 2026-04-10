import { useState, useEffect, useRef } from 'react';
import { Navigation, Car, Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParkingLot } from '@/types/parking';
import { toast } from 'sonner';

interface DrivingModeProps {
  parkingLots: ParkingLot[];
  onSelectLot: (lot: ParkingLot) => void;
}

const DrivingMode = ({ parkingLots, onSelectLot }: DrivingModeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [nearbyLots, setNearbyLots] = useState<ParkingLot[]>([]);
  const [currentLocation, setCurrentLocation] = useState({ lat: 12.8396, lng: 80.2201 });
  const [eta, setEta] = useState(0);
  const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevTimestampRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastAnnouncedSignatureRef = useRef<string | null>(null);
  const lastAnnouncedAvailabilityRef = useRef<number | null>(null);
  const voiceUnlockedRef = useRef(false);

  const speakParkingUpdate = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !voiceEnabled) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const getDistancePhrase = (distanceKm: number) => {
    if (distanceKm <= 0.3) return 'very close by';
    if (distanceKm <= 1) return 'nearby';
    return 'a little farther away';
  };

  const buildParkingAnnouncement = (lot: ParkingLot, distanceKm: number, etaMinutes?: number) => {
    const slotText = lot.availableSlots === 1 ? '1 available spot' : `${lot.availableSlots} available spots`;
    const distancePhrase = getDistancePhrase(distanceKm);
    const etaText = etaMinutes && etaMinutes > 0 ? ` Estimated arrival is about ${etaMinutes} minutes.` : '';

    return `${lot.name} is ${distancePhrase}, ${distanceKm.toFixed(1)} kilometers away, with ${slotText}.${etaText}`;
  };

  const handleStartDriving = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsActive(true);
      setIsStarting(false);
      toast.success("Driving Mode Activated");
      voiceUnlockedRef.current = true;
      if (voiceEnabled) {
        speakParkingUpdate('Driving mode activated. Searching for nearby parking slots.');
      }
    }, 800);
  };

  const handleVoiceToggle = () => {
    const nextEnabled = !voiceEnabled;
    setVoiceEnabled(nextEnabled);
    toast.info(nextEnabled ? 'Voice Alerts Enabled' : 'Voice Alerts Muted');

    if (nextEnabled) {
      voiceUnlockedRef.current = true;
      lastAnnouncedSignatureRef.current = null;
      lastAnnouncedAvailabilityRef.current = null;
      if (nearbyLots.length > 0) {
        speakParkingUpdate(
          `Voice alerts enabled. ${nearbyLots[0].name} is nearby with ${nearbyLots[0].availableSlots} available spots.`
        );
      } else {
        speakParkingUpdate('Voice alerts enabled. Searching for nearby parking lots.');
      }
    }
  };

  const handleEndDrive = () => {
    setIsActive(false);
    lastAnnouncedSignatureRef.current = null;
    lastAnnouncedAvailabilityRef.current = null;
    toast.info("Driving Mode Deactivated");
  };

  // Haversine formula for distance in km
  function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    if (isActive) {
      // Start geolocation tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });

          // Speed: use coords.speed if available, else calculate manually
          let calcSpeed = 0;
          if (speed != null && !isNaN(speed)) {
            calcSpeed = speed * 3.6; // m/s to km/h
          } else if (prevLocationRef.current && prevTimestampRef.current) {
            const prev = prevLocationRef.current;
            const prevTime = prevTimestampRef.current;
            const dist = getDistanceKm(prev.lat, prev.lng, latitude, longitude); // in km
            const timeElapsed = (pos.timestamp - prevTime) / 3600000; // ms to hours
            if (timeElapsed > 0) {
              calcSpeed = dist / timeElapsed;
            }
          }
          setCurrentSpeed(Math.round(calcSpeed));
          prevLocationRef.current = { lat: latitude, lng: longitude };
          prevTimestampRef.current = pos.timestamp;

          // Find nearby lots (within 2km, sorted by distance)
          const lotsWithDistance = parkingLots.map(lot => ({
            ...lot,
            distance: getDistanceKm(latitude, longitude, lot.latitude, lot.longitude)
          }));
          const sorted = lotsWithDistance
            .filter(lot => lot.distance <= 2)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
          setNearbyLots(sorted);

          const nearestLot = sorted[0];
          const nearestSignature = nearestLot
            ? `${nearestLot.id}-${nearestLot.availableSlots}`
            : null;
          const availabilityImproved =
            nearestLot &&
            (lastAnnouncedAvailabilityRef.current == null || nearestLot.availableSlots > lastAnnouncedAvailabilityRef.current);
          const shouldAnnounceLot =
            voiceEnabled &&
            voiceUnlockedRef.current &&
            nearestLot &&
            nearestSignature !== lastAnnouncedSignatureRef.current &&
            availabilityImproved;

          if (shouldAnnounceLot) {
            lastAnnouncedSignatureRef.current = nearestSignature;
            lastAnnouncedAvailabilityRef.current = nearestLot.availableSlots;
            speakParkingUpdate(buildParkingAnnouncement(nearestLot, nearestLot.distance, eta));
          }

          // ETA to nearest
          if (sorted.length > 0 && calcSpeed > 0) {
            setEta(Math.ceil((sorted[0].distance / calcSpeed) * 60)); // min
          } else {
            setEta(0);
          }
        },
        (err) => {
          toast.error('Location error: ' + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      return () => {
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      };
    }
  }, [isActive, parkingLots]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
              <Button variant="hero" size="xl" onClick={handleStartDriving} disabled={isStarting}>
              {isStarting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Car className="w-5 h-5" />
              )}
              {isStarting ? 'Activating...' : 'Start Driving Mode'}
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
                onClick={handleVoiceToggle}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" onClick={handleEndDrive}>
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
              <p className="text-2xl font-display font-bold text-foreground">{eta > 0 ? eta : '--'} <span className="text-sm font-normal">min</span></p>
            </div>
          </div>
        </div>

        {/* Nearby Lots List */}
        <div className="space-y-4">
          <h4 className="font-display text-lg font-semibold text-foreground">Nearby Parking</h4>

          {nearbyLots.map((lot, index) => (
            <div
              key={lot.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${index === 0
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-primary/50'
                }`}
              onClick={() => onSelectLot(lot)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground">{lot.name}</h5>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{lot.distance ? lot.distance.toFixed(2) : '--'} km away</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>~{eta > 0 && index === 0 ? eta : Math.ceil((lot.distance || 0.5) * 2)} min</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${lot.availableSlots > 10 ? 'text-available' : lot.availableSlots > 0 ? 'text-reserved' : 'text-occupied'
                    }`}>
                    {lot.availableSlots} spots
                  </p>
                  <p className="text-sm text-muted-foreground">₹{lot.pricePerHour.toLocaleString('en-IN')}/hr</p>
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
