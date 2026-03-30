-- CONSOLIDATED DATABASE SCHEMA
-- This migration consolidates all previous migrations to fix schema conflicts
-- Replaces: 20260121132903_dfed14a8-74a9-4e5a-9841-11210498f6f7.sql and 20260126000000_create_parking_tables.sql

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UTILITY FUNCTIONS
-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE TABLES (using IF NOT EXISTS to handle idempotency)

-- Profiles table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parking lots table
CREATE TABLE IF NOT EXISTS public.parking_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
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

-- Parking slots table
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

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings table (with correct schema)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE SET NULL,
  parking_lot_name TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_number TEXT NOT NULL,
  customer_name TEXT,
  duration_hours INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  booking_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (to avoid conflicts on re-run)
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    
    -- Vehicles
    DROP POLICY IF EXISTS "Users can view their own vehicles" ON public.vehicles;
    DROP POLICY IF EXISTS "Users can insert their own vehicles" ON public.vehicles;
    DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
    DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;
    
    -- Bookings
    DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
    
    -- Parking Lots
    DROP POLICY IF EXISTS "Anyone can view parking lots" ON public.parking_lots;
    DROP POLICY IF EXISTS "Public Read Access" ON public.parking_lots;
    DROP POLICY IF EXISTS "Anyone can update parking lots" ON public.parking_lots;
    
    -- Parking Slots
    DROP POLICY IF EXISTS "Anyone can view parking slots" ON public.parking_slots;
    DROP POLICY IF EXISTS "Public Read Access" ON public.parking_slots;
END $$ 
LANGUAGE plpgsql;

-- 5. CREATE RLS POLICIES

-- Profiles policies
CREATE POLICY "profiles_user_own_view"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "profiles_user_own_insert"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_user_own_update"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Vehicles policies
CREATE POLICY "vehicles_user_own_view"
ON public.vehicles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "vehicles_user_own_insert"
ON public.vehicles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicles_user_own_update"
ON public.vehicles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "vehicles_user_own_delete"
ON public.vehicles FOR DELETE
USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "bookings_user_own_view"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "bookings_user_own_insert"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "bookings_user_own_update"
ON public.bookings FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Parking Lots policies (public read)
CREATE POLICY "parking_lots_public_view"
ON public.parking_lots FOR SELECT
USING (true);

-- Parking Slots policies (public read)
CREATE POLICY "parking_slots_public_view"
ON public.parking_slots FOR SELECT
USING (true);

-- 6. CREATE TRIGGERS FOR updated_at

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_parking_lots_updated_at ON public.parking_lots;
DROP TRIGGER IF EXISTS update_parking_slots_updated_at ON public.parking_slots;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_lots_updated_at
BEFORE UPDATE ON public.parking_lots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_slots_updated_at
BEFORE UPDATE ON public.parking_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. SEED DATA (optional - only insert if tables are empty)
INSERT INTO public.parking_lots (name, address, lat, lng, total_slots, available_slots, price_per_hour, distance_info, rating, has_camera)
VALUES 
('City Center Parking', '123 Main Street, Downtown', 40.7128, -74.006, 150, 45, 5, 0.3, 4.5, true),
('Mall Parking Complex', '456 Shopping Ave, Central', 40.7148, -74.008, 300, 120, 4, 0.5, 4.2, true),
('Airport Parking Zone', '789 Airport Blvd', 40.7168, -74.012, 500, 200, 8, 2.1, 4.8, true),
('Tech Park Garage', '321 Innovation Drive', 40.7108, -74.004, 200, 15, 6, 0.8, 4.6, true),
('Riverside Parking', '555 River Road', 40.7098, -74.010, 100, 0, 3, 1.2, 3.9, false)
ON CONFLICT (name) DO NOTHING;
