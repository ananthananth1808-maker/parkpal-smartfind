-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLES
-- Create parking_lots table
CREATE TABLE IF NOT EXISTS public.parking_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  available_slots INTEGER NOT NULL DEFAULT 0,
  price_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 0,
  distance_info DECIMAL(10, 2),
  rating DECIMAL(2, 1) DEFAULT 0,
  has_camera BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parking_slots table
CREATE TABLE IF NOT EXISTS public.parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE NOT NULL,
  slot_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available',
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE SET NULL,
  parking_lot_name TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. SECURITY & POLICIES
-- Enable RLS
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Access" ON public.parking_lots;
DROP POLICY IF EXISTS "Public Read Access" ON public.parking_slots;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can edit own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;

-- Create new policies
CREATE POLICY "Public Read Access" ON public.parking_lots FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.parking_slots FOR SELECT USING (true);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can edit own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);

-- 4. TRIGGERS
DROP TRIGGER IF EXISTS update_parking_lots_updated_at ON public.parking_lots;
CREATE TRIGGER update_parking_lots_updated_at
BEFORE UPDATE ON public.parking_lots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parking_slots_updated_at ON public.parking_slots;
CREATE TRIGGER update_parking_slots_updated_at
BEFORE UPDATE ON public.parking_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. SEED DATA
DELETE FROM public.parking_lots;
INSERT INTO public.parking_lots (name, address, lat, lng, total_slots, available_slots, price_per_hour, distance_info, rating, has_camera)
VALUES 
('City Center Parking', '123 Main Street, Downtown', 40.7128, -74.006, 150, 45, 5, 0.3, 4.5, true),
('Mall Parking Complex', '456 Shopping Ave, Central', 40.7148, -74.008, 300, 120, 4, 0.5, 4.2, true),
('Airport Parking Zone', '789 Airport Blvd', 40.7168, -74.012, 500, 200, 8, 2.1, 4.8, true),
('Tech Park Garage', '321 Innovation Drive', 40.7108, -74.004, 200, 15, 6, 0.8, 4.6, true),
('Riverside Parking', '555 River Road', 40.7098, -74.010, 100, 0, 3, 1.2, 3.9, false);
