import React, { useState, useEffect } from 'react';
import { 
  BookHeart, Save, Smile, Meh, Frown, Flame, Calendar, Trash2, 
  Clock, History, ChevronRight, Sparkles, Tag, Search, Copy, 
  Check, RefreshCw, Feather, FileText, HeartHandshake, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SavedJournalEntry {
  date: string; // YYYY-MM-DD
  content: string;
  lessons: string;
  mood: string | null;
  energy_level: number;
  stress_level: number;
  tags?: string[];
  updated_at: string;
}

const PROMPTS = [
  "What is one small victory or moment of peace I experienced today?",
  "What challenged me today, and how did I handle or learn from it?",
  "What am I grateful for right now, and why?",
  "What is something I can forgive myself for or let go of today?",
  "How did I take care of my physical or mental well-being today?",
  "What am I looking forward to tomorrow?"
];

const AVAILABLE_TAGS = [
  "Growth", "Mindset", "Health", "Productivity", 
  "Gratitude", "Peace", "Challenge", "Ideas"
];

export function Journal() {
  const [mood, setMood] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [lessons, setLessons] = useState('');
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  // Auto-delete threshold in days (e.g. 2, 3, 5, 7 days)
  const [retentionDays, setRetentionDays] = useState<number>(3);
  
  // Past entries list & Search
  const [pastEntries, setPastEntries] = useState<SavedJournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPastEntry, setSelectedPastEntry] = useState<SavedJournalEntry | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    cleanupOldJournals(retentionDays);
    fetchTodayJournal();
    loadPastJournals();
  }, [retentionDays]);

  // Clean up journal entries older than retentionDays
  const cleanupOldJournals = (daysLimit: number) => {
    const now = new Date();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('journal_')) {
        const datePart = key.replace('journal_', ''); // YYYY-MM-DD
        const entryDate = new Date(datePart);
        if (!isNaN(entryDate.getTime())) {
          const diffInMs = now.getTime() - entryDate.getTime();
          const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
          
          if (diffInDays > daysLimit) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
  };

  const loadPastJournals = () => {
    const entries: SavedJournalEntry[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('journal_')) {
        const datePart = key.replace('journal_', '');
        const savedLocal = localStorage.getItem(key);
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            entries.push({
              date: datePart,
              content: parsed.content || '',
              lessons: parsed.lessons || '',
              mood: parsed.mood || null,
              energy_level: parsed.energy_level || 5,
              stress_level: parsed.stress_level || 5,
              tags: parsed.tags || [],
              updated_at: parsed.updated_at || new Date().toISOString(),
            });
          } catch (e) {
            console.error('Error parsing journal entry', e);
          }
        }
      }
    }

    // Sort descending by date
    entries.sort((a, b) => b.date.localeCompare(a.date));
    setPastEntries(entries);
  };

  const fetchTodayJournal = async () => {
    const savedLocal = localStorage.getItem(`journal_${todayStr}`);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        setContent(parsed.content || '');
        setLessons(parsed.lessons || '');
        setMood(parsed.mood ? parseInt(parsed.mood) : null);
        setEnergy(parsed.energy_level || 5);
        setStress(parsed.stress_level || 5);
        setSelectedTags(parsed.tags || []);
      } catch (e) {
        console.error('Failed to parse local journal', e);
      }
    }

    try {
      const { data } = await supabase
        .from('journals')
        .select('*')
        .gte('created_at', todayStr)
        .limit(1)
        .single();
      
      if (data) {
        if (!savedLocal) {
          setContent(data.content || '');
          setMood(data.mood ? parseInt(data.mood) : null);
          setEnergy(data.energy_level || 5);
          setStress(data.stress_level || 5);
        }
      }
    } catch (e) {
      console.log('No journal entry in DB or offline, relying on local storage');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveJournal = async () => {
    setSaving(true);
    
    const journalObj: SavedJournalEntry = {
      date: todayStr,
      content,
      lessons,
      mood: mood ? mood.toString() : null,
      energy_level: energy,
      stress_level: stress,
      tags: selectedTags,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(`journal_${todayStr}`, JSON.stringify(journalObj));
    const now = new Date();
    setLastSaved(now);

    loadPastJournals();
    showToast('Reflection saved successfully!');

    try {
      await supabase.from('journals').insert([{
        content: content || ' ',
        mood: mood ? mood.toString() : null,
        energy_level: energy,
        stress_level: stress
      }]);
    } catch (e) {
      console.log('Saved to local storage (Supabase save skipped/failed)', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = (dateKey: string) => {
    localStorage.removeItem(`journal_${dateKey}`);
    if (dateKey === todayStr) {
      setContent('');
      setLessons('');
      setMood(null);
      setSelectedTags([]);
    }
    if (selectedPastEntry?.date === dateKey) {
      setSelectedPastEntry(null);
    }
    loadPastJournals();
    showToast(`Deleted journal entry for ${dateKey}`);
  };

  const copyToClipboard = (entry: SavedJournalEntry) => {
    const text = `Journal Entry (${entry.date})\n\nReflection:\n${entry.content}\n\nLessons:\n${entry.lessons || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedDate(entry.date);
    setTimeout(() => setCopiedDate(null), 2000);
    showToast('Copied to clipboard!');
  };

  const insertPrompt = (pText: string) => {
    setContent(prev => prev ? `${prev}\n\nPrompt: ${pText}\n` : `Prompt: ${pText}\n`);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getMoodIcon = (m: string | number | null) => {
    if (!m) return null;
    const val = typeof m === 'string' ? parseInt(m) : m;
    if (val === 3) return <Smile className="w-4 h-4 text-emerald-400" />;
    if (val === 2) return <Meh className="w-4 h-4 text-amber-400" />;
    if (val === 1) return <Frown className="w-4 h-4 text-rose-400" />;
    return null;
  };

  // Metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  // Filtered past entries
  const filteredEntries = pastEntries.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.date.includes(q) || 
      e.content.toLowerCase().includes(q) || 
      e.lessons.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-blue-400/30 text-sm font-medium flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BookHeart className="w-8 h-8 text-blue-500" />
            Daily Journal
          </h1>
          <p className="text-slate-400 mt-1">Reflect, release, and recharge.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Retention Period Setting */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto-delete after:</span>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value))}
              className="bg-[#121212] text-blue-400 border border-white/10 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none"
            >
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>

          {lastSaved && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <button 
            onClick={saveJournal}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </header>

      {/* Writing Prompt Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-blue-900/30 border border-blue-500/20 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Daily Writing Prompt</span>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              "{PROMPTS[promptIndex]}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setPromptIndex((prev) => (prev + 1) % PROMPTS.length)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-xs flex items-center gap-1.5"
            title="Next prompt"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Next Prompt
          </button>

          <button
            onClick={() => insertPrompt(PROMPTS[promptIndex])}
            className="px-3 py-2 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-all text-xs font-medium flex items-center gap-1.5"
          >
            <Feather className="w-3.5 h-3.5" /> Use Prompt
          </button>
        </div>
      </div>

      {/* Main Journal Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Reflection Area */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Today's Reflection ({todayStr})
              </label>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{wordCount} words</span>
                <span>&bull;</span>
                <span>~{readingTimeMinutes} min read</span>
              </div>
            </div>

            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Brain dump your thoughts here. What was on your mind today? No filtering needed..."
              className="w-full bg-transparent border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm leading-relaxed"
            />

            {/* Tags selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                Category Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map(t => {
                  const isSelected = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-medium transition-all border",
                        isSelected 
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40" 
                          : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                      )}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lessons Learned */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              Lessons & Insights
            </label>
            <textarea 
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              rows={3}
              placeholder="What wisdom, realization, or takeaway did you gain today?"
              className="w-full bg-transparent border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Mood Check-in</h3>
            <div className="flex gap-2">
              {[
                { val: 3, label: 'Good', icon: Smile, color: 'hover:bg-emerald-500/20 hover:text-emerald-400', active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
                { val: 2, label: 'Okay', icon: Meh, color: 'hover:bg-amber-500/20 hover:text-amber-400', active: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
                { val: 1, label: 'Low', icon: Frown, color: 'hover:bg-rose-500/20 hover:text-rose-400', active: 'bg-rose-500/20 text-rose-400 border-rose-500/50' }
              ].map(m => (
                <button
                  key={m.val}
                  onClick={() => setMood(m.val)}
                  className={cn(
                    "flex-1 py-3 rounded-2xl border border-white/10 flex flex-col items-center gap-1.5 text-slate-500 transition-colors",
                    m.color,
                    mood === m.val ? m.active : ""
                  )}
                >
                  <m.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Energy Level
              </span>
              <span className="text-xs text-orange-400 font-bold">{energy}/10</span>
            </h3>
            <input 
              type="range" min="1" max="10" 
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" 
            />
            <div className="flex justify-between text-xs text-slate-600 mt-2">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Stress Level
              </span>
              <span className="text-xs text-purple-400 font-bold">{stress}/10</span>
            </h3>
            <input 
              type="range" min="1" max="10" 
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer" 
            />
            <div className="flex justify-between text-xs text-slate-600 mt-2">
              <span>Peaceful</span>
              <span>High Stress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Journal History & Viewer Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Recent Journal Entries</h2>
              <p className="text-xs text-slate-400">
                Entries auto-delete after {retentionDays} days to keep your space fresh
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reflections or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            {searchQuery ? `No journal entries matching "${searchQuery}"` : "No saved journal entries. Write a reflection above and click 'Save Entry'!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => {
              const isToday = entry.date === todayStr;
              const isSelected = selectedPastEntry?.date === entry.date;

              return (
                <div 
                  key={entry.date}
                  onClick={() => setSelectedPastEntry(entry)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden",
                    isSelected 
                      ? "bg-blue-500/10 border-blue-500/50 text-white shadow-lg shadow-blue-500/5" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold">
                        {isToday ? "Today" : entry.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getMoodIcon(entry.mood)}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(entry);
                        }}
                        title="Copy text"
                        className="text-slate-500 hover:text-blue-400 p-1 transition-colors"
                      >
                        {copiedDate === entry.date ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEntry(entry.date);
                        }}
                        title="Delete Entry"
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed italic">
                    "{entry.content || 'No reflection text written.'}"
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                    <span>Energy: {entry.energy_level}/10</span>
                    <span className="flex items-center gap-1 text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform">
                      View <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Entry Detail Modal / Expanded View */}
        {selectedPastEntry && (
          <div className="mt-4 p-5 rounded-2xl bg-[#0e1626] border border-blue-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white">
                  Journal Entry — {selectedPastEntry.date} {selectedPastEntry.date === todayStr && "(Today)"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(selectedPastEntry)}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Entry
                </button>

                <button
                  onClick={() => setSelectedPastEntry(null)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-xl bg-white/5 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reflection</h4>
                <p className="text-slate-200 whitespace-pre-wrap bg-black/30 p-4 rounded-2xl text-sm leading-relaxed border border-white/5">
                  {selectedPastEntry.content || 'No reflection recorded.'}
                </p>
              </div>

              {selectedPastEntry.lessons && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lessons & Insights</h4>
                  <p className="text-slate-200 whitespace-pre-wrap bg-black/30 p-4 rounded-2xl text-sm leading-relaxed border border-white/5">
                    {selectedPastEntry.lessons}
                  </p>
                </div>
              )}

              {selectedPastEntry.tags && selectedPastEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedPastEntry.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                <span>Mood: {selectedPastEntry.mood === '3' ? 'Good 😊' : selectedPastEntry.mood === '2' ? 'Okay 😐' : selectedPastEntry.mood === '1' ? 'Low 🙁' : 'Not set'}</span>
                <span>Energy: {selectedPastEntry.energy_level}/10</span>
                <span>Stress: {selectedPastEntry.stress_level}/10</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
