import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, CheckCircle2, Info, Dumbbell, Activity, Plus, Trash2, Calendar, Check, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface CustomExercise {
  id: string;
  exercise: string;
  day: string; // e.g. 'Monday', 'Tuesday'
  section: string; // 'Workout', 'Warm-up', 'Core', 'Cooldown'
  sets: string;
  reps_or_duration: string;
  notes?: string;
  isCustom: boolean;
}

export function Workout() {
  const [activeTab, setActiveTab] = useState<'today' | 'progressions'>('today');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const todayName = daysOfWeek[todayIndex];
  const tomorrowName = daysOfWeek[(todayIndex + 1) % 7];

  const [selectedDay, setSelectedDay] = useState(todayName);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Custom routines state
  const [customRoutines, setCustomRoutines] = useState<CustomExercise[]>([]);
  const [showAddForm, setShowAddForm] = useState(true);
  const [deleteOnComplete, setDeleteOnComplete] = useState(true);

  // Form states
  const [newExercise, setNewExercise] = useState('');
  const [targetDayOption, setTargetDayOption] = useState<'today' | 'tomorrow' | 'selected'>('today');
  const [newSection, setNewSection] = useState('Workout');
  const [newSets, setNewSets] = useState('3');
  const [newReps, setNewReps] = useState('10-12 reps');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchUserLevel();
    loadCustomRoutines();
  }, []);

  const fetchUserLevel = async () => {
    try {
      const { data } = await supabase.from('users').select('level').limit(1).single();
      if (data && data.level) {
        setLevel(data.level as any);
      }
    } catch (e) {
      console.log('Error fetching user level', e);
    }
  };

  const loadCustomRoutines = async () => {
    const localData = localStorage.getItem('custom_workout_routines');
    if (localData) {
      try {
        setCustomRoutines(JSON.parse(localData));
      } catch (e) {
        console.error('Failed to parse local custom workouts', e);
      }
    }

    try {
      const { data, error } = await supabase.from('custom_workouts').select('*');
      if (!error && data && data.length > 0) {
        const formatted = data.map((item: any) => ({
          id: item.id.toString(),
          exercise: item.exercise,
          day: item.day,
          section: item.section || 'Workout',
          sets: item.sets || '-',
          reps_or_duration: item.reps_or_duration || '-',
          notes: item.notes || '',
          isCustom: true,
        }));
        setCustomRoutines(formatted);
        localStorage.setItem('custom_workout_routines', JSON.stringify(formatted));
      }
    } catch (e) {
      console.log('Error fetching custom workouts from db, using local storage', e);
    }
  };

  const updateLevel = async (newLevel: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setLevel(newLevel);
    try {
      await supabase.from('users').update({ level: newLevel }).eq('id', 1);
    } catch (e) {
      console.log('Error updating level', e);
    }
  };

  const saveCustomRoutines = async (updated: CustomExercise[]) => {
    setCustomRoutines(updated);
    localStorage.setItem('custom_workout_routines', JSON.stringify(updated));
  };

  const handleAddCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.trim()) return;

    let assignedDay = selectedDay;
    if (targetDayOption === 'today') {
      assignedDay = todayName;
    } else if (targetDayOption === 'tomorrow') {
      assignedDay = tomorrowName;
    }

    const newItem: CustomExercise = {
      id: `custom_${Date.now()}`,
      exercise: newExercise.trim(),
      day: assignedDay,
      section: newSection,
      sets: newSets || '-',
      reps_or_duration: newReps || '-',
      notes: newNotes,
      isCustom: true,
    };

    const updated = [newItem, ...customRoutines];
    await saveCustomRoutines(updated);

    // Sync DB if possible
    try {
      await supabase.from('custom_workouts').insert([{
        exercise: newItem.exercise,
        day: newItem.day,
        section: newItem.section,
        sets: newItem.sets,
        reps_or_duration: newItem.reps_or_duration,
        notes: newItem.notes,
      }]);
    } catch (err) {
      console.log('Could not sync to DB', err);
    }

    // Reset form
    setNewExercise('');
    setNewNotes('');
  };

  const deleteCustomExercise = async (id: string) => {
    const updated = customRoutines.filter(c => c.id !== id);
    await saveCustomRoutines(updated);

    try {
      await supabase.from('custom_workouts').delete().eq('id', id);
    } catch (err) {
      console.log('Error deleting from db', err);
    }
  };

  // Workouts for selected day (purely user created)
  const allDayWorkouts = customRoutines.filter(c => c.day === selectedDay);
  const dayFocus = `Personal Routine (${selectedDay})`;

  const toggleExercise = (id: string) => {
    if (deleteOnComplete) {
      // Auto-delete exercise on completion
      deleteCustomExercise(id);
      return;
    }

    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const progress = allDayWorkouts.length > 0 
    ? (completedExercises.size / allDayWorkouts.length) * 100 
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-blue-500" />
            Calisthenics Engine
          </h1>
          <p className="text-slate-400 mt-1">Level: {level} &bull; {dayFocus}</p>
        </div>
        
        <div className="flex flex-col gap-3 items-end"> 
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(l => (
              <button 
                key={l}
                onClick={() => {
                  updateLevel(l);
                  setCompletedExercises(new Set());
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  level === l ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
            {daysOfWeek.map(d => {
              const isToday = d === todayName;
              const isTomorrow = d === tomorrowName;
              return (
                <button 
                  key={d}
                  onClick={() => {
                    setSelectedDay(d);
                    setCompletedExercises(new Set());
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1",
                    selectedDay === d ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {d.substring(0, 3)}
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Today" />}
                  {isTomorrow && <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" title="Tomorrow" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Add Custom Workout Banner / Button */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Add Custom Workout Routine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create routines for today ({todayName}) or schedule for tomorrow ({tomorrowName}). Auto-deletes on completion.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-medium text-sm transition-all flex items-center gap-2 justify-center"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Routine'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCustomExercise} className="space-y-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Exercise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond Push-ups, Dips, Plank"
                  value={newExercise}
                  onChange={e => setNewExercise(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Schedule For</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDayOption('today')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-colors",
                      targetDayOption === 'today'
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                        : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                    )}
                  >
                    Today ({todayName})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDayOption('tomorrow')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-colors",
                      targetDayOption === 'tomorrow'
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                    )}
                  >
                    Tomorrow ({tomorrowName})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDayOption('selected')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-colors",
                      targetDayOption === 'selected'
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                        : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                    )}
                  >
                    Selected ({selectedDay})
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Section</label>
                <select
                  value={newSection}
                  onChange={e => setNewSection(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Warm-up">Warm-up</option>
                  <option value="Workout">Workout</option>
                  <option value="Core">Core</option>
                  <option value="Cooldown">Cooldown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sets</label>
                <input
                  type="text"
                  placeholder="e.g. 3 or 4"
                  value={newSets}
                  onChange={e => setNewSets(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target / Reps</label>
                <input
                  type="text"
                  placeholder="e.g. 12 reps or 45s hold"
                  value={newReps}
                  onChange={e => setNewReps(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Explode on push, 60s rest between sets"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOnComplete}
                  onChange={e => setDeleteOnComplete(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-0"
                />
                Auto-remove custom workouts when completed
              </label>

              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Save Routine
              </button>
            </div>
          </form>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'today' ? (
          <motion.div 
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-4">
                {allDayWorkouts.length === 0 && (
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center text-slate-400">
                    No workouts scheduled for {selectedDay}. Click "Add Routine" above to add exercises!
                  </div>
                )}

                {allDayWorkouts.map((exercise) => {
                  const isCompleted = completedExercises.has(exercise.id);
                  return (
                    <div 
                      key={exercise.id} 
                      className="bg-white/5 border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 p-4 rounded-3xl flex flex-col md:flex-row md:items-center gap-6 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/20 text-amber-400">
                            {exercise.section}
                          </span>
                          <h3 className={cn("text-lg font-semibold", isCompleted ? "text-slate-500 line-through" : "text-white")}>
                            {exercise.exercise}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          {exercise.sets !== "-" && <p><span className="text-slate-500">Sets:</span> {exercise.sets}</p>}
                          {exercise.reps_or_duration !== "-" && <p><span className="text-slate-500">Target:</span> {exercise.reps_or_duration}</p>}
                        </div>
                        {exercise.notes && (
                           <p className="text-xs text-slate-500 mt-2 italic">{exercise.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 justify-end border-t border-white/10 md:border-t-0 pt-4 md:pt-0">
                        <button 
                          onClick={() => deleteCustomExercise(exercise.id)}
                          title="Delete workout"
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => toggleExercise(exercise.id)}
                          className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all min-w-[110px] justify-center",
                            isCompleted 
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" 
                              : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                          )}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Done
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-current" /> Complete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="md:col-span-1">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sticky top-6">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                    <Dumbbell className="w-4 h-4 text-slate-500" />
                    Session Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Focus</p>
                      <p className="text-sm font-medium text-slate-200">{dayFocus}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Exercises</p>
                      <p className="text-lg font-medium text-amber-400">{allDayWorkouts.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Completion</p>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-right text-xs text-slate-500 mt-2">{Math.round(progress)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="progressions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Push Progression */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center justify-between">
                Push Mastery
                <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded text-slate-400">Level 2 / 10</span>
              </h3>
              <div className="space-y-4 relative">
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/10" />
                
                {[
                  { name: 'Wall Push-ups', status: 'mastered' },
                  { name: 'Incline Push-ups', status: 'current' },
                  { name: 'Standard Push-ups', status: 'locked' },
                  { name: 'Diamond Push-ups', status: 'locked' },
                  { name: 'Archer Push-ups', status: 'locked' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-4 border-[#050505]",
                      p.status === 'mastered' ? 'bg-blue-500' : p.status === 'current' ? 'bg-white' : 'bg-white/10'
                    )}>
                      {p.status === 'mastered' && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {p.status === 'current' && <div className="w-2 h-2 rounded-full bg-[#050505]" />}
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      p.status === 'mastered' ? 'text-slate-500' : p.status === 'current' ? 'text-white' : 'text-slate-600'
                    )}>{p.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pull Progression */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center justify-between">
                Pull Mastery
                <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded text-slate-400">Level 1 / 10</span>
              </h3>
              <div className="space-y-4 relative">
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/10" />
                
                {[
                  { name: 'Dead Hang (60s)', status: 'mastered' },
                  { name: 'Australian Rows', status: 'current' },
                  { name: 'Negative Pull-ups', status: 'locked' },
                  { name: 'Standard Pull-ups', status: 'locked' },
                  { name: 'Muscle-ups', status: 'locked' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-4 border-[#050505]",
                      p.status === 'mastered' ? 'bg-blue-500' : p.status === 'current' ? 'bg-white' : 'bg-white/10'
                    )}>
                      {p.status === 'mastered' && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {p.status === 'current' && <div className="w-2 h-2 rounded-full bg-[#050505]" />}
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      p.status === 'mastered' ? 'text-slate-500' : p.status === 'current' ? 'text-white' : 'text-slate-600'
                    )}>{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
