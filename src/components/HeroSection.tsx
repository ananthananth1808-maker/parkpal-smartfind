import { useState } from 'react';
import { Search, Navigation, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import heroImage from '@/assets/hero-parking.jpg';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const HeroSection = ({ onSearch, searchQuery, setSearchQuery }: HeroSectionProps) => {
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    onSearch(searchQuery);
    setTimeout(() => setIsSearching(false), 500); // Small delay for UX feedback
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Smart Parking"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="slide-up max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Real-time Parking Availability</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Find & Book Parking
            <span className="block gradient-text">In Seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Smart parking made simple. Find available spots, book instantly,
            and get WhatsApp alerts. Live camera feeds show you exactly where to park.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl glass-card">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search location or parking name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-secondary border-0 text-foreground placeholder:text-muted-foreground rounded-xl"
                />
              </div>
              <Button type="submit" variant="hero" size="xl" className="sm:w-auto" disabled={isSearching}>
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
                {isSearching ? 'Searching...' : 'Find Parking'}
              </Button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Parking Locations</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">10k+</p>
              <p className="text-sm text-muted-foreground">Daily Bookings</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">99%</p>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
