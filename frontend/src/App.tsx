import { useState, useEffect, useCallback } from 'react';
import { service, type WaitlistEntry, type DailyLottery, type RestaurantSettings, type Reservation } from '@/services';
import { getFortuneWaitMessage } from '@/lib/fortunes';
import AddPartyForm from '@/components/AddPartyForm';
import WaitlistCard from '@/components/WaitlistCard';
import SpiceRoulette from '@/components/SpiceRoulette';
import GoldenTableLottery from '@/components/GoldenTableLottery';
import SettingsModal from '@/components/SettingsModal';
import ReservationsPanel from '@/components/ReservationsPanel';
import { UtensilsCrossed, Crown, Clock, Users, Armchair, Sparkles, Star, Settings as SettingsIcon, CalendarDays, ListOrdered } from 'lucide-react';

type Tab = 'waitlist' | 'reservations';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function App() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [lottery, setLottery] = useState<DailyLottery | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLottery, setShowLottery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [spiceEntry, setSpiceEntry] = useState<WaitlistEntry | null>(null);
  const [tab, setTab] = useState<Tab>('waitlist');

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entryData, lotteryData, settingsData, reservationData] = await Promise.all([
        service.listEntries(),
        service.getLottery(todayStr()),
        service.getSettings(),
        service.listReservations(),
      ]);

      setEntries(entryData);
      setLottery(lotteryData);
      setSettings(settingsData);
      setReservations(reservationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tableCount = settings?.table_count ?? 12;
  const blessingThreshold = settings?.buddha_blessing_threshold ?? 30;
  const restaurantName = settings?.restaurant_name ?? 'Sawasdee';

  const handleAdd = async (name: string, partySize: number, phone: string, notes: string) => {
    try {
      const data = await service.addParty(name, partySize, phone, notes);
      setEntries((prev) => [...prev, data]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add party';
      setError(msg);
      throw err;
    }
  };

  const handleSeat = async (entry: WaitlistEntry) => {
    try {
      const data = await service.seatParty(entry);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? data : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seat party');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const data = await service.completeParty(id);
      setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete party');
    }
  };

  const handleNoShow = async (id: string) => {
    try {
      const data = await service.noShowParty(id);
      setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark no-show');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await service.removeEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove entry');
    }
  };

  const handleSpiceResult = async (result: string) => {
    if (!spiceEntry) return;
    try {
      const data = await service.setSpice(spiceEntry.id, result);
      setEntries((prev) => prev.map((e) => (e.id === spiceEntry.id ? data : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save spice result');
    }
    setSpiceEntry(null);
  };

  const handleLotteryDraw = async (winnerId: string) => {
    try {
      const data = await service.drawLottery(winnerId, todayStr());
      setLottery(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw lottery');
      return;
    }
    setShowLottery(false);
    await fetchData();
  };

  const handleSaveSettings = async (newSettings: RestaurantSettings) => {
    try {
      const data = await service.saveSettings(newSettings);
      setSettings(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
      throw err;
    }
  };

  const handleAddReservation = async (data: { name: string; party_size: number; phone: string; reservation_date: string; reservation_time: string; notes: string; table_number: number | null }) => {
    try {
      const result = await service.addReservation({
        name: data.name,
        party_size: data.party_size,
        phone: data.phone,
        reservation_date: data.reservation_date,
        reservation_time: data.reservation_time,
        notes: data.notes,
        table_number: data.table_number,
      });
      setReservations((prev) => [...prev, result]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add reservation';
      setError(msg);
      throw err;
    }
  };

  const handleSeatReservation = async (res: Reservation) => {
    try {
      const { reservation, entry } = await service.seatReservation(res);
      setEntries((prev) => [...prev, entry]);
      setReservations((prev) => prev.map((r) => (r.id === res.id ? reservation : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seat reservation');
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      const data = await service.cancelReservation(id);
      setReservations((prev) => prev.map((r) => (r.id === id ? data : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
    }
  };

  const handleRemoveReservation = async (id: string) => {
    try {
      await service.removeReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove reservation');
    }
  };

  const waiting = entries.filter((e) => e.status === 'waiting');
  const seated = entries.filter((e) => e.status === 'seated');
  const completed = entries.filter((e) => e.status === 'completed' || e.status === 'no_show');
  const eligibleForLottery = seated;
  const lotteryDrawn = lottery?.winner_entry_id != null;
  const dailyLuckyNumber = lottery?.lucky_number ?? null;

  const totalWaiting = waiting.length;
  const totalSeated = seated.length;
  const totalPeople = waiting.reduce((sum, e) => sum + e.party_size, 0);
  const avgWait = waiting.length > 0
    ? Math.round(waiting.reduce((sum, e) => sum + Math.floor((Date.now() - new Date(e.joined_at).getTime()) / 60000), 0) / waiting.length)
    : 0;
  const tukTukProgress = entries.length > 0 ? (seated.length / entries.length) * 100 : 0;

  const todayReservations = reservations.filter(
    (r) => r.reservation_date === todayStr() && r.status === 'confirmed'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/20 text-amber-50">
      <div className="h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

      <header className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <UtensilsCrossed className="w-6 h-6 text-stone-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{restaurantName} Waitlist</h1>
              <p className="text-amber-200/50 text-sm">Thai Restaurant Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 bg-stone-800/60 border border-amber-500/15 rounded-xl px-3 py-2 text-sm hover:border-amber-500/30 transition-all"
            >
              <SettingsIcon className="w-4 h-4 text-amber-200/70" />
              <span className="text-amber-200/70 hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => setShowLottery(true)}
              className="relative flex items-center gap-1.5 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-xl px-3 py-2 text-sm hover:from-amber-500/30 hover:to-yellow-600/30 transition-all"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-200 font-medium hidden sm:inline">Golden Table</span>
              {lotteryDrawn && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-stone-900" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-stone-900/60 rounded-2xl border border-amber-500/15 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1"><Clock className="w-4 h-4" /></div>
            <div className="text-2xl font-bold">{totalWaiting}</div>
            <div className="text-amber-200/40 text-xs">Waiting</div>
          </div>
          <div className="bg-stone-900/60 rounded-2xl border border-amber-500/15 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1"><Armchair className="w-4 h-4" /></div>
            <div className="text-2xl font-bold">{totalSeated}</div>
            <div className="text-amber-200/40 text-xs">Seated</div>
          </div>
          <div className="bg-stone-900/60 rounded-2xl border border-amber-500/15 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-orange-400 mb-1"><Users className="w-4 h-4" /></div>
            <div className="text-2xl font-bold">{totalPeople}</div>
            <div className="text-amber-200/40 text-xs">Guests</div>
          </div>
          <div className="bg-stone-900/60 rounded-2xl border border-amber-500/15 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-sky-400 mb-1"><CalendarDays className="w-4 h-4" /></div>
            <div className="text-2xl font-bold">{todayReservations}</div>
            <div className="text-amber-200/40 text-xs">Reserv.</div>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mt-3 bg-stone-900/40 rounded-xl border border-amber-500/10 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-amber-200/50 text-xs">Restaurant flow · {tableCount} tables</span>
              <span className="text-amber-200/40 text-xs">{Math.round(tukTukProgress)}% seated</span>
            </div>
            <div className="relative h-5 bg-stone-800/60 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full transition-all duration-500 relative" style={{ width: `${Math.max(tukTukProgress, 3)}%` }}>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-base" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}>🛺</span>
              </div>
            </div>
          </div>
        )}

        {dailyLuckyNumber !== null && (
          <div className="mt-3 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl py-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200/70 text-sm">
              Today's Lucky Number: <span className="text-amber-400 font-bold text-lg">{dailyLuckyNumber}</span>
            </span>
            <span className="text-amber-200/30 text-xs">— match it, win a free appetizer!</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 mb-4">
        <div className="flex gap-1 bg-stone-900/60 rounded-xl border border-amber-500/10 p-1">
          <button
            onClick={() => setTab('waitlist')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'waitlist' ? 'bg-amber-500/20 text-amber-200' : 'text-amber-200/40 hover:text-amber-200/70'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Waitlist
          </button>
          <button
            onClick={() => setTab('reservations')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'reservations' ? 'bg-amber-500/20 text-amber-200' : 'text-amber-200/40 hover:text-amber-200/70'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Reservations
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-12">
        {error && (
          <div className="mb-4 bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {tab === 'waitlist' && (
          <>
            <div className="mb-6">
              <AddPartyForm onAdd={handleAdd} />
            </div>

            {loading && entries.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
                <p className="text-amber-200/40 text-sm">Loading the waitlist...</p>
              </div>
            ) : (
              <>
                {waiting.length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <h2 className="text-amber-100 font-semibold text-sm uppercase tracking-wide">Waiting List</h2>
                      <span className="text-amber-200/30 text-xs">({waiting.length})</span>
                    </div>
                    <div className="space-y-3">
                      {waiting.map((entry) => (
                        <WaitlistCard key={entry.id} entry={entry} luckyNumber={dailyLuckyNumber} tableCount={tableCount} blessingThreshold={blessingThreshold}
                          onSeat={handleSeat} onRemove={handleRemove} onComplete={handleComplete} onNoShow={handleNoShow} onSpinSpice={setSpiceEntry}
                          isWinner={lottery?.winner_entry_id === entry.id} />
                      ))}
                    </div>
                  </section>
                )}

                {seated.length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Armchair className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-amber-100 font-semibold text-sm uppercase tracking-wide">Seated</h2>
                      <span className="text-amber-200/30 text-xs">({seated.length})</span>
                    </div>
                    <div className="space-y-3">
                      {seated.map((entry) => (
                        <WaitlistCard key={entry.id} entry={entry} luckyNumber={dailyLuckyNumber} tableCount={tableCount} blessingThreshold={blessingThreshold}
                          onSeat={handleSeat} onRemove={handleRemove} onComplete={handleComplete} onNoShow={handleNoShow} onSpinSpice={setSpiceEntry}
                          isWinner={lottery?.winner_entry_id === entry.id} />
                      ))}
                    </div>
                  </section>
                )}

                {completed.length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-stone-500" />
                      <h2 className="text-stone-400 font-semibold text-sm uppercase tracking-wide">History</h2>
                      <span className="text-stone-600 text-xs">({completed.length})</span>
                    </div>
                    <div className="space-y-2">
                      {completed.map((entry) => (
                        <WaitlistCard key={entry.id} entry={entry} luckyNumber={dailyLuckyNumber} tableCount={tableCount} blessingThreshold={blessingThreshold}
                          onSeat={handleSeat} onRemove={handleRemove} onComplete={handleComplete} onNoShow={handleNoShow} onSpinSpice={setSpiceEntry}
                          isWinner={lottery?.winner_entry_id === entry.id} />
                      ))}
                    </div>
                  </section>
                )}

                {entries.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🍜</div>
                    <p className="text-amber-200/50 text-sm mb-1">The waitlist is empty</p>
                    <p className="text-amber-200/30 text-xs">Add a party above to get started</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'reservations' && (
          <ReservationsPanel
            reservations={reservations}
            luckyNumber={dailyLuckyNumber}
            tableCount={tableCount}
            onAdd={handleAddReservation}
            onSeat={handleSeatReservation}
            onCancel={handleCancelReservation}
            onRemove={handleRemoveReservation}
          />
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 pb-8">
        <p className="text-center text-amber-200/20 text-xs">
          {avgWait > 0 && `Average wait: ${avgWait} min · `}
          {getFortuneWaitMessage(avgWait)}
        </p>
      </footer>

      {showLottery && (
        <GoldenTableLottery eligibleEntries={eligibleForLottery} onDraw={handleLotteryDraw} onClose={() => setShowLottery(false)} alreadyDrawn={lotteryDrawn} />
      )}
      {spiceEntry && (
        <SpiceRoulette partyName={spiceEntry.name} onResult={handleSpiceResult} onClose={() => setSpiceEntry(null)} />
      )}
      {showSettings && settings && (
        <SettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
