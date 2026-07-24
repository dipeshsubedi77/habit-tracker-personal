import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Circle, Flame, Sun, Brain, Activity, Sparkles, Moon, Plus, Trash2, 
  Camera, Image as ImageIcon, Calendar, X, Eye, UploadCloud, Trophy, Zap, FileText, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProgressPhoto {
  id: string;
  date: string;
  imageData: string; // Compressed base64
  caption: string;
  originalSizeKb: number;
  compressedSizeKb: number;
}

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
  
  // Completed days & Streak
  const [completedDaysLog, setCompletedDaysLog] = useState<string[]>(() => {
    const saved = localStorage.getItem('completed_days_log');
    return saved ? JSON.parse(saved) : [];
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('current_streak');
    return saved ? parseInt(saved) : 1;
  });

  // Progress Photos
  const [photos, setPhotos] = useState<ProgressPhoto[]>(() => {
    const saved = localStorage.getItem('progress_photos');
    return saved ? JSON.parse(saved) : [];
  });

  const [uploading, setUploading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [previewImage, setPreviewImage] = useState<ProgressPhoto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, []);

  // Monitor routine completion and count completed days
  useEffect(() => {
    const isAllComplete = routines.length > 0 && routines.every(r => r.is_completed);
    
    if (isAllComplete) {
      if (!completedDaysLog.includes(todayStr)) {
        const updatedLog = [...completedDaysLog, todayStr];
        setCompletedDaysLog(updatedLog);
        localStorage.setItem('completed_days_log', JSON.stringify(updatedLog));
        
        // Update streak
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('current_streak', newStreak.toString());
        showToast('🎉 All routines completed! Day added to your total count!');
      }
    }
  }, [routines]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveRoutinesLocal = (updated: any[]) => {
    setRoutines(updated);
    localStorage.setItem(`routines_${todayStr}`, JSON.stringify(updated));
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('routines').select('*').gte('date', todayStr).order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        saveRoutinesLocal(data);
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
    const newObj = {
      id: `r_${Date.now()}`,
      title: newRoutineTitle.trim(),
      category: newRoutineCategory,
      is_completed: false,
      date: todayStr
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

  // Image Compression helper using Canvas (800px max, 0.65 JPEG quality)
  const compressImage = (file: File): Promise<{ compressedBase64: string; origSizeKb: number; compSizeKb: number }> => {
    return new Promise((resolve, reject) => {
      const origSizeKb = Math.round(file.size / 1024);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // max dimension to keep file size tiny

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.65 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          const compSizeKb = Math.round((compressedBase64.length * (3 / 4)) / 1024);

          resolve({ compressedBase64, origSizeKb, compSizeKb });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { compressedBase64, origSizeKb, compSizeKb } = await compressImage(file);

      const newPhoto: ProgressPhoto = {
        id: `photo_${Date.now()}`,
        date: todayStr,
        imageData: compressedBase64,
        caption: photoCaption.trim() || `Progress update for ${todayStr}`,
        originalSizeKb: origSizeKb,
        compressedSizeKb: compSizeKb,
      };

      const updatedPhotos = [newPhoto, ...photos];
      setPhotos(updatedPhotos);
      localStorage.setItem('progress_photos', JSON.stringify(updatedPhotos));

      setPhotoCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      showToast(`Photo saved! Compressed from ${origSizeKb}KB to ${compSizeKb}KB`);
    } catch (err) {
      console.error('Error compressing/saving image', err);
      showToast('Failed to process photo.');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    localStorage.setItem('progress_photos', JSON.stringify(updated));
    if (previewImage?.id === id) setPreviewImage(null);
    showToast('Photo removed.');
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
  const is100Percent = progress === 100 && routines.length > 0;
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-blue-400/30 text-sm font-medium flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header with Personalized Greeting for Dipesh */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Dipesh's Personal Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome Back, Dipesh 👋
          </h1>
          <p className="text-slate-400 mt-1">{todayDate} &bull; Stay focused, disciplined, and consistent.</p>
        </div>
        
        {/* Streak & Days Count Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Streak</p>
              <p className="text-lg font-bold text-white">{streak} Days</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Days Completed</p>
              <p className="text-lg font-bold text-white">{completedDaysLog.length} Days</p>
            </div>
          </div>
        </div>
      </header>

      {/* 100% Completion Celebration Banner */}
      {is100Percent && (
        <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-blue-900/40 border border-emerald-500/30 rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-200">Day Completed 100%!</h3>
              <p className="text-xs text-emerald-300/80">Great job Dipesh! Today is recorded in your completed days count.</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            +{completedDaysLog.length} Days Total
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Today's Routines */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Today's Routines
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {routines.filter(r => r.is_completed).length} / {routines.length} Done
              </span>
            </div>

            {/* Add Routine Input */}
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
        
        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Progress Dial */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Daily Progress</h2>
            
            <div className="flex items-center justify-center py-3">
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
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Done</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {is100Percent ? "Day Complete! Added to count." : "Complete all tasks to count today!"}
            </p>
          </div>

          {/* AI Insights */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-blue-100 uppercase tracking-wider">Dipesh's Daily Advice</h2>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed italic">
              "Focus on consistency over intensity. Each day completed builds neural momentum for compounding long-term success."
            </p>
          </div>
        </div>
      </div>

      {/* Compressed Image Upload & Progress Photo Preview Gallery */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Progress Photos & Milestones</h2>
              <p className="text-xs text-slate-400">Upload progress pictures — automatically compressed (~30KB) to save storage space.</p>
            </div>
          </div>

          {/* Upload trigger */}
          <div className="flex items-center gap-2">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden" 
            />

            <input
              type="text"
              placeholder="Caption (e.g. Day 10 Physique)..."
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-56"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              {uploading ? 'Compressing...' : 'Upload Photo'}
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl p-6">
            <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No progress photos uploaded yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload physique or milestone photos to track your journey over time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div 
                key={photo.id}
                onClick={() => setPreviewImage(photo)}
                className="group relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 aspect-square cursor-pointer hover:border-blue-500/50 transition-all"
              >
                <img 
                  src={photo.imageData} 
                  alt={photo.caption} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-md font-mono">
                      {photo.compressedSizeKb} KB
                    </span>
                    
                    <button
                      onClick={(e) => deletePhoto(photo.id, e)}
                      title="Delete photo"
                      className="p-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white line-clamp-1">{photo.caption}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {photo.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Full Progress Photo Preview */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0e1626] border border-blue-500/40 rounded-3xl max-w-xl w-full p-6 relative overflow-hidden space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{previewImage.caption}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Date: {previewImage.date}
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                    Compressed ({previewImage.originalSizeKb}KB &rarr; {previewImage.compressedSizeKb}KB)
                  </span>
                </p>
              </div>

              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh]">
              <img 
                src={previewImage.imageData} 
                alt={previewImage.caption} 
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Dipesh's Progress Log</span>
              <button
                onClick={(e) => deletePhoto(previewImage.id, e)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
