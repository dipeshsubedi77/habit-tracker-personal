import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, Tag, Clock, Calendar, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const MOCK_TASKS = [
  { id: 1, title: 'Deep Work: Project Proposal', category: 'Work', priority: 'High', is_completed: false, time: '2:00 PM' },
  { id: 2, title: 'Read 20 pages of Huberman book', category: 'Growth', priority: 'Medium', is_completed: false, time: '8:00 PM' },
  { id: 3, title: 'Meal Prep', category: 'Health', priority: 'High', is_completed: true, time: '12:00 PM' },
  { id: 4, title: 'Email Inbox Zero', category: 'Work', priority: 'Low', is_completed: false, time: '4:30 PM' },
];

export function Tasks() {
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setTasks(data);
      }
    } catch (e) {
      console.log('Error fetching tasks, falling back to mock data', e);
    }
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t));
    try {
      await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', id);
    } catch (e) {
      console.log('Error updating task', e);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    const newTaskObj = {
      title: newTask,
      category: 'General',
      priority: 'Medium',
      is_completed: false,
    };
    
    const tempId = Date.now();
    setTasks([{ id: tempId, time: 'Anytime', ...newTaskObj }, ...tasks]);
    setNewTask('');
    
    try {
      const { data, error } = await supabase.from('tasks').insert([newTaskObj]).select();
      if (error) throw error;
      if (data) setTasks(prev => prev.map(t => t.id === tempId ? { ...data[0], time: 'Anytime' } : t));
    } catch (e) {
      console.log('Error adding task', e);
    }
  };

  const deleteTask = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting task', e);
    }
  };

  const progress = tasks.length > 0 ? (tasks.filter(t => t.is_completed).length / tasks.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CheckCircle className="w-7 h-7 text-blue-500" />
            Task Manager
          </h1>
          <p className="text-slate-400 mt-1">Organize your priorities and execute.</p>
        </div>
        
        <div className="w-48">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Daily Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-2 flex items-center gap-2">
        <input 
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a new task for today..."
          className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder:text-slate-500 px-4"
        />
        <button 
          onClick={addTask}
          className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={task.id}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-2xl border transition-colors cursor-pointer",
                task.is_completed ? "bg-white/5 border-white/5" : "bg-white/5 border-white/10 hover:border-white/20"
              )}
              onClick={() => toggleTask(task.id)}
            >
              <button className="flex-shrink-0 text-slate-500 hover:text-blue-400 transition-colors">
                {task.is_completed ? (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
              
              <div className="flex-1">
                <p className={cn("text-sm font-medium transition-colors", task.is_completed ? "text-slate-500 line-through" : "text-slate-200")}>
                  {task.title}
                </p>
                <div className="flex items-center gap-4 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Tag className="w-3 h-3" /> {task.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" /> {task.time}
                  </span>
                </div>
              </div>

              <div className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                task.priority === 'High' ? "bg-red-500/10 text-red-400" : 
                task.priority === 'Medium' ? "bg-amber-500/10 text-amber-400" : 
                "bg-white/10 text-slate-500"
              )}>
                {task.priority}
              </div>

              <button 
                onClick={(e) => deleteTask(task.id, e)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
