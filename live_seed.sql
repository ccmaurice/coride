-- CoRide Live Database Seeding Script
-- Copy and run this script in your Supabase SQL Editor to seed the test accounts:
-- admin@coride.io, alex@coride.io, sarah@coride.io, marcus@coride.io (all passwords are "password123").

-- 1. Enable pgcrypto extension for bcrypt password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add is_banned column and KYC columns to public.profiles if they do not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean default false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_dob text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_id_file text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_license_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_license_expiry text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_license_file text;

-- 3. Clean up any existing conflicting users to ensure a clean slate
DELETE FROM auth.users WHERE email IN ('admin@coride.io', 'alex@coride.io', 'sarah@coride.io', 'marcus@coride.io');

-- 2. Seed Admin User
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd4a4d62f-f4fe-4820-94a2-19e358c21a01', -- Fixed UUID
  'authenticated',
  'authenticated',
  'admin@coride.io',
  crypt('password123', gen_salt('bf')),
  NOW(),
  null,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin","role":"admin","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 3. Seed Driver Alex
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd4a4d62f-f4fe-4820-94a2-19e358c21a02', -- Fixed UUID
  'authenticated',
  'authenticated',
  'alex@coride.io',
  crypt('password123', gen_salt('bf')),
  NOW(),
  null,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alex Mercer","role":"driver","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80","vehicle_info":"Tesla Model 3 (Midnight Silver)"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 4. Seed Passenger Sarah
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd4a4d62f-f4fe-4820-94a2-19e358c21a03', -- Fixed UUID
  'authenticated',
  'authenticated',
  'sarah@coride.io',
  crypt('password123', gen_salt('bf')),
  NOW(),
  null,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sarah Connor","role":"passenger","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 5. Seed Driver Marcus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd4a4d62f-f4fe-4820-94a2-19e358c21a04', -- Fixed UUID
  'authenticated',
  'authenticated',
  'marcus@coride.io',
  crypt('password123', gen_salt('bf')),
  NOW(),
  null,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Marcus Vance","role":"driver","avatar":"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80","vehicle_info":"Toyota Prius (Emerald Green)"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 6. Ensure profile details are fully populated and updated
UPDATE public.profiles SET role = 'admin', is_verified = true, is_banned = false WHERE email = 'admin@coride.io';

UPDATE public.profiles SET 
  role = 'driver', 
  is_verified = true, 
  vehicle_info = 'Tesla Model 3 (Midnight Silver)', 
  is_banned = false,
  kyc_dob = '1995-04-12',
  kyc_id_type = 'license',
  kyc_id_number = 'DL-88776655',
  kyc_id_file = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="100%" height="100%" fill="%231e293b"/><text x="10" y="30" fill="%2338bdf8" font-size="12" font-family="sans-serif">MOCK ID CARD</text><text x="10" y="55" fill="white" font-size="10" font-family="sans-serif">Alex Mercer</text><text x="10" y="75" fill="%2364748b" font-size="8" font-family="sans-serif">ID: DL-88776655</text></svg>',
  kyc_license_number = 'DL-88776655',
  kyc_license_expiry = '2029-08-30',
  kyc_license_file = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="100%" height="100%" fill="%230f172a"/><text x="10" y="30" fill="%2310b981" font-size="12" font-family="sans-serif">DRIVER LICENSE</text><text x="10" y="55" fill="white" font-size="10" font-family="sans-serif">Alex Mercer</text><text x="10" y="75" fill="%2364748b" font-size="8" font-family="sans-serif">Exp: 2029-08-30</text></svg>'
WHERE email = 'alex@coride.io';

UPDATE public.profiles SET 
  role = 'passenger', 
  is_verified = true, 
  is_banned = false,
  kyc_dob = '1998-11-23',
  kyc_id_type = 'passport',
  kyc_id_number = 'PP-99221100',
  kyc_id_file = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="100%" height="100%" fill="%231e293b"/><text x="10" y="30" fill="%2338bdf8" font-size="12" font-family="sans-serif">MOCK ID CARD</text><text x="10" y="55" fill="white" font-size="10" font-family="sans-serif">Sarah Connor</text><text x="10" y="75" fill="%2364748b" font-size="8" font-family="sans-serif">ID: PP-99221100</text></svg>'
WHERE email = 'sarah@coride.io';

UPDATE public.profiles SET 
  role = 'driver', 
  is_verified = false, 
  vehicle_info = 'Toyota Prius (Emerald Green)', 
  is_banned = false,
  kyc_dob = '1992-07-07',
  kyc_id_type = 'national_id',
  kyc_id_number = 'NID-55443322',
  kyc_id_file = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="100%" height="100%" fill="%231e293b"/><text x="10" y="30" fill="%2338bdf8" font-size="12" font-family="sans-serif">MOCK ID CARD</text><text x="10" y="55" fill="white" font-size="10" font-family="sans-serif">Marcus Vance</text><text x="10" y="75" fill="%2364748b" font-size="8" font-family="sans-serif">ID: NID-55443322</text></svg>',
  kyc_license_number = 'DL-33445566',
  kyc_license_expiry = '2028-12-31',
  kyc_license_file = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="100%" height="100%" fill="%230f172a"/><text x="10" y="30" fill="%2310b981" font-size="12" font-family="sans-serif">DRIVER LICENSE</text><text x="10" y="55" fill="white" font-size="10" font-family="sans-serif">Marcus Vance</text><text x="10" y="75" fill="%2364748b" font-size="8" font-family="sans-serif">Exp: 2028-12-31</text></svg>'
WHERE email = 'marcus@coride.io';

-- 7. Add Policies for Superadmin Controls (allows editing & deleting all user records)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Create completed_rides table if it does not exist
CREATE TABLE IF NOT EXISTS public.completed_rides (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid not null,
    driver_id uuid references public.profiles(id) on delete cascade not null,
    driver_name text not null,
    driver_avatar text,
    passenger_id uuid references public.profiles(id) on delete cascade not null,
    passenger_name text not null,
    passenger_avatar text,
    destination text not null,
    departure_time timestamp with time zone not null,
    rated_by_passenger boolean default false,
    rated_by_driver boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on completed_rides
ALTER TABLE public.completed_rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view completed rides they were part of" ON public.completed_rides;
CREATE POLICY "Users can view completed rides they were part of"
ON public.completed_rides FOR SELECT USING (
  auth.uid() = driver_id or auth.uid() = passenger_id
);

DROP POLICY IF EXISTS "Admins can view all completed rides" ON public.completed_rides;
CREATE POLICY "Admins can view all completed rides"
ON public.completed_rides FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

DROP POLICY IF EXISTS "Users can insert completed rides" ON public.completed_rides;
CREATE POLICY "Users can insert completed rides"
ON public.completed_rides FOR INSERT WITH CHECK (
  auth.uid() = driver_id
);

DROP POLICY IF EXISTS "Users can update completed rides they were part of" ON public.completed_rides;
CREATE POLICY "Users can update completed rides they were part of"
ON public.completed_rides FOR UPDATE USING (
  auth.uid() = driver_id or auth.uid() = passenger_id
);

-- 9. Create messages table if it does not exist
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages for bookings they are part of" ON public.messages;
CREATE POLICY "Users can view messages for bookings they are part of"
ON public.messages FOR SELECT USING (
  exists (
    select 1 from public.bookings b
    join public.trips t on b.trip_id = t.id
    where b.id = booking_id and (auth.uid() = b.passenger_id or auth.uid() = t.driver_id)
  )
);

DROP POLICY IF EXISTS "Users can insert messages for bookings they are part of" ON public.messages;
CREATE POLICY "Users can insert messages for bookings they are part of"
ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id and
  exists (
    select 1 from public.bookings b
    join public.trips t on b.trip_id = t.id
    where b.id = booking_id and (auth.uid() = b.passenger_id or auth.uid() = t.driver_id)
  )
);

-- 10. Seed Mock Trips in Kinshasa for Live Testing
DELETE FROM public.trips WHERE id IN ('d4a4d62f-f4fe-4820-94a2-19e358c21b01', 'd4a4d62f-f4fe-4820-94a2-19e358c21b02');

INSERT INTO public.trips (id, driver_id, origin, destination, departure_time, seats_total, seats_available, price, preferences, route_coordinates)
VALUES 
(
  'd4a4d62f-f4fe-4820-94a2-19e358c21b01',
  'd4a4d62f-f4fe-4820-94a2-19e358c21a02', -- Alex Mercer (Driver)
  'Gombe (Centre-ville)',
  'Université de Kinshasa (UNIKIN)',
  NOW() + INTERVAL '4 hours',
  4,
  3,
  2.00,
  '{"pets": true, "smoking": false, "music": "Afrobeats", "conversation": "Friendly"}',
  '[[-4.3032, 15.3120], [-4.3486, 15.3194], [-4.3942, 15.3188], [-4.4172, 15.3124]]'::jsonb
),
(
  'd4a4d62f-f4fe-4820-94a2-19e358c21b02',
  'd4a4d62f-f4fe-4820-94a2-19e358c21a04', -- Marcus Vance (Driver)
  'Aéroport de Ndjili',
  'Gombe (Centre-ville)',
  NOW() + INTERVAL '2 hours',
  3,
  2,
  5.00,
  '{"pets": false, "smoking": false, "music": "Jazz", "conversation": "Quiet"}',
  '[[-4.3856, 15.4439], [-4.3756, 15.3850], [-4.3486, 15.3194], [-4.3032, 15.3120]]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Seed booking for Sarah on Alex's trip
DELETE FROM public.bookings WHERE id = 'd4a4d62f-f4fe-4820-94a2-19e358c21c01';
INSERT INTO public.bookings (id, trip_id, passenger_id, status)
VALUES (
  'd4a4d62f-f4fe-4820-94a2-19e358c21c01',
  'd4a4d62f-f4fe-4820-94a2-19e358c21b01', -- Alex's trip
  'd4a4d62f-f4fe-4820-94a2-19e358c21a03', -- Sarah Connor
  'accepted'
) ON CONFLICT (id) DO NOTHING;
