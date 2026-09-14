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

export type NewReservation = {
  name: string;
  party_size: number;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  notes: string;
  table_number: number | null;
};

export interface WaitlistService {
  listEntries(): Promise<WaitlistEntry[]>;
  addParty(name: string, partySize: number, phone: string, notes: string): Promise<WaitlistEntry>;
  seatParty(entry: WaitlistEntry): Promise<WaitlistEntry>;
  completeParty(id: string): Promise<WaitlistEntry>;
  noShowParty(id: string): Promise<WaitlistEntry>;
  removeEntry(id: string): Promise<void>;
  setSpice(id: string, result: string): Promise<WaitlistEntry>;
  getLottery(date: string): Promise<DailyLottery | null>;
  drawLottery(winnerId: string, date: string): Promise<DailyLottery>;
  getSettings(): Promise<RestaurantSettings>;
  saveSettings(settings: RestaurantSettings): Promise<RestaurantSettings>;
  listReservations(): Promise<Reservation[]>;
  addReservation(data: NewReservation): Promise<Reservation>;
  seatReservation(res: Reservation): Promise<{ reservation: Reservation; entry: WaitlistEntry }>;
  cancelReservation(id: string): Promise<Reservation>;
  removeReservation(id: string): Promise<void>;
}
