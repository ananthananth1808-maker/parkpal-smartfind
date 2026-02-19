import { useState } from 'react';
import { X, Camera, Clock, MessageCircle, Car, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ParkingLot, ParkingSlot } from '@/types/parking';
import { generateSlotsForLot } from '@/data/mockParkingData';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface BookingModalProps {
  lot: ParkingLot;
  onClose: () => void;
  isLoading?: boolean;
  onConfirm: (booking: {
    slotId: string;
    vehicleNumber: string;
    duration: number;
    whatsappNumber: string;
    customerName: string;
  }) => void;
}

const BookingModal = ({ lot, onClose, onConfirm, isLoading = false }: BookingModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'slots' | 'details' | 'confirm'>('slots');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [duration, setDuration] = useState(2);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const slots = generateSlotsForLot(lot.id, Math.min(lot.totalSlots, 30));
  const floors = [...new Set(slots.map(s => s.floor))];

  const handleBook = () => {
    if (!selectedSlot || !vehicleNumber || !whatsappNumber || !customerName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onConfirm({
      slotId: selectedSlot.id,
      vehicleNumber,
      duration,
      whatsappNumber,
      customerName
    });

    toast({
      title: "Booking Confirmed! 🎉",
      description: `Slot ${selectedSlot.slotNumber} booked. WhatsApp alert will be sent to ${whatsappNumber}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-card border border-border shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{lot.name}</h2>
            <p className="text-muted-foreground">{lot.address}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Camera View Toggle */}
          {lot.hasCamera && (
            <div className="mb-6">
              <Button
                variant={showCamera ? 'hero' : 'outline'}
                onClick={() => setShowCamera(!showCamera)}
                className="mb-4"
              >
                <Camera className="w-4 h-4" />
                {showCamera ? 'Hide' : 'Show'} Live Camera
              </Button>

              {showCamera && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary mb-4">
                  {/* Simulated camera feed */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                      <p className="text-muted-foreground">Live Camera Feed</p>
                      <p className="text-xs text-muted-foreground mt-1">Floor {selectedSlot?.floor || 1} View</p>
                    </div>
                  </div>
                  {/* Camera overlay grid */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-px opacity-30">
                    {[...Array(24)].map((_, i) => (
                      <div key={i} className="border border-primary/20"></div>
                    ))}
                  </div>
                  {/* Recording indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/20 text-destructive">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
                    <span className="text-xs font-medium">LIVE</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Select Slot */}
          {step === 'slots' && (
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Select Your Parking Slot
              </h3>

              {floors.map(floor => (
                <div key={floor} className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Floor {floor}
                  </p>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {slots
                      .filter(s => s.floor === floor)
                      .slice(0, 20)
                      .map(slot => {
                        const isAvailable = slot.status === 'available';
                        const isSelected = selectedSlot?.id === slot.id;

                        return (
                          <button
                            key={slot.id}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedSlot(slot);
                                sonnerToast.success(`Selected Slot ${slot.slotNumber}`);
                              }
                            }}
                            disabled={!isAvailable}
                            className={`
                              aspect-[3/2] rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all active:scale-95
                              ${isAvailable
                                ? isSelected
                                  ? 'bg-primary text-primary-foreground ring-2 ring-foreground scale-105 shadow-lg shadow-primary/20'
                                  : 'bg-available/20 text-available hover:bg-available/30 hover:scale-105'
                                : slot.status === 'reserved'
                                  ? 'bg-reserved/20 text-reserved cursor-not-allowed opacity-50'
                                  : 'bg-occupied/20 text-occupied cursor-not-allowed opacity-50'
                              }
                            `}
                          >
                            {slot.vehicleType === 'ev' && <Zap className="w-3 h-3 mb-0.5" />}
                            {slot.slotNumber}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-available/20"></div>
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-reserved/20"></div>
                  <span className="text-muted-foreground">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-occupied/20"></div>
                  <span className="text-muted-foreground">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">EV Charging</span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Booking Details */}
          {step === 'details' && selectedSlot && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground mb-1">Selected Slot</p>
                <p className="font-display text-2xl font-bold text-primary">{selectedSlot.slotNumber}</p>
                <p className="text-sm text-muted-foreground">Floor {selectedSlot.floor}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Car className="w-4 h-4 inline mr-2" />
                  Vehicle Number
                </label>
                <Input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC 1234"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duration (hours)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 4, 8].map(h => (
                    <Button
                      key={h}
                      variant={duration === h ? 'hero' : 'outline'}
                      onClick={() => setDuration(h)}
                      className="flex-1"
                    >
                      {h}h
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  WhatsApp Number (for alerts)
                </label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  You'll receive booking confirmation and reminders on WhatsApp
                </p>
              </div>
            </div>
          )}

          {/* Step: Confirmation */}
          {step === 'confirm' && selectedSlot && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Confirm Your Booking
              </h3>
              <p className="text-muted-foreground mb-6">Please review your booking details</p>

              <div className="p-6 rounded-xl bg-secondary text-left space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Name</span>
                  <span className="font-semibold text-foreground">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parking Slot</span>
                  <span className="font-semibold text-foreground">{selectedSlot.slotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-semibold text-foreground">{vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold text-foreground">{duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span className="font-semibold text-foreground">{whatsappNumber}</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between">
                  <span className="text-lg font-medium text-foreground">Total</span>
                  <span className="text-2xl font-display font-bold text-primary">
                    ${lot.pricePerHour * duration}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/50">
          <div>
            {selectedSlot && step !== 'slots' && (
              <p className="text-sm text-muted-foreground">
                Total: <span className="text-lg font-bold text-primary">${lot.pricePerHour * duration}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {step !== 'slots' && (
              <Button
                variant="outline"
                onClick={() => setStep(step === 'confirm' ? 'details' : 'slots')}
              >
                Back
              </Button>
            )}
            {step === 'slots' && (
              <Button
                variant="hero"
                disabled={!selectedSlot}
                onClick={() => setStep('details')}
              >
                Continue
              </Button>
            )}
            {step === 'details' && (
              <Button
                variant="hero"
                disabled={!vehicleNumber || !whatsappNumber || !customerName}
                onClick={() => setStep('confirm')}
              >
                Review Booking
              </Button>
            )}
            {step === 'confirm' && (
              <Button variant="hero" onClick={handleBook} disabled={isLoading}>
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                {isLoading ? 'Booking...' : 'Confirm & Get WhatsApp Alert'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
