-- CoRide Database Schema for Supabase / PostgreSQL
-- Run this script in your Supabase SQL Editor to set up tables, RLS policies, and triggers.

-- 1. PROFILES TABLE (linked to Supabase auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    role text not null check (role in ('driver', 'passenger', 'admin')),
    avatar text,
    rating numeric(3,2) default 5.00 check (rating >= 1.00 and rating <= 5.00),
    trips_count integer default 0 check (trips_count >= 0),
    is_verified boolean default false,
    is_banned boolean default false,
    vehicle_info text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
on public.profiles for select using (true);

create policy "Users can update their own profile" 
on public.profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
on public.profiles for update using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can delete any profile"
on public.profiles for delete using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- 2. TRIPS TABLE
create table public.trips (
    id uuid default gen_random_uuid() primary key,
    driver_id uuid references public.profiles(id) on delete cascade not null,
    origin text not null,
    destination text not null,
    departure_time timestamp with time zone not null,
    seats_total integer not null check (seats_total > 0),
    seats_available integer not null check (seats_available >= 0),
    price numeric(10,2) not null check (price >= 0),
    preferences jsonb default '{}'::jsonb not null, -- pets, smoking, music, conversation
    route_coordinates jsonb not null, -- array of [lat, lng] coordinates
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint seats_check check (seats_available <= seats_total)
);

alter table public.trips enable row level security;

create policy "Trips are viewable by everyone" 
on public.trips for select using (true);

create policy "Drivers can insert their own trips" 
on public.trips for insert with check (auth.uid() = driver_id);

create policy "Drivers can update their own trips" 
on public.trips for update using (auth.uid() = driver_id);

create policy "Drivers can delete their own trips" 
on public.trips for delete using (auth.uid() = driver_id);

-- 3. BOOKINGS TABLE
create table public.bookings (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    passenger_id uuid references public.profiles(id) on delete cascade not null,
    status text default 'pending' not null check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (trip_id, passenger_id) -- prevent double booking same trip
);

alter table public.bookings enable row level security;

create policy "Bookings are viewable by trip drivers and booking passengers"
on public.bookings for select using (
    auth.uid() = passenger_id or 
    auth.uid() = (select driver_id from public.trips where id = trip_id)
);

create policy "Passengers can create bookings"
on public.bookings for insert with check (auth.uid() = passenger_id);

create policy "Passengers/Drivers can update bookings"
on public.bookings for update using (
    auth.uid() = passenger_id or 
    auth.uid() = (select driver_id from public.trips where id = trip_id)
);

-- 4. SUBSIDIES TABLE (Nabogo-inspired)
create table public.subsidies (
    id uuid default gen_random_uuid() primary key,
    driver_id uuid references public.profiles(id) on delete cascade not null,
    trip_id uuid references public.trips(id) on delete cascade not null,
    distance_km numeric(10,2) not null check (distance_km > 0),
    subsidy_amount numeric(10,2) not null check (subsidy_amount >= 0),
    status text default 'pending' not null check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subsidies enable row level security;

create policy "Drivers can view their own subsidies"
on public.subsidies for select using (auth.uid() = driver_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
));

create policy "Admins can manage all subsidies"
on public.subsidies for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
));

-- 5. CAMPUS REWARDS TABLE (PARS-inspired)
create table public.campus_rewards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    points integer default 0 not null check (points >= 0),
    reserved_spot text, -- spot identifier if reserved, null if none
    spot_expires_at timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.campus_rewards enable row level security;

create policy "Users can view and edit their own campus rewards"
on public.campus_rewards for all using (auth.uid() = user_id);

-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGN UP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name, avatar, is_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'passenger'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(
        new.raw_user_meta_data->>'avatar', 
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    ),
    (coalesce(new.raw_user_meta_data->>'role', 'passenger') = 'passenger') -- passengers auto-verified
  );
  
  -- Create campus reward entry
  insert into public.campus_rewards (user_id, points)
  values (new.id, 0);
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. COMPLETED RIDES TABLE (for ratings and feedback)
create table public.completed_rides (
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

-- Enable Row Level Security (RLS)
alter table public.completed_rides enable row level security;

create policy "Users can view completed rides they were part of"
on public.completed_rides for select using (
  auth.uid() = driver_id or auth.uid() = passenger_id
);

create policy "Admins can view all completed rides"
on public.completed_rides for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can insert completed rides"
on public.completed_rides for insert with check (
  auth.uid() = driver_id
);

create policy "Users can update completed rides they were part of"
on public.completed_rides for update using (
  auth.uid() = driver_id or auth.uid() = passenger_id
);
