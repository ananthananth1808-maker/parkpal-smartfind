import { ParkingLot, ParkingSlot } from '@/types/parking';

export const mockParkingLots: ParkingLot[] = [
  {
    id: '1',
    name: 'City Center Parking',
    address: '123 Main Street, Downtown',
    lat: 40.7128,
    lng: -74.006,
    totalSlots: 150,
    availableSlots: 45,
    pricePerHour: 5,
    distance: 0.3,
    rating: 4.5,
    hasCamera: true,
  },
  {
    id: '2',
    name: 'Mall Parking Complex',
    address: '456 Shopping Ave, Central',
    lat: 40.7148,
    lng: -74.008,
    totalSlots: 300,
    availableSlots: 120,
    pricePerHour: 4,
    distance: 0.5,
    rating: 4.2,
    hasCamera: true,
  },
  {
    id: '3',
    name: 'Airport Parking Zone',
    address: '789 Airport Blvd',
    lat: 40.7168,
    lng: -74.012,
    totalSlots: 500,
    availableSlots: 200,
    pricePerHour: 8,
    distance: 2.1,
    rating: 4.8,
    hasCamera: true,
  },
  {
    id: '4',
    name: 'Tech Park Garage',
    address: '321 Innovation Drive',
    lat: 40.7108,
    lng: -74.004,
    totalSlots: 200,
    availableSlots: 15,
    pricePerHour: 6,
    distance: 0.8,
    rating: 4.6,
    hasCamera: true,
  },
  {
    id: '5',
    name: 'Riverside Parking',
    address: '555 River Road',
    lat: 40.7098,
    lng: -74.010,
    totalSlots: 100,
    availableSlots: 0,
    pricePerHour: 3,
    distance: 1.2,
    rating: 3.9,
    hasCamera: false,
  },
];

export const generateSlotsForLot = (lotId: string, totalSlots: number): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];
  const floors = Math.ceil(totalSlots / 50);
  
  for (let i = 0; i < totalSlots; i++) {
    const floor = Math.floor(i / 50) + 1;
    const slotNum = (i % 50) + 1;
    const random = Math.random();
    
    slots.push({
      id: `${lotId}-slot-${i}`,
      lotId,
      slotNumber: `${String.fromCharCode(64 + floor)}${slotNum.toString().padStart(2, '0')}`,
      floor,
      status: random > 0.7 ? 'available' : random > 0.1 ? 'occupied' : 'reserved',
      vehicleType: random > 0.8 ? 'ev' : random > 0.1 ? 'car' : 'motorcycle',
    });
  }
  
  return slots;
};
