import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handleNotifications = () => {
    toast.info("You have 1 new update: Your booking for City Center Parking is confirmed!");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center glow-effect">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Park<span className="text-primary">Smart</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </a>
            <a href="#map" className="text-muted-foreground hover:text-primary transition-colors">
              Find Parking
            </a>
            <a href="#bookings" className="text-muted-foreground hover:text-primary transition-colors">
              My Bookings
            </a>
            <a href="#driving" className="text-muted-foreground hover:text-primary transition-colors">
              Driving Mode
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" onClick={handleNotifications}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Button>
            {session ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="max-w-[100px] truncate">{session.user.email}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="hero"
                size="sm"
                className="hidden sm:flex"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              <a href="/" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                Home
              </a>
              <a href="#map" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                Find Parking
              </a>
              <a href="#bookings" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                My Bookings
              </a>
              <a href="#driving" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                Driving Mode
              </a>
              <a href="#contact" className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                Contact
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
