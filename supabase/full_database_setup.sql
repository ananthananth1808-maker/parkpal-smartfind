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

-- 2. TABLES

-- Create profiles table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parking_lots table
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

-- Create parking_slots table
CREATE TABLE IF NOT EXISTS public.parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE NOT NULL,
  slot_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available', -- available, occupied, reserved
  vehicle_type TEXT NOT NULL DEFAULT 'car', -- car, ev, motorcycle
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for anonymous bookings
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE SET NULL,
  parking_lot_name TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_number TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  customer_name TEXT, -- Added for name tracking
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  booking_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure user_id is nullable if table already existed with NOT NULL
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Ensure parking_lots name is unique for ON CONFLICT
DO $$ 
BEGIN 
    -- 1. Clean up potential duplicates before adding the constraint
    DELETE FROM public.parking_lots
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rnum
            FROM public.parking_lots
        ) t
        WHERE t.rnum > 1
    );

    -- 2. Add the unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parking_lots_name_key') THEN
        ALTER TABLE public.parking_lots ADD CONSTRAINT parking_lots_name_key UNIQUE (name);
    END IF;
END $$;

-- 3. SECURITY & ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on re-run
DO $$ 
BEGIN
    -- Parking Lots
    DROP POLICY IF EXISTS "Public Read Access" ON public.parking_lots;
    DROP POLICY IF EXISTS "Anyone can update parking lots" ON public.parking_lots;
    -- Parking Slots
    DROP POLICY IF EXISTS "Public Read Access" ON public.parking_slots;
    -- Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can edit own profile" ON public.profiles;
    -- Vehicles
    DROP POLICY IF EXISTS "Users can manage own vehicles" ON public.vehicles;
    -- Bookings
    DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
END $$;

-- Create Policies
CREATE POLICY "Public Read Access" ON public.parking_lots FOR SELECT USING (true);
CREATE POLICY "Anyone can update parking lots" ON public.parking_lots FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.parking_slots FOR SELECT USING (true);

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can edit own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- 4. TRIGGERS
-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parking_lots_updated_at ON public.parking_lots;
CREATE TRIGGER update_parking_lots_updated_at BEFORE UPDATE ON public.parking_lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parking_slots_updated_at ON public.parking_slots;
CREATE TRIGGER update_parking_slots_updated_at BEFORE UPDATE ON public.parking_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 5. SEED DATA
-- Insert base data (using ON CONFLICT to avoid duplicates)
INSERT INTO public.parking_lots (name, address, lat, lng, total_slots, available_slots, price_per_hour, distance_info, rating, has_camera)
VALUES 
('City Center Parking', '123 Main Street, Downtown', 40.7128, -74.006, 150, 45, 5, 0.3, 4.5, true),
('Mall Parking Complex', '456 Shopping Ave, Central', 40.7148, -74.008, 300, 120, 4, 0.5, 4.2, true),
('Airport Parking Zone', '789 Airport Blvd', 40.7168, -74.012, 500, 200, 8, 2.1, 4.8, true),
('Tech Park Garage', '321 Innovation Drive', 40.7108, -74.004, 200, 15, 6, 0.8, 4.6, true),
('Riverside Parking', '555 River Road', 40.7098, -74.010, 100, 0, 3, 1.2, 3.9, false)
ON CONFLICT (name) DO NOTHING;
