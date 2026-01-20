import { MapPin, Star, Camera, Clock, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParkingLot } from '@/types/parking';

interface ParkingLotCardProps {
  lot: ParkingLot;
  isSelected: boolean;
  onSelect: () => void;
  onBook: () => void;
}

const ParkingLotCard = ({ lot, isSelected, onSelect, onBook }: ParkingLotCardProps) => {
  const availabilityPercent = (lot.availableSlots / lot.totalSlots) * 100;
  const getAvailabilityColor = () => {
    if (availabilityPercent > 30) return 'text-available';
    if (availabilityPercent > 0) return 'text-reserved';
    return 'text-occupied';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-secondary border-primary shadow-lg shadow-primary/10'
          : 'bg-card border-border hover:border-primary/50 hover:bg-secondary/50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display font-semibold text-foreground">{lot.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span>{lot.address}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span className="text-foreground font-medium">{lot.rating}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Car className={`w-4 h-4 ${getAvailabilityColor()}`} />
          <span className={`font-semibold ${getAvailabilityColor()}`}>
            {lot.availableSlots}
          </span>
          <span className="text-sm text-muted-foreground">/ {lot.totalSlots}</span>
        </div>
        
        {lot.hasCamera && (
          <div className="flex items-center gap-1 text-primary">
            <Camera className="w-4 h-4" />
            <span className="text-xs">Live View</span>
          </div>
        )}

        {lot.distance && (
          <div className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Clock className="w-3 h-3" />
            <span className="text-sm">{lot.distance} km</span>
          </div>
        )}
      </div>

      {/* Availability Bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 ${
            availabilityPercent > 30 ? 'bg-available' : availabilityPercent > 0 ? 'bg-reserved' : 'bg-occupied'
          }`}
          style={{ width: `${availabilityPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-display font-bold text-primary">${lot.pricePerHour}</span>
          <span className="text-sm text-muted-foreground">/hour</span>
        </div>
        <Button
          variant={lot.availableSlots > 0 ? 'hero' : 'secondary'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (lot.availableSlots > 0) onBook();
          }}
          disabled={lot.availableSlots === 0}
        >
          {lot.availableSlots > 0 ? 'Book Now' : 'Full'}
        </Button>
      </div>
    </div>
  );
};

export default ParkingLotCard;
