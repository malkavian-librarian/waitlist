import { useState, useMemo } from 'react';
import { CalendarDays, Plus, X, Users, Phone, Trash2, Armchair, Check, Star, MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reservation } from '@/lib/supabase';

type Props = {
  reservations: Reservation[];
  luckyNumber: number | null;
  tableCount: number;
  onAdd: (data: { name: string; party_size: number; phone: string; reservation_date: string; reservation_time: string; notes: string; table_number: number | null }) => Promise<void>;
  onSeat: (reservation: Reservation) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${ampm}`;
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function ReservationsPanel({
  reservations,
  luckyNumber,
  tableCount,
  onAdd,
  onSeat,
  onCancel,
  onRemove,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [seatingId, setSeatingId] = useState<string | null>(null);
  const [tableInput, setTableInput] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState('');
  const [resDate, setResDate] = useState(toDateString(new Date()));
  const [resTime, setResTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const dayReservations = useMemo(
    () =>
      reservations
        .filter((r) => r.reservation_date === selectedDate && r.status !== 'cancelled' && r.status !== 'no_show')
        .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time)),
    [reservations, selectedDate]
  );

  const navigateDay = (delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateString(d));
  };

  const isToday = selectedDate === toDateString(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const tn = tableNumber.trim() ? parseInt(tableNumber, 10) : null;
      await onAdd({
        name: name.trim(),
        party_size: partySize,
        phone: phone.trim(),
        reservation_date: resDate,
        reservation_time: resTime,
        notes: notes.trim(),
        table_number: tn && tn >= 1 && tn <= tableCount ? tn : null,
      });
      setName('');
      setPartySize(2);
      setPhone('');
      setNotes('');
      setTableNumber('');
      setShowForm(false);
      setSelectedDate(resDate);
    } catch {
      // parent handles error
    } finally {
      setLoading(false);
    }
  };

  const handleSeat = (res: Reservation) => {
    const tn = parseInt(tableInput, 10);
    if (isNaN(tn) || tn < 1 || tn > tableCount) return;
    onSeat({ ...res, table_number: tn });
    setSeatingId(null);
    setTableInput('');
  };

  return (
    <div className="bg-stone-900/60 rounded-2xl border border-amber-500/15 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-amber-400" />
          <h2 className="text-amber-100 font-semibold text-sm uppercase tracking-wide">Reservations</h2>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setResDate(selectedDate);
          }}
          className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-500/30 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Close' : 'New Reservation'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-4 bg-stone-800/40 rounded-xl border border-amber-500/10 p-4 animate-[fadeIn_0.2s_ease]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Party name"
                required
                className="w-full bg-stone-900/60 text-amber-50 placeholder-amber-200/30 rounded-lg pl-10 pr-3 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="relative w-20">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full bg-stone-900/60 text-amber-50 rounded-lg pl-10 pr-2 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors text-center"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full bg-stone-900/60 text-amber-50 placeholder-amber-200/30 rounded-lg pl-10 pr-3 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="relative w-20">
              <Armchair className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="number"
                min={1}
                max={tableCount}
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table"
                className="w-full bg-stone-900/60 text-amber-50 placeholder-amber-200/30 rounded-lg pl-10 pr-2 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors text-center"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={resDate}
              onChange={(e) => setResDate(e.target.value)}
              className="flex-1 bg-stone-900/60 text-amber-50 rounded-lg px-3 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
            />
            <input
              type="time"
              value={resTime}
              onChange={(e) => setResTime(e.target.value)}
              className="w-28 bg-stone-900/60 text-amber-50 rounded-lg px-3 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
            />
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (allergies, birthday, high chair...)"
            className="w-full bg-stone-900/60 text-amber-50 placeholder-amber-200/30 rounded-lg px-3 py-2 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-stone-900 font-semibold rounded-lg py-2.5 text-sm hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add Reservation'}
          </button>
        </form>
      )}

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateDay(-1)}
          className="text-amber-200/50 hover:text-amber-200 transition-colors p-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-amber-100 font-medium text-sm">
            {isToday ? 'Today' : formatDate(selectedDate)}
          </div>
          <div className="text-amber-200/30 text-xs">{dayReservations.length} reservation{dayReservations.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => navigateDay(1)}
          className="text-amber-200/50 hover:text-amber-200 transition-colors p-1"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Reservation list */}
      {dayReservations.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays className="w-8 h-8 text-amber-500/20 mx-auto mb-2" />
          <p className="text-amber-200/30 text-sm">No reservations for this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayReservations.map((res) => {
            const isLuckyMatch = luckyNumber !== null && res.lucky_number === luckyNumber;
            return (
              <div
                key={res.id}
                className={`rounded-xl border p-3 transition-all ${
                  res.status === 'seated'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-stone-800/40 border-amber-500/10 hover:border-amber-500/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-50 font-medium text-sm">{res.name}</span>
                    {res.table_number && (
                      <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Table {res.table_number}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemove(res.id)}
                    className="text-stone-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <span className="flex items-center gap-1 text-amber-200/60 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatTime(res.reservation_time)}
                  </span>
                  <span className="flex items-center gap-1 text-amber-200/60 text-xs">
                    <Users className="w-3 h-3" />
                    Party of {res.party_size}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      isLuckyMatch
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'bg-stone-700/40 text-amber-200/40'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    Lucky #{res.lucky_number}
                    {isLuckyMatch && ' · Match!'}
                  </span>
                </div>

                {res.phone && (
                  <div className="flex items-center gap-1 text-amber-200/40 text-xs mb-1">
                    <Phone className="w-3 h-3" />
                    {res.phone}
                  </div>
                )}
                {res.notes && (
                  <div className="flex items-center gap-1 text-amber-200/40 text-xs mb-1">
                    <MessageSquare className="w-3 h-3" />
                    {res.notes}
                  </div>
                )}

                {res.status === 'confirmed' && (
                  <div className="flex items-center gap-2 mt-2">
                    {seatingId === res.id ? (
                      <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease]">
                        <input
                          type="number"
                          min={1}
                          max={tableCount}
                          value={tableInput}
                          onChange={(e) => setTableInput(e.target.value)}
                          placeholder="Table #"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSeat(res)}
                          className="w-20 bg-stone-900/60 text-amber-50 rounded-lg px-2 py-1.5 text-sm border border-amber-500/20 focus:border-amber-500/50 focus:outline-none transition-colors text-center"
                        />
                        <button
                          onClick={() => handleSeat(res)}
                          className="bg-emerald-600 text-white rounded-lg px-2 py-1.5 text-xs hover:bg-emerald-500 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSeatingId(null); setTableInput(''); }}
                          className="text-stone-500 hover:text-stone-300 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setSeatingId(res.id)}
                          className="flex items-center gap-1 bg-emerald-600/80 text-white rounded-lg px-2.5 py-1.5 text-xs hover:bg-emerald-500 transition-colors"
                        >
                          <Armchair className="w-3.5 h-3.5" />
                          Seat
                        </button>
                        <button
                          onClick={() => onCancel(res.id)}
                          className="text-stone-500 hover:text-red-400 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}

                {res.status === 'seated' && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
                    <Check className="w-3.5 h-3.5" />
                    Seated
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
