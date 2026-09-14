import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WaitlistEntry = {
  id: string;
  name: string;
  party_size: number;
  phone: string | null;
  status: 'waiting' | 'seated' | 'completed' | 'no_show';
  table_number: number | null;
  lucky_number: number;
  spice_roulette: string | null;
  joined_at: string;
  seated_at: string | null;
  wait_minutes: number | null;
  notes: string | null;
};

export type DailyLottery = {
  id: string;
  lottery_date: string;
  winner_entry_id: string | null;
  drawn_at: string | null;
  lucky_number: number;
};

export type RestaurantSettings = {
  id: number;
  restaurant_name: string;
  table_count: number;
  default_wait_estimate: number;
  buddha_blessing_threshold: number;
};

export type Reservation = {
  id: string;
  name: string;
  party_size: number;
  phone: string | null;
  reservation_date: string;
  reservation_time: string;
  status: 'confirmed' | 'seated' | 'cancelled' | 'no_show';
  table_number: number | null;
  notes: string | null;
  lucky_number: number;
  created_at: string;
};
