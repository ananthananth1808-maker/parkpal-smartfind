-- Create parking_lots table
CREATE TABLE public.parking_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  available_slots INTEGER NOT NULL DEFAULT 0,
  price_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 0,
  distance_info DECIMAL(10, 2), -- Mock distance info for the UI
  rating DECIMAL(2, 1) DEFAULT 0,
  has_camera BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parking_slots table
CREATE TABLE public.parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE NOT NULL,
  slot_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available', -- available, occupied, reserved
  vehicle_type TEXT NOT NULL DEFAULT 'car', -- car, ev, motorcycle
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;

-- Policies for parking_lots (Allow anyone to read)
CREATE POLICY "Anyone can view parking lots"
ON public.parking_lots FOR SELECT
USING (true);

-- Policies for parking_slots (Allow anyone to read)
CREATE POLICY "Anyone can view parking slots"
ON public.parking_slots FOR SELECT
USING (true);

-- Seed data for parking_lots
INSERT INTO public.parking_lots (name, address, lat, lng, total_slots, available_slots, price_per_hour, distance_info, rating, has_camera)
VALUES 
('City Center Parking', '123 Main Street, Downtown', 40.7128, -74.006, 150, 45, 5, 0.3, 4.5, true),
('Mall Parking Complex', '456 Shopping Ave, Central', 40.7148, -74.008, 300, 120, 4, 0.5, 4.2, true),
('Airport Parking Zone', '789 Airport Blvd', 40.7168, -74.012, 500, 200, 8, 2.1, 4.8, true),
('Tech Park Garage', '321 Innovation Drive', 40.7108, -74.004, 200, 15, 6, 0.8, 4.6, true),
('Riverside Parking', '555 River Road', 40.7098, -74.010, 100, 0, 3, 1.2, 3.9, false);

-- Function to update updated_at for parking tables
CREATE TRIGGER update_parking_lots_updated_at
BEFORE UPDATE ON public.parking_lots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_slots_updated_at
BEFORE UPDATE ON public.parking_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
