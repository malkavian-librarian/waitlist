import type {
  DailyLottery,
  NewReservation,
  Reservation,
  RestaurantSettings,
  WaitlistEntry,
  WaitlistService,
} from './types';

function baseUrl(): string {
  const url = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';
  return url.replace(/\/$/, '');
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export class ApiService implements WaitlistService {
  async listEntries(): Promise<WaitlistEntry[]> {
    return req<WaitlistEntry[]>('/api/waitlist');
  }

  async addParty(name: string, partySize: number, phone: string, notes: string): Promise<WaitlistEntry> {
    return req<WaitlistEntry>('/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ name, party_size: partySize, phone: phone || null, notes: notes || null }),
    });
  }

  async seatParty(entry: WaitlistEntry): Promise<WaitlistEntry> {
    return req<WaitlistEntry>(`/api/waitlist/${entry.id}/seat`, {
      method: 'PATCH',
      body: JSON.stringify({ table_number: entry.table_number }),
    });
  }

  async completeParty(id: string): Promise<WaitlistEntry> {
    return req<WaitlistEntry>(`/api/waitlist/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
  }

  async noShowParty(id: string): Promise<WaitlistEntry> {
    return req<WaitlistEntry>(`/api/waitlist/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'no_show' }),
    });
  }

  async removeEntry(id: string): Promise<void> {
    await req<void>(`/api/waitlist/${id}`, { method: 'DELETE' });
  }

  async setSpice(id: string, result: string): Promise<WaitlistEntry> {
    return req<WaitlistEntry>(`/api/waitlist/${id}/spice`, {
      method: 'PATCH',
      body: JSON.stringify({ result }),
    });
  }

  async getLottery(date: string): Promise<DailyLottery | null> {
    return req<DailyLottery | null>(`/api/lottery?lottery_date=${encodeURIComponent(date)}`);
  }

  async drawLottery(winnerId: string, date: string): Promise<DailyLottery> {
    return req<DailyLottery>('/api/lottery/draw', {
      method: 'POST',
      body: JSON.stringify({ winner_entry_id: winnerId, lottery_date: date }),
    });
  }

  async getSettings(): Promise<RestaurantSettings> {
    return req<RestaurantSettings>('/api/settings');
  }

  async saveSettings(settings: RestaurantSettings): Promise<RestaurantSettings> {
    return req<RestaurantSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async listReservations(): Promise<Reservation[]> {
    return req<Reservation[]>('/api/reservations');
  }

  async addReservation(data: NewReservation): Promise<Reservation> {
    return req<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        party_size: data.party_size,
        phone: data.phone || null,
        reservation_date: data.reservation_date,
        reservation_time: data.reservation_time,
        notes: data.notes || null,
        table_number: data.table_number,
      }),
    });
  }

  async seatReservation(res: Reservation): Promise<{ reservation: Reservation; entry: WaitlistEntry }> {
    const out = await req<{ reservation: Reservation; waitlist_entry: WaitlistEntry }>(
      `/api/reservations/${res.id}/seat`,
      { method: 'POST', body: JSON.stringify({ table_number: res.table_number }) },
    );
    return { reservation: out.reservation, entry: out.waitlist_entry };
  }

  async cancelReservation(id: string): Promise<Reservation> {
    return req<Reservation>(`/api/reservations/${id}/cancel`, { method: 'PATCH' });
  }

  async removeReservation(id: string): Promise<void> {
    await req<void>(`/api/reservations/${id}`, { method: 'DELETE' });
  }
}
