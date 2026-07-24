import React, { useState, useEffect } from 'react';
import { CalendarHeart, Trophy, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Gratitude() {
  const [wins, setWins] = useState(['', '', '']);
  const [gratitudes, setGratitudes] = useState(['', '', '']);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const savedWins = localStorage.getItem(`wins_${today}`);
    const savedGrat = localStorage.getItem(`gratitudes_${today}`);

    if (savedWins) {
      try { setWins(JSON.parse(savedWins)); } catch (e) {}
    }
    if (savedGrat) {
      try { setGratitudes(JSON.parse(savedGrat)); } catch (e) {}
    }

    try {
      const [winsRes, gradRes] = await Promise.all([
        supabase.from('daily_wins').select('*').gte('created_at', today).limit(1).single(),
        supabase.from('gratitudes').select('*').gte('created_at', today).limit(1).single()
      ]);

      if (winsRes.data) {
        setWins([winsRes.data.win1 || '', winsRes.data.win2 || '', winsRes.data.win3 || '']);
      }
      if (gradRes.data) {
        setGratitudes([gradRes.data.item1 || '', gradRes.data.item2 || '', gradRes.data.item3 || '']);
      }
    } catch (e) {
      console.log('No entries in DB or error fetching, using local storage');
    }
  };

  const saveData = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];

    localStorage.setItem(`wins_${today}`, JSON.stringify(wins));
    localStorage.setItem(`gratitudes_${today}`, JSON.stringify(gratitudes));
    setLastSaved(new Date());

    try {
      const winObj = { win1: wins[0], win2: wins[1], win3: wins[2] };
      const gradObj = { item1: gratitudes[0], item2: gratitudes[1], item3: gratitudes[2] };

      await Promise.all([
        supabase.from('daily_wins').insert([winObj]),
        supabase.from('gratitudes').insert([gradObj])
      ]);
    } catch (e) {
      console.log('Saved to local storage (DB save skipped/failed)', e);
    } finally {
      setSaving(false);
    }
  };

  const handleWinChange = (index: number, val: string) => {
    const newWins = [...wins];
    newWins[index] = val;
    setWins(newWins);
  };

  const handleGradChange = (index: number, val: string) => {
    const newGrads = [...gratitudes];
    newGrads[index] = val;
    setGratitudes(newGrads);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarHeart className="w-7 h-7 text-pink-400" />
            Gratitude & Wins
          </h1>
          <p className="text-slate-400 mt-1">Wire your brain for positivity by acknowledging the good.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastSaved && <span className="text-xs text-slate-500">Last saved: {lastSaved.toLocaleTimeString()}</span>}
          <button 
            onClick={saveData}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Three Wins */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Three Wins Today</h2>
          </div>

          <div className="space-y-4 relative z-10">
            {[1, 2, 3].map((num, i) => (
              <div key={num} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600 select-none">
                  0{num}
                </div>
                <input 
                  type="text" 
                  value={wins[i]}
                  onChange={(e) => handleWinChange(i, e.target.value)}
                  placeholder="What went well today?"
                  className="w-full bg-transparent border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gratitude */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-pink-500/10 transition-colors" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
              <CalendarHeart className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Daily Gratitude</h2>
          </div>

          <div className="space-y-4 relative z-10">
            {[1, 2, 3].map((num, i) => (
              <div key={num} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600 select-none">
                  0{num}
                </div>
                <input 
                  type="text" 
                  value={gratitudes[i]}
                  onChange={(e) => handleGradChange(i, e.target.value)}
                  placeholder="I am grateful for..."
                  className="w-full bg-transparent border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
