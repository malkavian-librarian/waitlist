import { useState } from 'react';
import { Plus, Users, Phone, User, MessageSquare } from 'lucide-react';

type Props = {
  onAdd: (name: string, partySize: number, phone: string, notes: string) => Promise<void>;
};

export default function AddPartyForm({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim(), partySize, phone.trim(), notes.trim());
      setName('');
      setPartySize(2);
      setPhone('');
      setNotes('');
      setExpanded(false);
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-5 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Party name"
              className="w-full bg-stone-800/60 text-amber-50 placeholder-amber-200/30 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
              required
            />
          </div>
          <div className="relative w-24">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
            <input
              type="number"
              min={1}
              max={20}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-full bg-stone-800/60 text-amber-50 rounded-xl pl-10 pr-3 py-2.5 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors text-center"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-gradient-to-br from-amber-500 to-orange-600 text-stone-900 font-semibold rounded-xl px-4 py-2.5 text-sm hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {expanded && (
          <div className="flex gap-2 animate-[fadeIn_0.2s_ease]">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full bg-stone-800/60 text-amber-50 placeholder-amber-200/30 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (allergies, high chair...)"
                className="w-full bg-stone-800/60 text-amber-50 placeholder-amber-200/30 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-amber-500/60 text-xs hover:text-amber-400 transition-colors"
          >
            + Add phone & notes
          </button>
        )}
      </form>
    </div>
  );
}
