import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarHeart, Trophy, Save, Sparkles, Check, UploadCloud, 
  Trash2, Image as ImageIcon, Camera, History, Copy, ChevronRight, Search 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GratitudeHistoryItem {
  date: string;
  wins: string[];
  gratitudes: string[];
  photo?: string;
}

export function Gratitude() {
  const [wins, setWins] = useState(['', '', '']);
  const [gratitudes, setGratitudes] = useState(['', '', '']);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gratitude Memory Photo
  const [memoryPhoto, setMemoryPhoto] = useState<string | null>(null);
  const [memoryPhotoKb, setMemoryPhotoKb] = useState<number>(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History & Search
  const [history, setHistory] = useState<GratitudeHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<GratitudeHistoryItem | null>(null);
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTodayData();
    loadGratitudeHistory();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadGratitudeHistory = () => {
    const itemsMap: Record<string, GratitudeHistoryItem> = {};

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wins_')) {
        const dateStr = key.replace('wins_', '');
        if (!itemsMap[dateStr]) itemsMap[dateStr] = { date: dateStr, wins: ['', '', ''], gratitudes: ['', '', ''] };
        try {
          itemsMap[dateStr].wins = JSON.parse(localStorage.getItem(key) || '["","",""]');
        } catch (e) {}
      } else if (key.startsWith('gratitudes_')) {
        const dateStr = key.replace('gratitudes_', '');
        if (!itemsMap[dateStr]) itemsMap[dateStr] = { date: dateStr, wins: ['', '', ''], gratitudes: ['', '', ''] };
        try {
          itemsMap[dateStr].gratitudes = JSON.parse(localStorage.getItem(key) || '["","",""]');
        } catch (e) {}
      } else if (key.startsWith('gratitude_photo_')) {
        const dateStr = key.replace('gratitude_photo_', '');
        if (!itemsMap[dateStr]) itemsMap[dateStr] = { date: dateStr, wins: ['', '', ''], gratitudes: ['', '', ''] };
        itemsMap[dateStr].photo = localStorage.getItem(key) || undefined;
      }
    });

    const sortedList = Object.values(itemsMap).filter(item => 
      item.wins.some(w => w.trim()) || item.gratitudes.some(g => g.trim()) || item.photo
    ).sort((a, b) => b.date.localeCompare(a.date));

    setHistory(sortedList);
  };

  const fetchTodayData = async () => {
    const savedWins = localStorage.getItem(`wins_${todayStr}`);
    const savedGrat = localStorage.getItem(`gratitudes_${todayStr}`);
    const savedPhoto = localStorage.getItem(`gratitude_photo_${todayStr}`);

    if (savedWins) {
      try { setWins(JSON.parse(savedWins)); } catch (e) {}
    }
    if (savedGrat) {
      try { setGratitudes(JSON.parse(savedGrat)); } catch (e) {}
    }
    if (savedPhoto) {
      setMemoryPhoto(savedPhoto);
      setMemoryPhotoKb(Math.round((savedPhoto.length * (3 / 4)) / 1024));
    }

    try {
      const [winsRes, gradRes] = await Promise.all([
        supabase.from('daily_wins').select('*').gte('created_at', todayStr).limit(1).single(),
        supabase.from('gratitudes').select('*').gte('created_at', todayStr).limit(1).single()
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

  // Image compression helper (max 800px width/height, quality 0.65 JPEG)
  const compressImage = (file: File): Promise<{ compressedBase64: string; compSizeKb: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

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

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          const compSizeKb = Math.round((compressedBase64.length * (3 / 4)) / 1024);

          resolve({ compressedBase64, compSizeKb });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { compressedBase64, compSizeKb } = await compressImage(file);
      setMemoryPhoto(compressedBase64);
      setMemoryPhotoKb(compSizeKb);
      localStorage.setItem(`gratitude_photo_${todayStr}`, compressedBase64);
      loadGratitudeHistory();
      showToast(`Memory photo compressed to ${compSizeKb}KB and saved!`);
    } catch (err) {
      console.error('Error compressing image', err);
      showToast('Error uploading image');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setMemoryPhoto(null);
    setMemoryPhotoKb(0);
    localStorage.removeItem(`gratitude_photo_${todayStr}`);
    loadGratitudeHistory();
    showToast('Photo removed.');
  };

  const saveData = async () => {
    setSaving(true);

    localStorage.setItem(`wins_${todayStr}`, JSON.stringify(wins));
    localStorage.setItem(`gratitudes_${todayStr}`, JSON.stringify(gratitudes));
    setLastSaved(new Date());

    // Mark completion in log
    const hasContent = wins.some(w => w.trim() !== '') || gratitudes.some(g => g.trim() !== '');
    if (hasContent) {
      const logSaved = localStorage.getItem('completed_days_log');
      const log: string[] = logSaved ? JSON.parse(logSaved) : [];
      if (!log.includes(todayStr)) {
        log.push(todayStr);
        localStorage.setItem('completed_days_log', JSON.stringify(log));
      }
    }

    loadGratitudeHistory();
    showToast('Gratitude & Wins saved successfully!');

    try {
      const winObj = { win1: wins[0], win2: wins[1], win3: wins[2] };
      const gradObj = { item1: gratitudes[0], item2: gratitudes[1], item3: gratitudes[2] };

      await Promise.all([
        supabase.from('daily_wins').insert([winObj]),
        supabase.from('gratitudes').insert([gradObj])
      ]);
    } catch (e) {
      console.log('Saved to local storage', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteHistoryEntry = (dateStr: string) => {
    localStorage.removeItem(`wins_${dateStr}`);
    localStorage.removeItem(`gratitudes_${dateStr}`);
    localStorage.removeItem(`gratitude_photo_${dateStr}`);
    if (dateStr === todayStr) {
      setWins(['', '', '']);
      setGratitudes(['', '', '']);
      setMemoryPhoto(null);
    }
    if (selectedHistoryItem?.date === dateStr) {
      setSelectedHistoryItem(null);
    }
    loadGratitudeHistory();
    showToast(`Deleted entry for ${dateStr}`);
  };

  const copyEntryText = (item: GratitudeHistoryItem) => {
    const winsTxt = item.wins.filter(w => w.trim()).map((w, i) => `${i + 1}. ${w}`).join('\n');
    const gratTxt = item.gratitudes.filter(g => g.trim()).map((g, i) => `${i + 1}. ${g}`).join('\n');
    const fullText = `Dipesh's Gratitude & Wins (${item.date})\n\nDaily Wins:\n${winsTxt || 'None'}\n\nDaily Gratitude:\n${gratTxt || 'None'}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDate(item.date);
    setTimeout(() => setCopiedDate(null), 2000);
    showToast('Copied entry to clipboard!');
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

  const filteredHistory = history.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.date.includes(q) ||
      item.wins.some(w => w.toLowerCase().includes(q)) ||
      item.gratitudes.some(g => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-pink-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-pink-400/30 text-sm font-medium flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Dipesh's Gratitude Space
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarHeart className="w-8 h-8 text-pink-400" />
            Gratitude & Daily Wins
          </h1>
          <p className="text-slate-400 mt-1">Wire your mind for positivity and self-discipline, Dipesh.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
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
                  className="w-full bg-transparent border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
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
                  className="w-full bg-transparent border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 transition-colors text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Photo Attachment Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Today's Highlight Memory Photo</h3>
              <p className="text-xs text-slate-400">Attach a photo representing your favorite win or gratitude moment today (compressed &lt; 30KB).</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden" 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              {uploadingPhoto ? 'Compressing...' : 'Upload Photo'}
            </button>
          </div>
        </div>

        {memoryPhoto ? (
          <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 max-w-sm mx-auto group">
            <img src={memoryPhoto} alt="Memory highlight" className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-pink-500/30 text-pink-200 border border-pink-500/40 px-2 py-0.5 rounded-md font-mono">
                  {memoryPhotoKb} KB
                </span>
                <button
                  onClick={removePhoto}
                  className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-semibold text-white">Dipesh's Daily Memory Highlight ({todayStr})</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">No memory photo attached for today.</p>
          </div>
        )}
      </div>

      {/* Saved Gratitude & Wins Entries History */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Saved Gratitude & Daily Wins History</h2>
              <p className="text-xs text-slate-400">All your saved positive moments & highlights</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search wins or gratitudes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            {searchQuery ? `No entries matching "${searchQuery}"` : "No saved gratitude entries found. Fill out your wins & gratitude above and click 'Save Entry'!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHistory.map((item) => {
              const isToday = item.date === todayStr;
              const isSelected = selectedHistoryItem?.date === item.date;

              return (
                <div
                  key={item.date}
                  onClick={() => setSelectedHistoryItem(item)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-pink-500/10 border-pink-500/50 text-white' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarHeart className="w-4 h-4 text-pink-400" />
                      {isToday ? "Today" : item.date}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyEntryText(item);
                        }}
                        className="text-slate-500 hover:text-pink-400 p-1"
                        title="Copy entry"
                      >
                        {copiedDate === item.date ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryEntry(item.date);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.photo && (
                    <div className="rounded-xl overflow-hidden h-28 bg-black/40 border border-white/10">
                      <img src={item.photo} alt="Memory photo" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Wins preview */}
                  {item.wins.some(w => w.trim()) && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Wins
                      </span>
                      <ul className="text-xs space-y-0.5 text-slate-300 pl-2">
                        {item.wins.filter(w => w.trim()).map((w, idx) => (
                          <li key={idx} className="line-clamp-1">&bull; {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gratitude preview */}
                  {item.gratitudes.some(g => g.trim()) && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                        <CalendarHeart className="w-3 h-3" /> Gratitudes
                      </span>
                      <ul className="text-xs space-y-0.5 text-slate-300 pl-2">
                        {item.gratitudes.filter(g => g.trim()).map((g, idx) => (
                          <li key={idx} className="line-clamp-1">&bull; {g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end text-[11px] text-pink-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span className="flex items-center gap-1">View Full Entry <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Gratitude Detail Modal / Expanded View */}
        {selectedHistoryItem && (
          <div className="mt-4 p-5 rounded-2xl bg-[#1d0e1c] border border-pink-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CalendarHeart className="w-4 h-4 text-pink-400" />
                Gratitude & Wins Detail — {selectedHistoryItem.date} {selectedHistoryItem.date === todayStr && "(Today)"}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyEntryText(selectedHistoryItem)}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Entry
                </button>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-xl bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>

            {selectedHistoryItem.photo && (
              <div className="rounded-2xl overflow-hidden max-h-64 bg-black flex justify-center border border-white/10">
                <img src={selectedHistoryItem.photo} alt="Memory photo" className="max-h-64 object-contain" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> Three Wins
                </h4>
                <ol className="space-y-1.5 text-slate-200 text-xs">
                  {selectedHistoryItem.wins.map((w, idx) => (
                    <li key={idx} className="p-2 rounded-xl bg-white/5">
                      <span className="font-bold text-amber-400 mr-2">0{idx + 1}.</span> {w || <span className="italic text-slate-600">Not entered</span>}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <CalendarHeart className="w-4 h-4" /> Daily Gratitudes
                </h4>
                <ol className="space-y-1.5 text-slate-200 text-xs">
                  {selectedHistoryItem.gratitudes.map((g, idx) => (
                    <li key={idx} className="p-2 rounded-xl bg-white/5">
                      <span className="font-bold text-pink-400 mr-2">0{idx + 1}.</span> {g || <span className="italic text-slate-600">Not entered</span>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

