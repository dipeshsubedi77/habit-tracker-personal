import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckCircle, BookHeart, CalendarHeart, Dumbbell, Sparkles, UserCircle } from 'lucide-react';
import { cn } from './utils';

const navItems = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckCircle },
  { name: 'Journal', path: '/journal', icon: BookHeart },
  { name: 'Gratitude', path: '/gratitude', icon: CalendarHeart },
  { name: 'Workout', path: '/workout', icon: Dumbbell },
  { name: 'Coach', path: '/coach', icon: Sparkles },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white/5 border-r border-white/10 h-screen hidden md:flex flex-col text-slate-200 z-50 relative">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Huberman OS
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 m-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
          D
        </div>
        <div>
          <p className="text-sm font-medium">Dipesh</p>
          <p className="text-xs text-blue-400 font-medium">Personal OS</p>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors",
                isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "fill-blue-500/20")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
