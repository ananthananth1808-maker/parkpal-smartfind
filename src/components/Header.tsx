import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { Session } from '@supabase/supabase-js';

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: 'Parking booked successfully',
      time: '2 min ago',
      isRead: false,
    },
    {
      id: 2,
      message: 'New spot available nearby',
      time: '10 min ago',
      isRead: false,
    },
    {
      id: 3,
      message: 'Booking reminder: starts in 30 minutes',
      time: '1 hr ago',
      isRead: true,
    },
  ]);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    toast.success('All notifications marked as read');
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
            <div className="relative" ref={notificationRef}>
              <Button variant="ghost" size="icon" className="relative" onClick={handleNotifications}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center leading-none">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-[70] overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                    <span className="text-xs text-gray-500">{notifications.length} total</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                            notification.isRead ? 'bg-white' : 'bg-primary/5'
                          }`}
                        >
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-3 py-3 border-t border-gray-100 bg-gray-50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                      onClick={handleMarkAllAsRead}
                      disabled={notifications.length === 0 || unreadCount === 0}
                    >
                      Mark all as read
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
