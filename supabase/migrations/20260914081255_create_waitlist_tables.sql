/*
# Thai Restaurant Waitlist Manager

## Overview
Creates tables for a small Thai restaurant waitlist app with quirky features:
Golden Table Lottery (daily free meal), Lucky Numbers, Spice Roulette, and Buddha's Patience Blessing.

## New Tables

### waitlist_entries
- id (uuid, primary key)
- name (text, party contact name)
- party_size (int, number of guests)
- phone (text, optional contact)
- status (text: 'waiting' | 'seated' | 'completed' | 'no_show')
- table_number (int, nullable, assigned when seated)
- lucky_number (int, 1-99, fortune-style number assigned on join)
- spice_roulette (text, nullable: result of spice roulette when seated)
- joined_at (timestamptz, when they joined the waitlist)
- seated_at (timestamptz, when they were seated)
- wait_minutes (int, nullable, computed wait time in minutes)
- notes (text, optional special requests)

### daily_lottery
- id (uuid, primary key)
- lottery_date (date, unique per day)
- winner_entry_id (uuid, nullable, FK to waitlist_entries)
- drawn_at (timestamptz, when the lottery was drawn)
- lucky_number (int, 1-99, the daily lucky number)

## Security
- Single-tenant app (no sign-in). RLS enabled on all tables.
- Anon + authenticated can CRUD all data (shared restaurant tool).
*/

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  party_size int NOT NULL DEFAULT 2 CHECK (party_size >= 1 AND party_size <= 20),
  phone text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'seated', 'completed', 'no_show')),
  table_number int CHECK (table_number IS NULL OR (table_number >= 1 AND table_number <= 30)),
  lucky_number int NOT NULL DEFAULT floor(random() * 99 + 1)::int CHECK (lucky_number >= 1 AND lucky_number <= 99),
  spice_roulette text CHECK (spice_roulette IS NULL OR spice_roulette IN ('Mild', 'Medium', 'Hot', 'Fire', 'Volcano')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  seated_at timestamptz,
  wait_minutes int,
  notes text
);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_waitlist" ON waitlist_entries;
CREATE POLICY "anon_select_waitlist" ON waitlist_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist_entries;
CREATE POLICY "anon_insert_waitlist" ON waitlist_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_waitlist" ON waitlist_entries;
CREATE POLICY "anon_update_waitlist" ON waitlist_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_waitlist" ON waitlist_entries;
CREATE POLICY "anon_delete_waitlist" ON waitlist_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS daily_lottery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_date date NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  winner_entry_id uuid REFERENCES waitlist_entries(id) ON DELETE SET NULL,
  drawn_at timestamptz,
  lucky_number int NOT NULL DEFAULT floor(random() * 99 + 1)::int CHECK (lucky_number >= 1 AND lucky_number <= 99)
);

ALTER TABLE daily_lottery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lottery" ON daily_lottery;
CREATE POLICY "anon_select_lottery" ON daily_lottery FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lottery" ON daily_lottery;
CREATE POLICY "anon_insert_lottery" ON daily_lottery FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lottery" ON daily_lottery;
CREATE POLICY "anon_update_lottery" ON daily_lottery FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lottery" ON daily_lottery;
CREATE POLICY "anon_delete_lottery" ON daily_lottery FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at ON waitlist_entries(joined_at);
