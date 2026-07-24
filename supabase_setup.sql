-- Run this SQL in your Supabase SQL Editor to create the tables

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT DEFAULT 'Beginner',
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert a dummy user so foreign keys don't fail
INSERT INTO users (email, password_hash, name) 
VALUES ('dummy@example.com', 'dummy', 'Dummy User')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS routines (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  date TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  mood TEXT,
  energy_level INTEGER,
  stress_level INTEGER,
  date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_wins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1,
  win1 TEXT NOT NULL,
  win2 TEXT,
  win3 TEXT,
  date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS gratitudes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1,
  item1 TEXT NOT NULL,
  item2 TEXT,
  item3 TEXT,
  date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
