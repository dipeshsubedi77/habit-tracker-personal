import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, Tag, Clock, Calendar, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export function Tasks() {
  const [tasks, setTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('user_tasks_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    fetchTasks();
  }, []);

  const saveTasksLocal = (updatedTasks: any[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('user_tasks_list', JSON.stringify(updatedTasks));
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        saveTasksLocal(data);
      }
    } catch (e) {
      console.log('Error fetching tasks from db, relying on local storage', e);
    }
  };

  const toggleTask = async (id: number | string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updated = tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t);
    saveTasksLocal(updated);

    try {
      await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', id);
    } catch (e) {
      console.log('Error updating task in db', e);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    const newTaskObj = {
      id: `task_${Date.now()}`,
      title: newTask.trim(),
      category: category,
      priority: priority,
      is_completed: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString(),
    };
    
    const updated = [newTaskObj, ...tasks];
    saveTasksLocal(updated);
    setNewTask('');
    
    try {
      await supabase.from('tasks').insert([{
        title: newTaskObj.title,
        category: newTaskObj.category,
        priority: newTaskObj.priority,
        is_completed: false
      }]);
    } catch (e) {
      console.log('Error inserting task to db', e);
    }
  };

  const deleteTask = async (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.filter(t => t.id !== id);
    saveTasksLocal(updated);

    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (e) {
      console.log('Error deleting task from db', e);
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

      {/* Task Input Bar */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-3 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <input 
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
          className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder:text-slate-500 px-3 text-sm"
        />

        <div className="flex items-center gap-2 px-2 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#121212] text-xs text-slate-300 border border-white/10 rounded-xl px-2 py-1.5 focus:outline-none"
          >
            <option value="Work">Work</option>
            <option value="Health">Health</option>
            <option value="Growth">Growth</option>
            <option value="Personal">Personal</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-[#121212] text-xs text-slate-300 border border-white/10 rounded-xl px-2 py-1.5 focus:outline-none"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Med Priority</option>
            <option value="High">High Priority</option>
          </select>

          <button 
            onClick={addTask}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-3xl p-6">
            <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No tasks yet</h3>
            <p className="text-xs text-slate-500 mt-1">Add your tasks above to organize your day and stay on track.</p>
          </div>
        ) : (
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
                      <Tag className="w-3 h-3" /> {task.category || 'General'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3 h-3" /> {task.time || 'Today'}
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  task.priority === 'High' ? "bg-red-500/10 text-red-400" : 
                  task.priority === 'Medium' ? "bg-amber-500/10 text-amber-400" : 
                  "bg-white/10 text-slate-500"
                )}>
                  {task.priority || 'Medium'}
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
        )}
      </div>
    </div>
  );
}
