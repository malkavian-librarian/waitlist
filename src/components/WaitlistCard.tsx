import { useState } from 'react';
import { Clock, Users, Hash, Phone, Trash2, Armchair, Flame, Star, MessageSquare, X, Check } from 'lucide-react';
import type { WaitlistEntry } from '@/lib/supabase';
import { getFortuneWaitMessage } from '@/lib/fortunes';

type Props = {
  entry: WaitlistEntry;
  luckyNumber: number | null;
  tableCount: number;
  blessingThreshold: number;
  onSeat: (entry: WaitlistEntry) => void;
  onRemove: (id: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onSpinSpice: (entry: WaitlistEntry) => void;
  isWinner: boolean;
};

export default function WaitlistCard({
  entry,
  luckyNumber,
  tableCount,
  blessingThreshold,
  onSeat,
  onRemove,
  onComplete,
  onNoShow,
  onSpinSpice,
  isWinner,
}: Props) {
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  const waitMs = Date.now() - new Date(entry.joined_at).getTime();
  const waitMinutes = Math.floor(waitMs / 60000);
  const isLuckyMatch = luckyNumber !== null && entry.lucky_number === luckyNumber;
  const isBlessed = waitMinutes >= blessingThreshold && entry.status === 'waiting';

  const handleSeat = (e: React.FormEvent) => {
    e.preventDefault();
    const table = parseInt(tableNumber, 10);
    if (isNaN(table) || table < 1 || table > tableCount) return;
    onSeat({ ...entry, table_number: table });
    setTableNumber('');
    setShowSeatForm(false);
  };

  if (entry.status === 'completed' || entry.status === 'no_show') {
    return (
      <div className="bg-stone-900/40 rounded-xl border border-stone-700/40 p-3 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-200/40 text-sm font-medium line-through">{entry.name}</span>
            <span className="text-stone-500 text-xs">
              {entry.status === 'completed' ? 'Finished' : 'No show'}
            </span>
          </div>
          <button
            onClick={() => onRemove(entry.id)}
            className="text-stone-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isWinner
          ? 'bg-gradient-to-br from-amber-900/40 to-yellow-900/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
          : entry.status === 'seated'
          ? 'bg-stone-900/60 border-emerald-500/30'
          : isBlessed
          ? 'bg-stone-900/60 border-orange-500/40 shadow-md shadow-orange-500/5'
          : 'bg-stone-900/60 border-amber-500/15 hover:border-amber-500/30'
      }`}
    >
      {/* Winner badge */}
      {isWinner && (
        <div className="flex items-center gap-1.5 mb-2 animate-[fadeIn_0.4s_ease]">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">
            Golden Table Winner — Free Meal!
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-50 font-semibold text-base">{entry.name}</span>
          {entry.status === 'seated' && entry.table_number && (
            <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Hash className="w-3 h-3" />
              Table {entry.table_number}
            </span>
          )}
        </div>
        <button
          onClick={() => onRemove(entry.id)}
          className="text-stone-600 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="flex items-center gap-1 text-amber-200/60 text-xs">
          <Users className="w-3.5 h-3.5" />
          Party of {entry.party_size}
        </span>
        {entry.status === 'waiting' && (
          <span className={`flex items-center gap-1 text-xs ${isBlessed ? 'text-orange-400 font-medium' : 'text-amber-200/60'}`}>
            <Clock className="w-3.5 h-3.5" />
            {waitMinutes} min
            {isBlessed && ' · Buddha Blessing!'}
          </span>
        )}
        {entry.status === 'seated' && entry.wait_minutes !== null && (
          <span className="flex items-center gap-1 text-emerald-400/60 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Waited {entry.wait_minutes} min
          </span>
        )}
        <span
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            isLuckyMatch
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'bg-stone-800/60 text-amber-200/40'
          }`}
        >
          <Star className="w-3 h-3" />
          Lucky #{entry.lucky_number}
          {isLuckyMatch && ' · Match! Free App'}
        </span>
        {entry.spice_roulette && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300">
            <Flame className="w-3 h-3" />
            {entry.spice_roulette}
          </span>
        )}
      </div>

      {entry.phone && (
        <div className="flex items-center gap-1 text-amber-200/40 text-xs mb-1">
          <Phone className="w-3 h-3" />
          {entry.phone}
        </div>
      )}

      {entry.notes && (
        <div className="flex items-center gap-1 text-amber-200/40 text-xs mb-2">
          <MessageSquare className="w-3 h-3" />
          {entry.notes}
        </div>
      )}

      {entry.status === 'waiting' && waitMinutes >= 5 && (
        <p className="text-amber-200/30 text-xs italic mb-2">
          {getFortuneWaitMessage(waitMinutes)}
        </p>
      )}

      {showSeatForm && (
        <form onSubmit={handleSeat} className="flex items-center gap-2 mb-2 animate-[fadeIn_0.2s_ease]">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
            <input
              type="number"
              min={1}
              max={tableCount}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table number"
              autoFocus
              className="w-full bg-stone-800/60 text-amber-50 placeholder-amber-200/30 rounded-lg pl-9 pr-3 py-2 text-sm border border-amber-500/20 focus:border-amber-500/50 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-emerald-500 transition-colors flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowSeatForm(false)}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="flex items-center gap-2 mt-2">
        {entry.status === 'waiting' && !showSeatForm && (
          <>
            <button
              onClick={() => setShowSeatForm(true)}
              className="flex items-center gap-1.5 bg-emerald-600/80 text-white rounded-lg px-3 py-1.5 text-xs hover:bg-emerald-500 transition-colors"
            >
              <Armchair className="w-3.5 h-3.5" />
              Seat
            </button>
            <button
              onClick={() => onNoShow(entry.id)}
              className="text-stone-500 hover:text-stone-300 rounded-lg px-3 py-1.5 text-xs transition-colors"
            >
              No show
            </button>
          </>
        )}
        {entry.status === 'seated' && (
          <>
            {!entry.spice_roulette && (
              <button
                onClick={() => onSpinSpice(entry)}
                className="flex items-center gap-1.5 bg-orange-600/80 text-white rounded-lg px-3 py-1.5 text-xs hover:bg-orange-500 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                Spice Roulette
              </button>
            )}
            <button
              onClick={() => onComplete(entry.id)}
              className="flex items-center gap-1.5 bg-stone-700/80 text-amber-100 rounded-lg px-3 py-1.5 text-xs hover:bg-stone-600 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
