import type {
  DailyLottery,
  NewReservation,
  Reservation,
  RestaurantSettings,
  WaitlistEntry,
  WaitlistService,
} from './types';

const STORAGE_KEY = 'waitlist-mock-v1';

type Store = {
  entries: WaitlistEntry[];
  reservations: Reservation[];
  lottery: DailyLottery | null;
  settings: RestaurantSettings;
};

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function lucky(): number {
  return Math.floor(Math.random() * 99) + 1;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function defaultStore(): Store {
  return {
    entries: [],
    reservations: [],
    lottery: null,
    settings: {
      id: 1,
      restaurant_name: 'Sawasdee',
      table_count: 12,
      default_wait_estimate: 15,
      buddha_blessing_threshold: 30,
    },
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed.settings) parsed.settings = defaultStore().settings;
    return { ...defaultStore(), ...parsed };
  } catch {
    return defaultStore();
  }
}

export class MockService implements WaitlistService {
  private store: Store = load();
  private delayMs = 0;

  withDelay(ms: number): this {
    this.delayMs = ms;
    return this;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch {
      // ignore quota errors in tests
    }
  }

  private async tick<T>(value: T): Promise<T> {
    if (this.delayMs > 0) await new Promise((r) => setTimeout(r, this.delayMs));
    return value;
  }

  reset(seed?: Partial<Store>): void {
    this.store = { ...defaultStore(), ...seed };
    this.persist();
  }

  async listEntries(): Promise<WaitlistEntry[]> {
    return this.tick([...this.store.entries].sort((a, b) => a.joined_at.localeCompare(b.joined_at)));
  }

  async addParty(name: string, partySize: number, phone: string, notes: string): Promise<WaitlistEntry> {
    if (!name.trim()) throw new Error('Name is required');
    const entry: WaitlistEntry = {
      id: uid(),
      name: name.trim(),
      party_size: partySize,
      phone: phone || null,
      status: 'waiting',
      table_number: null,
      lucky_number: lucky(),
      spice_roulette: null,
      joined_at: new Date().toISOString(),
      seated_at: null,
      wait_minutes: null,
      notes: notes || null,
    };
    this.store.entries.push(entry);
    this.persist();
    return this.tick(entry);
  }

  async seatParty(entry: WaitlistEntry): Promise<WaitlistEntry> {
    const found = this.store.entries.find((e) => e.id === entry.id);
    if (!found) throw new Error('Entry not found');
    const waitMinutes = Math.max(0, Math.floor((Date.now() - new Date(found.joined_at).getTime()) / 60000));
    found.status = 'seated';
    found.table_number = entry.table_number ?? found.table_number;
    found.seated_at = new Date().toISOString();
    found.wait_minutes = waitMinutes;
    this.persist();
    return this.tick({ ...found });
  }

  async completeParty(id: string): Promise<WaitlistEntry> {
    const found = this.store.entries.find((e) => e.id === id);
    if (!found) throw new Error('Entry not found');
    found.status = 'completed';
    this.persist();
    return this.tick({ ...found });
  }

  async noShowParty(id: string): Promise<WaitlistEntry> {
    const found = this.store.entries.find((e) => e.id === id);
    if (!found) throw new Error('Entry not found');
    found.status = 'no_show';
    this.persist();
    return this.tick({ ...found });
  }

  async removeEntry(id: string): Promise<void> {
    this.store.entries = this.store.entries.filter((e) => e.id !== id);
    this.persist();
    return this.tick(undefined);
  }

  async setSpice(id: string, result: string): Promise<WaitlistEntry> {
    const found = this.store.entries.find((e) => e.id === id);
    if (!found) throw new Error('Entry not found');
    found.spice_roulette = result;
    this.persist();
    return this.tick({ ...found });
  }

  async getLottery(date: string): Promise<DailyLottery | null> {
    const day = date || today();
    if (this.store.lottery && this.store.lottery.lottery_date === day) return this.tick({ ...this.store.lottery });
    return this.tick(null);
  }

  async drawLottery(winnerId: string, date: string): Promise<DailyLottery> {
    const day = date || today();
    if (this.store.lottery && this.store.lottery.lottery_date === day) {
      this.store.lottery = { ...this.store.lottery, winner_entry_id: winnerId, drawn_at: new Date().toISOString() };
    } else {
      this.store.lottery = {
        id: uid(),
        lottery_date: day,
        winner_entry_id: winnerId,
        drawn_at: new Date().toISOString(),
        lucky_number: lucky(),
      };
    }
    this.persist();
    return this.tick({ ...this.store.lottery });
  }

  async getSettings(): Promise<RestaurantSettings> {
    return this.tick({ ...this.store.settings });
  }

  async saveSettings(settings: RestaurantSettings): Promise<RestaurantSettings> {
    this.store.settings = { ...settings, id: 1 };
    this.persist();
    return this.tick({ ...this.store.settings });
  }

  async listReservations(): Promise<Reservation[]> {
    return this.tick(
      [...this.store.reservations].sort((a, b) =>
        `${a.reservation_date} ${a.reservation_time}`.localeCompare(`${b.reservation_date} ${b.reservation_time}`),
      ),
    );
  }

  async addReservation(data: NewReservation): Promise<Reservation> {
    if (!data.name.trim()) throw new Error('Name is required');
    const res: Reservation = {
      id: uid(),
      name: data.name.trim(),
      party_size: data.party_size,
      phone: data.phone || null,
      reservation_date: data.reservation_date,
      reservation_time: data.reservation_time,
      status: 'confirmed',
      table_number: data.table_number,
      notes: data.notes || null,
      lucky_number: lucky(),
      created_at: new Date().toISOString(),
    };
    this.store.reservations.push(res);
    this.persist();
    return this.tick(res);
  }

  async seatReservation(res: Reservation): Promise<{ reservation: Reservation; entry: WaitlistEntry }> {
    const found = this.store.reservations.find((r) => r.id === res.id);
    if (!found) throw new Error('Reservation not found');
    found.status = 'seated';
    found.table_number = res.table_number ?? found.table_number;
    const entry: WaitlistEntry = {
      id: uid(),
      name: found.name,
      party_size: found.party_size,
      phone: found.phone,
      status: 'seated',
      table_number: found.table_number,
      lucky_number: lucky(),
      spice_roulette: null,
      joined_at: new Date().toISOString(),
      seated_at: new Date().toISOString(),
      wait_minutes: 0,
      notes: found.notes ? `Reservation ${found.reservation_time}. ${found.notes}` : `Reservation ${found.reservation_time}`,
    };
    this.store.entries.push(entry);
    this.persist();
    return this.tick({ reservation: { ...found }, entry });
  }

  async cancelReservation(id: string): Promise<Reservation> {
    const found = this.store.reservations.find((r) => r.id === id);
    if (!found) throw new Error('Reservation not found');
    found.status = 'cancelled';
    this.persist();
    return this.tick({ ...found });
  }

  async removeReservation(id: string): Promise<void> {
    this.store.reservations = this.store.reservations.filter((r) => r.id !== id);
    this.persist();
    return this.tick(undefined);
  }
}
