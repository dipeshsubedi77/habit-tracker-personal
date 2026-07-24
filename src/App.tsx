import React from 'react';
import { Sidebar, BottomNav } from './lib/Sidebar';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Workout } from './components/Workout';
import { AICoach } from './components/AICoach';
import { Tasks } from './components/Tasks';
import { Journal } from './components/Journal';
import { Gratitude } from './components/Gratitude';

export default function App() {
  return (
    <div className="flex h-[100dvh] bg-[#050505] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10 relative">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/gratitude" element={<Gratitude />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/coach" element={<AICoach />} />
          <Route path="/profile" element={<div className="text-center mt-20 text-zinc-500 relative z-10">Profile settings and configuration coming soon...</div>} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
