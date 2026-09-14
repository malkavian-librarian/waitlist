import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockService } from '../mock';

function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k) : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  } as Storage);
}

stubStorage();

const TODAY = new Date().toISOString().split('T')[0];

describe('MockService (services-layer contract)', () => {
  let svc: MockService;
  beforeEach(() => {
    svc = new MockService();
    svc.reset();
  });

  it('adds, lists, seats, spices, completes and removes a party', async () => {
    const added = await svc.addParty('Somchai', 4, '555-01', 'no peanuts');
    expect(added.id).toBeTruthy();
    expect(added.status).toBe('waiting');

    const list = await svc.listEntries();
    expect(list).toHaveLength(1);

    const seated = await svc.seatParty({ ...added, table_number: 5 });
    expect(seated.status).toBe('seated');
    expect(seated.table_number).toBe(5);
    expect(seated.wait_minutes).not.toBeNull();

    const spiced = await svc.setSpice(added.id, 'Hot');
    expect(spiced.spice_roulette).toBe('Hot');

    const done = await svc.completeParty(added.id);
    expect(done.status).toBe('completed');

    await svc.removeEntry(added.id);
    expect(await svc.listEntries()).toHaveLength(0);
  });

  it('marks no-show', async () => {
    const added = await svc.addParty('A', 2, '', '');
    const ns = await svc.noShowParty(added.id);
    expect(ns.status).toBe('no_show');
  });

  it('draws and reads back the daily lottery', async () => {
    expect(await svc.getLottery(TODAY)).toBeNull();
    const entry = await svc.addParty('Lucky', 2, '', '');
    const drawn = await svc.drawLottery(entry.id, TODAY);
    expect(drawn.winner_entry_id).toBe(entry.id);
    expect(drawn.lottery_date).toBe(TODAY);
    const again = await svc.getLottery(TODAY);
    expect(again?.winner_entry_id).toBe(entry.id);
  });

  it('reads and saves settings', async () => {
    const s = await svc.getSettings();
    expect(s.restaurant_name).toBe('Sawasdee');
    const saved = await svc.saveSettings({ ...s, table_count: 20 });
    expect(saved.table_count).toBe(20);
  });

  it('manages reservations including transactional seat', async () => {
    const res = await svc.addReservation({
      name: 'Reserve',
      party_size: 3,
      phone: '',
      reservation_date: TODAY,
      reservation_time: '18:30',
      notes: 'birthday',
      table_number: 7,
    });
    expect(res.status).toBe('confirmed');

    const { reservation, entry } = await svc.seatReservation({ ...res, table_number: 7 });
    expect(reservation.status).toBe('seated');
    expect(entry.status).toBe('seated');
    expect(entry.table_number).toBe(7);
    expect(entry.notes).toContain('18:30');

    const res2 = await svc.addReservation({
      name: 'Cancel Me',
      party_size: 2,
      phone: '',
      reservation_date: TODAY,
      reservation_time: '19:00',
      notes: '',
      table_number: null,
    });
    const cancelled = await svc.cancelReservation(res2.id);
    expect(cancelled.status).toBe('cancelled');
    await svc.removeReservation(res2.id);
    const all = await svc.listReservations();
    expect(all.find((r) => r.id === res2.id)).toBeUndefined();
  });
});
