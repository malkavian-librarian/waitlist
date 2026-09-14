/*
# Add Restaurant Settings and Reservations

## Overview
Adds two new tables: a single-row restaurant settings table (table count, name, etc.)
and a reservations table for advance bookings.

## New Tables

### restaurant_settings
- id (int, primary key, always 1 — singleton row)
- restaurant_name (text, default 'Sawasdee')
- table_count (int, default 12, max 50)
- default_wait_estimate (int, minutes, default 15)
- buddha_blessing_threshold (int, minutes, default 30)

### reservations
- id (uuid, primary key)
- name (text, party contact name)
- party_size (int, number of guests)
- phone (text, optional)
- reservation_date (date, the day of the reservation)
- reservation_time (time, the time of the reservation)
- status (text: 'confirmed' | 'seated' | 'cancelled' | 'no_show')
- table_number (int, nullable, pre-assigned table)
- notes (text, optional)
- lucky_number (int, 1-99, assigned on creation)
- created_at (timestamptz)

## Security
- Single-tenant app (no sign-in). RLS enabled on all tables.
- Anon + authenticated can CRUD all data.
*/

CREATE TABLE IF NOT EXISTS restaurant_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  restaurant_name text NOT NULL DEFAULT 'Sawasdee',
  table_count int NOT NULL DEFAULT 12 CHECK (table_count >= 1 AND table_count <= 50),
  default_wait_estimate int NOT NULL DEFAULT 15 CHECK (default_wait_estimate >= 0 AND default_wait_estimate <= 120),
  buddha_blessing_threshold int NOT NULL DEFAULT 30 CHECK (buddha_blessing_threshold >= 5 AND buddha_blessing_threshold <= 120)
);

ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON restaurant_settings;
CREATE POLICY "anon_select_settings" ON restaurant_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON restaurant_settings;
CREATE POLICY "anon_insert_settings" ON restaurant_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON restaurant_settings;
CREATE POLICY "anon_update_settings" ON restaurant_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON restaurant_settings;
CREATE POLICY "anon_delete_settings" ON restaurant_settings FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO restaurant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  party_size int NOT NULL DEFAULT 2 CHECK (party_size >= 1 AND party_size <= 20),
  phone text,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'cancelled', 'no_show')),
  table_number int,
  notes text,
  lucky_number int NOT NULL DEFAULT floor(random() * 99 + 1)::int CHECK (lucky_number >= 1 AND lucky_number <= 99),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reservations" ON reservations;
CREATE POLICY "anon_select_reservations" ON reservations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reservations" ON reservations;
CREATE POLICY "anon_insert_reservations" ON reservations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reservations" ON reservations;
CREATE POLICY "anon_update_reservations" ON reservations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reservations" ON reservations;
CREATE POLICY "anon_delete_reservations" ON reservations FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
