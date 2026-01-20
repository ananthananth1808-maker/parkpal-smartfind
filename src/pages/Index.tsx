import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ParkingMap from '@/components/ParkingMap';
import ParkingLotCard from '@/components/ParkingLotCard';
import BookingModal from '@/components/BookingModal';
import DrivingMode from '@/components/DrivingMode';
import { mockParkingLots } from '@/data/mockParkingData';
import { ParkingLot } from '@/types/parking';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [bookingLot, setBookingLot] = useState<ParkingLot | null>(null);
  const [userLocation] = useState({ lat: 40.7128, lng: -74.006 });

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Filter logic would go here
  };

  const handleBookingConfirm = (booking: {
    slotId: string;
    vehicleNumber: string;
    duration: number;
    whatsappNumber: string;
  }) => {
    console.log('Booking confirmed:', booking);
    // Here you would integrate with WhatsApp API
    // https://wa.me/{number}?text={message}
    const message = encodeURIComponent(
      `🅿️ ParkSmart Booking Confirmed!\n\n` +
      `📍 ${bookingLot?.name}\n` +
      `🚗 Vehicle: ${booking.vehicleNumber}\n` +
      `⏰ Duration: ${booking.duration} hours\n` +
      `💰 Total: $${(bookingLot?.pricePerHour || 0) * booking.duration}\n\n` +
      `See you soon!`
    );
    
    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/${booking.whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
    
    setBookingLot(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Map and Listings Section */}
        <section id="map" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Find Parking Near You
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real-time availability from 500+ parking locations. Click on a marker to see details and book instantly.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Map */}
              <div className="lg:col-span-2">
                <ParkingMap
                  parkingLots={mockParkingLots}
                  selectedLot={selectedLot}
                  onSelectLot={setSelectedLot}
                  userLocation={userLocation}
                />
              </div>

              {/* Parking List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <h3 className="font-display text-lg font-semibold text-foreground sticky top-0 bg-background py-2">
                  {mockParkingLots.length} Parking Locations
                </h3>
                {mockParkingLots.map(lot => (
                  <ParkingLotCard
                    key={lot.id}
                    lot={lot}
                    isSelected={selectedLot?.id === lot.id}
                    onSelect={() => setSelectedLot(lot)}
                    onBook={() => setBookingLot(lot)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Driving Mode Section */}
        <DrivingMode 
          parkingLots={mockParkingLots}
          onSelectLot={(lot) => {
            setSelectedLot(lot);
            setBookingLot(lot);
          }}
        />

        {/* Features Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Smart Features
              </h2>
              <p className="text-muted-foreground">
                Everything you need for hassle-free parking
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Real-time Tracking
                </h3>
                <p className="text-muted-foreground">
                  Track nearby parking lots while driving with live availability updates and voice alerts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">📹</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Live Camera View
                </h3>
                <p className="text-muted-foreground">
                  See exactly where your spot is with live camera feeds before you arrive.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  WhatsApp Alerts
                </h3>
                <p className="text-muted-foreground">
                  Get instant booking confirmations and reminders directly on WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 ParkSmart. Smart parking for smart cities.
          </p>
        </div>
      </footer>

      {/* Booking Modal */}
      {bookingLot && (
        <BookingModal
          lot={bookingLot}
          onClose={() => setBookingLot(null)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
};

export default Index;
