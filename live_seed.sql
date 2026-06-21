-- CoRide Live Database Seeding Script
-- Copy and run this script in your Supabase SQL Editor to seed the test accounts:
-- admin@coride.io, alex@coride.io, sarah@coride.io, marcus@coride.io (all passwords are "password123").

-- 1. Enable pgcrypto extension for bcrypt password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add is_banned column to public.profiles if it does not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean default false;

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
UPDATE public.profiles SET role = 'driver', is_verified = true, vehicle_info = 'Tesla Model 3 (Midnight Silver)', is_banned = false WHERE email = 'alex@coride.io';
UPDATE public.profiles SET role = 'passenger', is_verified = true, is_banned = false WHERE email = 'sarah@coride.io';
UPDATE public.profiles SET role = 'driver', is_verified = false, vehicle_info = 'Toyota Prius (Emerald Green)', is_banned = false WHERE email = 'marcus@coride.io';

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
