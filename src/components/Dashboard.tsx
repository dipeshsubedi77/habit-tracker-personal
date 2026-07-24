import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Flame, Sun, Brain, Activity, Sparkles, Moon, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [routines, setRoutines] = useState<any[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`routines_${today}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: 1, title: 'Morning hydration (16-32oz water)', category: 'Morning', is_completed: false },
      { id: 2, title: 'Morning sunlight (10-20 mins)', category: 'Morning', is_completed: false },
      { id: 3, title: 'Daily Workout', category: 'Workout', is_completed: false },
    ];
  });

  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineCategory, setNewRoutineCategory] = useState('Morning');
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('current_streak');
    return saved ? parseInt(saved) : 1;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const saveRoutinesLocal = (updated: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    setRoutines(updated);
    localStorage.setItem(`routines_${today}`, JSON.stringify(updated));
  };

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase.from('routines').select('*').gte('date', today).order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        saveRoutinesLocal(data);
      }
      const { data: userData } = await supabase.from('users').select('current_streak').limit(1).single();
      if (userData?.current_streak) {
        setStreak(userData.current_streak);
        localStorage.setItem('current_streak', userData.current_streak.toString());
      }
    } catch (e) {
      console.log('Error fetching dashboard data', e);
    }
  };

  const toggleRoutine = async (id: number | string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;
    
    const updated = routines.map(r => r.id === id ? { ...r, is_completed: !r.is_completed } : r);
    saveRoutinesLocal(updated);

    try {
      await supabase.from('routines').update({ is_completed: !routine.is_completed }).eq('id', id);
    } catch (e) {
      console.log('Error updating routine', e);
    }
  };

  const addRoutine = async () => {
    if (!newRoutineTitle.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const newObj = {
      id: `r_${Date.now()}`,
      title: newRoutineTitle.trim(),
      category: newRoutineCategory,
      is_completed: false,
      date: today
    };

    const updated = [...routines, newObj];
    saveRoutinesLocal(updated);
    setNewRoutineTitle('');

    try {
      await supabase.from('routines').insert([newObj]);
    } catch (e) {
      console.log('Error inserting routine to db', e);
    }
  };

  const deleteRoutine = async (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = routines.filter(r => r.id !== id);
    saveRoutinesLocal(updated);

    try {
      await supabase.from('routines').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting routine from db', e);
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Daily Dashboard</h1>
          <p className="text-slate-400 mt-1">{todayDate} &bull; Stay focused and consistent.</p>
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
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Today's Routine
              </h2>
            </div>

            {/* Add Routine Bar */}
            <div className="flex items-center gap-2 mb-6 bg-white/5 border border-white/10 p-1.5 rounded-2xl relative z-10">
              <input
                type="text"
                placeholder="Add a new routine item..."
                value={newRoutineTitle}
                onChange={(e) => setNewRoutineTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRoutine()}
                className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white placeholder:text-slate-500 px-3"
              />
              <select
                value={newRoutineCategory}
                onChange={(e) => setNewRoutineCategory(e.target.value)}
                className="bg-[#121212] text-xs text-slate-300 border border-white/10 rounded-xl px-2 py-1 focus:outline-none"
              >
                <option value="Morning">Morning</option>
                <option value="Workout">Workout</option>
                <option value="Evening">Evening</option>
                <option value="Mind">Mind</option>
              </select>
              <button
                onClick={addRoutine}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            
            <div className="space-y-3 relative z-10">
              {routines.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No routines set for today. Add one above!
                </p>
              ) : (
                <AnimatePresence>
                  {routines.map((item, i) => {
                    const Icon = getIcon(item.category);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
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

                        <button
                          onClick={(e) => deleteRoutine(item.id, e)}
                          title="Delete routine"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-all hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Daily Completion</h2>
            
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
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-blue-100 uppercase tracking-wider">AI Coach Insight</h2>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed italic">
              "Consistency builds momentum. Completing your core routines every morning optimizes your mental state for high-focus deep work."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
