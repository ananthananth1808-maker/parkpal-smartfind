export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  distance?: number;
  rating: number;
  hasCamera: boolean;
  imageUrl?: string;
}

export interface ParkingSlot {
  id: string;
  lotId: string;
  slotNumber: string;
  floor: number;
  status: 'available' | 'occupied' | 'reserved';
  vehicleType: 'car' | 'motorcycle' | 'ev';
}

export interface Booking {
  id: string;
  lotId: string;
  slotId: string;
  userId: string;
  vehicleNumber: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  whatsappNumber?: string;
  totalAmount: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  heading?: number;
}
