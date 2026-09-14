import { useState, useEffect, useRef } from 'react';
import { spiceOutcomes } from '@/lib/fortunes';
import { X, Flame } from 'lucide-react';

type Props = {
  onResult: (result: string) => void;
  onClose: () => void;
  partyName: string;
};

export default function SpiceRoulette({ onResult, onClose, partyName }: Props) {
  const [spinning, setSpinning] = useState(true);
  const [result, setResult] = useState<typeof spiceOutcomes[number] | null>(null);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetIndexRef = useRef<number>(0);

  useEffect(() => {
    const segments = spiceOutcomes.length;
    const segmentAngle = 360 / segments;
    const targetIndex = Math.floor(Math.random() * segments);
    targetIndexRef.current = targetIndex;
    startTimeRef.current = performance.now();
    const duration = 3500;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const targetAngle = 360 * 5 + (360 - (targetIndex * segmentAngle + segmentAngle / 2));
      const current = eased * targetAngle;
      setAngle(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setResult(spiceOutcomes[targetIndex]);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleClaim = () => {
    if (result) onResult(result.label);
  };

  const segments = spiceOutcomes.length;
  const segmentAngle = 360 / segments;
  const radius = 130;
  const cx = 150;
  const cy = 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-3xl border border-amber-500/30 p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-amber-50 font-semibold text-lg">Spice Roulette</h2>
          </div>
          <button onClick={onClose} className="text-amber-200/40 hover:text-amber-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-amber-200/60 text-sm mb-6 text-center">
          {spinning ? `Spinning the spice wheel for ${partyName}...` : `${partyName} got...`}
        </p>

        <div className="relative w-[300px] h-[300px] mx-auto mb-6">
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            style={{ transform: `rotate(${angle}deg)`, transition: spinning ? 'none' : 'transform 0.3s ease' }}
          >
            {spiceOutcomes.map((outcome, i) => {
              const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);
              const midAngle = (startAngle + endAngle) / 2;
              const tx = cx + (radius * 0.65) * Math.cos(midAngle);
              const ty = cy + (radius * 0.65) * Math.sin(midAngle);
              const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
              return (
                <g key={i}>
                  <path d={path} fill={outcome.color} stroke="#1c1917" strokeWidth="2" opacity={0.85} />
                  <text
                    x={tx}
                    y={ty}
                    fill="#1c1917"
                    fontSize="16"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${(i * segmentAngle + segmentAngle / 2)} ${tx} ${ty})`}
                  >
                    {outcome.emoji}
                  </text>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r="30" fill="#1c1917" stroke="#f59e0b" strokeWidth="3" />
          </svg>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-500 drop-shadow-lg" />
          </div>
        </div>

        {result && !spinning && (
          <div className="text-center animate-[fadeIn_0.4s_ease]">
            <div className="text-5xl mb-2">{result.emoji}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: result.color }}>
              {result.label}
            </div>
            <p className="text-amber-200/60 text-sm mb-4">{result.desc}</p>
            {result.label === 'Volcano' && (
              <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-3 mb-4 animate-[fadeIn_0.3s_ease]">
                <p className="text-orange-300 text-sm font-medium">
                  You won a FREE Thai Iced Tea!
                </p>
              </div>
            )}
            <button
              onClick={handleClaim}
              className="bg-gradient-to-br from-amber-500 to-orange-600 text-stone-900 font-semibold rounded-xl px-8 py-3 hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20"
            >
              Claim Spice Fate
            </button>
          </div>
        )}

        {spinning && (
          <div className="text-center text-amber-200/40 text-sm animate-pulse">
            The wheel of fate is spinning...
          </div>
        )}
      </div>
    </div>
  );
}
