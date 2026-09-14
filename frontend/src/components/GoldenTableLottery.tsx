import { useState, useEffect, useRef } from 'react';
import { X, Crown, Sparkles, Trophy } from 'lucide-react';
import type { WaitlistEntry } from '@/services';

type Props = {
  eligibleEntries: WaitlistEntry[];
  onDraw: (winnerId: string) => void;
  onClose: () => void;
  alreadyDrawn: boolean;
};

export default function GoldenTableLottery({ eligibleEntries, onDraw, onClose, alreadyDrawn }: Props) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [displayName, setDisplayName] = useState('');
  const [winner, setWinner] = useState<WaitlistEntry | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'spinning' || eligibleEntries.length === 0) return;

    const duration = 4000;
    const startTime = performance.now();
    let lastUpdate = 0;
    const interval = 80;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (now - lastUpdate > interval * (1 + eased * 3)) {
        lastUpdate = now;
        const randomIndex = Math.floor(Math.random() * eligibleEntries.length);
        setDisplayName(eligibleEntries[randomIndex].name);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        const winIndex = Math.floor(Math.random() * eligibleEntries.length);
        const win = eligibleEntries[winIndex];
        setWinner(win);
        setDisplayName(win.name);
        setPhase('result');
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, eligibleEntries]);

  const handleDraw = () => {
    if (alreadyDrawn) return;
    setPhase('spinning');
  };

  const handleConfirm = () => {
    if (winner) onDraw(winner.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-gradient-to-br from-stone-900 via-amber-950/30 to-stone-950 rounded-3xl border border-amber-500/40 p-8 max-w-lg w-full shadow-2xl shadow-amber-500/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <h2 className="text-amber-50 font-bold text-xl">Golden Table Lottery</h2>
          </div>
          <button onClick={onClose} className="text-amber-200/40 hover:text-amber-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-amber-200/70 text-sm leading-relaxed">
            Every day, the kitchen gods choose one lucky table to eat for free.
            <br />
            Will fortune smile upon your guests today?
          </p>
        </div>

        {phase === 'idle' && !alreadyDrawn && (
          <div className="text-center py-8">
            {eligibleEntries.length === 0 ? (
              <p className="text-amber-200/50 text-sm">
                No seated guests yet. Seat some parties first, then draw the lottery!
              </p>
            ) : (
              <>
                <p className="text-amber-200/60 text-sm mb-6">
                  {eligibleEntries.length} eligible {eligibleEntries.length === 1 ? 'table' : 'tables'} in the draw
                </p>
                <button
                  onClick={handleDraw}
                  className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-stone-900 font-bold rounded-2xl px-10 py-4 text-lg hover:scale-105 transition-transform shadow-xl shadow-amber-500/30 flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-6 h-6" />
                  Draw the Golden Table
                </button>
              </>
            )}
          </div>
        )}

        {(phase === 'spinning' || phase === 'result') && (
          <div className="text-center py-8">
            <div
              ref={scrollRef}
              className="bg-stone-800/60 rounded-2xl border border-amber-500/20 py-8 mb-6 overflow-hidden"
            >
              <div
                className={`text-3xl font-bold ${phase === 'spinning' ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`}
              >
                {displayName}
              </div>
              {phase === 'result' && winner && (
                <div className="mt-2 text-amber-200/60 text-sm">
                  Table {winner.table_number} · Party of {winner.party_size}
                </div>
              )}
            </div>

            {phase === 'spinning' && (
              <p className="text-amber-200/50 text-sm animate-pulse">
                The kitchen gods are deciding...
              </p>
            )}

            {phase === 'result' && winner && (
              <div className="animate-[fadeIn_0.5s_ease]">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Trophy className="w-8 h-8 text-amber-400" />
                  <span className="text-amber-400 font-bold text-xl">WINNER!</span>
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-xl p-4 mb-6">
                  <p className="text-amber-100 font-semibold">
                    {winner.name}'s table eats for FREE today!
                  </p>
                  <p className="text-amber-200/60 text-xs mt-1">
                    Lucky Number {winner.lucky_number} struck gold!
                  </p>
                </div>
                <button
                  onClick={handleConfirm}
                  className="bg-gradient-to-br from-amber-500 to-orange-600 text-stone-900 font-semibold rounded-xl px-8 py-3 hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20"
                >
                  Announce the Winner
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
