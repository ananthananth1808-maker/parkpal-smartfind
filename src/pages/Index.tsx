import BookingModal from '@/components/BookingModal';
import DrivingMode from '@/components/DrivingMode';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ParkingLotCard from '@/components/ParkingLotCard';
import ParkingMap from '@/components/ParkingMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockParkingLots } from '@/data/mockParkingData';
import { supabase } from '@/integrations/supabase/client';
import { ParkingLot } from '@/types/parking';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Mail, Phone, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [bookingLot, setBookingLot] = useState<ParkingLot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [userLocation] = useState({ lat: 40.7128, lng: -74.006 });
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const { data: parkingLots = [], isLoading, error } = useQuery({
    queryKey: ['parking_lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parking_lots')
        .select('*');

      if (error) {
        // Handle case where table doesn't exist (e.g., migration not run)
        if (
          error.code === 'PGRST116' ||
          error.code === 'PGRST205' ||
          error.code === '42P01' ||
          error.message.includes('not found') ||
          error.message.includes('relation')
        ) {
          console.warn('Parking lots table not found or Supabase not ready, falling back to mock data');
          toast.warning(`Database tables not set up yet (Code: ${error.code}). Run full_database_setup.sql in Supabase SQL Editor.`);
          return mockParkingLots;
        }

        console.error('Supabase fetch error:', error);
        console.dir(error); // Detailed view of the error object
        toast.error(`Fetch failed: ${error.message} (Code: ${error.code}). Using mock data.`);
        return mockParkingLots; // Final fallback for any other error to keep app working
      }

      return data.map((lot): ParkingLot => ({
        id: lot.id,
        name: lot.name,
        address: lot.address,
        lat: lot.lat,
        lng: lot.lng,
        totalSlots: lot.total_slots,
        availableSlots: lot.available_slots,
        pricePerHour: lot.price_per_hour,
        distance: lot.distance_info || 0,
        rating: lot.rating || 0,
        hasCamera: lot.has_camera || false,
      }));
    }
  });

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    setSearchQuery(query);
  };

  const filteredLots = useMemo(() =>
    parkingLots.filter(lot =>
      lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.address.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [parkingLots, searchQuery]
  );

  const { data: userBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['user_bookings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data;
    }
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      toast.success("Message sent! We'll get back to you soon.");
      setContactForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  const handleBookingConfirm = async (booking: {
    slotId: string;
    vehicleNumber: string;
    duration: number;
    whatsappNumber: string;
    customerName: string;
  }) => {
    setIsBooking(true);
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: session?.user?.id || null, // allow null for anonymous
          parking_lot_id: bookingLot?.id || '',
          parking_lot_name: bookingLot?.name || '',
          slot_id: booking.slotId,
          vehicle_number: booking.vehicleNumber,
          duration_hours: booking.duration,
          customer_name: booking.customerName,
          total_price: (bookingLot?.pricePerHour || 0) * booking.duration,
          status: 'active'
        });

      if (bookingError) throw bookingError;

      // Update available slots in the lot (mocking the transaction)
      if (bookingLot) {
        await supabase
          .from('parking_lots')
          .update({ available_slots: Math.max(0, bookingLot.availableSlots - 1) })
          .eq('id', bookingLot.id);
      }

      console.log('Booking confirmed:', booking);

      const message = encodeURIComponent(
        `*New Booking Alert!* 🚗\n\n` +
        `*User:* ${booking.customerName}\n` +
        `*Parking Lot:* ${bookingLot?.name}\n` +
        `🚗 Vehicle: ${booking.vehicleNumber}\n` +
        `⏰ Duration: ${booking.duration} hours\n` +
        `💰 Total: $${(bookingLot?.pricePerHour || 0) * booking.duration}\n\n` +
        `See you soon!`
      );

      setBookingLot(null);
      toast.success("Booking confirmed! Sending WhatsApp alert to support.");

      const adminNumber = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '916385557932';

      // Open WhatsApp with admin number
      window.open(`https://wa.me/${adminNumber.replace(/\D/g, '')}?text=${message}`, '_blank');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete booking';
      console.error('Error booking:', err);
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
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
                  parkingLots={filteredLots}
                  selectedLot={selectedLot}
                  onSelectLot={setSelectedLot}
                  userLocation={userLocation}
                />
              </div>

              {/* Parking List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <h3 className="font-display text-lg font-semibold text-foreground sticky top-0 bg-background py-2">
                  {isLoading ? 'Searching...' : `${filteredLots.length} Parking Locations`}
                </h3>

                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                  ))
                ) : filteredLots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No parking lots found matching your search.</p>
                  </div>
                ) : (
                  filteredLots.map(lot => (
                    <ParkingLotCard
                      key={lot.id}
                      lot={lot}
                      isSelected={selectedLot?.id === lot.id}
                      onSelect={() => setSelectedLot(lot)}
                      onBook={() => setBookingLot(lot)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Driving Mode Section */}
        <DrivingMode
          parkingLots={parkingLots}
          onSelectLot={(lot) => {
            setSelectedLot(lot);
            setBookingLot(lot);
          }}
        />

        {/* My Bookings Section */}
        <section id="bookings" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                My Bookings
              </h2>
              <p className="text-muted-foreground">
                Manage your active and past parking reservations
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {isLoadingBookings ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : userBookings.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-2xl border border-dashed border-border">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No bookings found</h3>
                  <p className="text-muted-foreground mb-6">You haven't made any parking reservations yet.</p>
                  <Button variant="hero" onClick={() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' })}>
                    Find Parking Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div key={booking.id} className="p-6 rounded-xl bg-card border border-border flex flex-col md:flex-row justify-between items-center gap-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{booking.parking_lot_name}</h4>
                          <p className="text-sm text-muted-foreground">Slot: {booking.slot_id} • {new Date(booking.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-lg text-primary">${booking.total_price}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'active' ? 'bg-available/20 text-available' : 'bg-secondary text-muted-foreground'}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
                  Get in <span className="gradient-text">Touch</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Have questions about our parking network or need technical support?
                  Our team is here to help you 24/7.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">6385557932</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">sivabalas557@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-border">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                    <Input
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your Name"
                      className="bg-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="email@example.com"
                      className="bg-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                    <Textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we help?"
                      className="bg-secondary"
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmittingContact}>
                    {isSubmittingContact ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
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
          isLoading={isBooking}
          onClose={() => setBookingLot(null)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
};

export default Index;
