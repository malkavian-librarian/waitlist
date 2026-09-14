import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Store, Armchair, Clock, Sparkles } from 'lucide-react';
import type { RestaurantSettings } from '@/lib/supabase';

type Props = {
  settings: RestaurantSettings;
  onSave: (settings: RestaurantSettings) => Promise<void>;
  onClose: () => void;
};

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [restaurantName, setRestaurantName] = useState(settings.restaurant_name);
  const [tableCount, setTableCount] = useState(settings.table_count);
  const [waitEstimate, setWaitEstimate] = useState(settings.default_wait_estimate);
  const [blessingThreshold, setBlessingThreshold] = useState(settings.buddha_blessing_threshold);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...settings,
        restaurant_name: restaurantName.trim() || 'Sawasdee',
        table_count: Math.max(1, Math.min(50, tableCount)),
        default_wait_estimate: Math.max(0, Math.min(120, waitEstimate)),
        buddha_blessing_threshold: Math.max(5, Math.min(120, blessingThreshold)),
      });
      onClose();
    } catch {
      // parent handles error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-3xl border border-amber-500/30 p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-amber-50 font-semibold text-lg">Restaurant Settings</h2>
          </div>
          <button onClick={onClose} className="text-amber-200/40 hover:text-amber-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-amber-200/70 text-sm mb-2">
              <Store className="w-4 h-4 text-amber-500/60" />
              Restaurant Name
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-stone-800/60 text-amber-50 rounded-xl px-4 py-2.5 text-sm border border-amber-500/10 focus:border-amber-500/40 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-amber-200/70 text-sm mb-2">
              <Armchair className="w-4 h-4 text-amber-500/60" />
              Number of Tables
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={50}
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <div className="bg-stone-800/60 rounded-lg px-3 py-1.5 text-amber-50 font-bold text-lg w-16 text-center border border-amber-500/10">
                {tableCount}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-amber-200/70 text-sm mb-2">
              <Clock className="w-4 h-4 text-amber-500/60" />
              Default Wait Estimate (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={120}
                step={5}
                value={waitEstimate}
                onChange={(e) => setWaitEstimate(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <div className="bg-stone-800/60 rounded-lg px-3 py-1.5 text-amber-50 font-bold text-lg w-16 text-center border border-amber-500/10">
                {waitEstimate}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-amber-200/70 text-sm mb-2">
              <Sparkles className="w-4 h-4 text-amber-500/60" />
              Buddha Blessing Threshold (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={blessingThreshold}
                onChange={(e) => setBlessingThreshold(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <div className="bg-stone-800/60 rounded-lg px-3 py-1.5 text-amber-50 font-bold text-lg w-16 text-center border border-amber-500/10">
                {blessingThreshold}
              </div>
            </div>
            <p className="text-amber-200/30 text-xs mt-1">
              Parties waiting longer than this get a free appetizer
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-stone-900 font-semibold rounded-xl py-3 hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
