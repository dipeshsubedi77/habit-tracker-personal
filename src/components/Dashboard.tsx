import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Flame, Droplets, Sun, Brain, Activity, Sparkles, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEFAULT_ROUTINES = [
  { title: 'Wake up at the same time', category: 'Morning' },
  { title: 'Drink water (16-32oz)', category: 'Morning' },
  { title: 'Morning sunlight (10-30 mins)', category: 'Morning' },
  { title: 'Physiological Sighs', category: 'Morning' },
  { title: 'Workout (Calisthenics)', category: 'Workout' },
];

export function Dashboard() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`routines_${today}`);
    const savedStreak = localStorage.getItem('current_streak');
    if (savedStreak) setStreak(parseInt(savedStreak));

    try {
      const { data, error } = await supabase.from('routines').select('*').gte('date', today).order('id', { ascending: true });
      
      if (!error && data && data.length > 0) {
        setRoutines(data);
        localStorage.setItem(`routines_${today}`, JSON.stringify(data));
      } else if (saved) {
        setRoutines(JSON.parse(saved));
      } else {
        const newRoutines = DEFAULT_ROUTINES.map((r, i) => ({
          id: i + 1,
          ...r,
          is_completed: false,
        }));
        setRoutines(newRoutines);
        localStorage.setItem(`routines_${today}`, JSON.stringify(newRoutines));
      }

      const { data: userData } = await supabase.from('users').select('current_streak').limit(1).single();
      if (userData?.current_streak) {
        setStreak(userData.current_streak);
        localStorage.setItem('current_streak', userData.current_streak.toString());
      }
    } catch (e) {
      console.log('Error fetching dashboard data, using local state', e);
      if (saved) {
        setRoutines(JSON.parse(saved));
      } else {
        const newRoutines = DEFAULT_ROUTINES.map((r, i) => ({ id: i + 1, ...r, is_completed: false }));
        setRoutines(newRoutines);
      }
    }
  };

  const toggleRoutine = async (id: number) => {
    const today = new Date().toISOString().split('T')[0];
    const routine = routines.find(r => r.id === id);
    if (!routine) return;
    
    const updated = routines.map(r => r.id === id ? { ...r, is_completed: !r.is_completed } : r);
    setRoutines(updated);
    localStorage.setItem(`routines_${today}`, JSON.stringify(updated));

    try {
      await supabase.from('routines').update({ is_completed: !routine.is_completed }).eq('id', id);
    } catch (e) {
      console.log('Error updating routine', e);
    }
  };

  const getIcon = (category: string) => {
    switch(category) {
      case 'Morning': return Sun;
      case 'Workout': return Activity;
      case 'Evening': return Moon;
      default: return Brain;
    }
  };

  const progress = routines.length > 0 ? (routines.filter(r => r.is_completed).length / routines.length) * 100 : 0;
  
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Good Morning, Guest</h1>
          <p className="text-slate-400 mt-1">{todayDate} &bull; Let's win the day</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Current Streak</p>
              <p className="text-xl font-bold text-white">{streak} Days</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Daily Routine */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
            
            <h2 className="text-sm font-semibold text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Today's Routine
            </h2>
            
            <div className="space-y-4 relative z-10">
              {routines.map((item, i) => {
                const Icon = getIcon(item.category);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={item.id}
                    onClick={() => toggleRoutine(item.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                  >
                    <button className="flex-shrink-0 text-slate-500 hover:text-blue-400 transition-colors">
                      {item.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-blue-500" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.is_completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
                    </div>
                    
                    <Icon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Daily Progress</h2>
            
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-white/10 fill-none" strokeWidth="8" />
                  <motion.circle
                    initial={{ strokeDasharray: '0 251.2' }}
                    animate={{ strokeDasharray: `${(progress / 100) * 251.2} 251.2` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    cx="50" cy="50" r="40"
                    className="stroke-blue-500 fill-none"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Mini */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-blue-100 uppercase tracking-wider">AI Coach</h2>
            </div>
            <p className="text-sm text-blue-100/80 leading-relaxed italic">
              "You've hit your morning routine consistently. Try adding 5 minutes to your sunlight exposure today to optimize cortisol release."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
