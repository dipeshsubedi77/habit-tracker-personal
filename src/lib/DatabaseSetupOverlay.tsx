import React from 'react';

export function DatabaseSetupOverlay() {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-zinc-100">Database Not Connected</h2>
      <p className="text-zinc-400">
        To use the full capabilities of Huberman Life OS (CRUD operations, workouts, AI coaching history), please connect your PostgreSQL database.
      </p>
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-left w-full">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-zinc-500 space-y-2">
          <li>Create a PostgreSQL database (e.g., Neon, Supabase, Cloud SQL)</li>
          <li>Open the Secrets/Environment Variables panel</li>
          <li>Add <code>DATABASE_URL</code> with your connection string</li>
          <li>Add <code>GEMINI_API_KEY</code> for the AI Coach features</li>
          <li>Restart the server</li>
        </ol>
      </div>
    </div>
  );
}
