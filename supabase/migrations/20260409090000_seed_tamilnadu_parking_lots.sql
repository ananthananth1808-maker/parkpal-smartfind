-- Seed Tamil Nadu parking lots for ParkPal map markers
-- Idempotent behavior: remove these lot names first, then reinsert current values.

DELETE FROM public.parking_lots
WHERE name IN (
  'Thiruvengadam SH44 Parking',
  'Kannithavanpatti Parking Hub',
  'Iluppaiyurani Smart Lot',
  'Iluppaiyurani Smart Lot 2',
  'Kamarajapuram Colony Parking',
  'Rajiv Nagar 6th Street Parking',
  'Viswanatham Road Parking',
  'Rotrix Street Sevvalpatti Lot',
  'Maraneri Junction Parking',
  'Bharathi Nagar Parking Point',
  'NRKR Road Bus Stand Parking'
);

INSERT INTO public.parking_lots (
  name,
  address,
  lat,
  lng,
  total_slots,
  available_slots,
  price_per_hour,
  distance_info,
  rating,
  has_camera
)
VALUES
  (
    'Thiruvengadam SH44 Parking',
    '7M5F+WR9, SH 44, Thiruvengadam, Tamil Nadu 627719',
    9.26259,
    77.68075,
    80,
    24,
    30,
    1.1,
    4.3,
    true
  ),
  (
    'Kannithavanpatti Parking Hub',
    '9JJH+XFQ, Kannithavanpatti, Tamil Nadu 626136',
    9.18620,
    77.85720,
    60,
    19,
    25,
    2.8,
    4.1,
    true
  ),
  (
    'Iluppaiyurani Smart Lot',
    '5VGC+XMF, Iluppaiyurani, Kovilpatti, Tamil Nadu 628501',
    9.17120,
    77.88530,
    95,
    33,
    20,
    1.9,
    4.4,
    true
  ),
  (
    'Iluppaiyurani Smart Lot 2',
    '5VGC+XMF, Iluppaiyurani, Kovilpatti, Tamil Nadu 628501',
    9.17180,
    77.88470,
    88,
    30,
    20,
    2.0,
    4.2,
    true
  ),
  (
    'Kamarajapuram Colony Parking',
    'FR65+MW5, National Colony, Kamarajapuram Colony, Sivakasi, Tamil Nadu 626189',
    9.45170,
    77.80430,
    70,
    12,
    35,
    3.5,
    4.0,
    true
  ),
  (
    'Rajiv Nagar 6th Street Parking',
    '5V6F+H4G, Rajiv Nagar 6th St, Rajiv Nagar, Kovilpatti, Tamil Nadu 628501',
    9.17890,
    77.86110,
    55,
    21,
    22,
    2.2,
    4.2,
    true
  ),
  (
    'Viswanatham Road Parking',
    'Viswanatham Rd, near Sankareshwari Process, Maninagar, Kaliappa Nagar, Sivakasi, Tamil Nadu 626123',
    9.42119,
    77.80858,
    120,
    54,
    28,
    1.4,
    4.5,
    true
  ),
  (
    'Rotrix Street Sevvalpatti Lot',
    'Rotrix St, Sevvalpatti, Kovilpatti, Tamil Nadu 628501',
    9.16870,
    77.87360,
    65,
    18,
    18,
    2.7,
    4.0,
    false
  ),
  (
    'Maraneri Junction Parking',
    'CPMW+6J7, Maraneri, Tamil Nadu 626124',
    9.43287,
    77.74685,
    90,
    41,
    24,
    4.2,
    4.1,
    true
  ),
  (
    'Bharathi Nagar Parking Point',
    'Bharathi Nagar, Rengapa Shyam Nagar, Sivakasi, Tamil Nadu 626124',
    9.44158,
    77.55780,
    75,
    27,
    26,
    5.1,
    4.3,
    false
  ),
  (
    'NRKR Road Bus Stand Parking',
    'CQXX+CQ2 bus stand, 158, NRKR Rd, Vadapatti, Sivakasi, Tamil Nadu 626123',
    9.43860,
    77.79910,
    110,
    36,
    32,
    1.8,
    4.4,
    true
  );
