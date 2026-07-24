import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  level: text('level').default('Beginner'),
  currentStreak: integer('current_streak').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routines = pgTable('routines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(), // Morning, Workout, Afternoon, Evening
  isCompleted: boolean('is_completed').default(false),
  notes: text('notes'),
  date: timestamp('date').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  isCompleted: boolean('is_completed').default(false),
  priority: text('priority').default('medium'),
  category: text('category'),
  deadline: timestamp('deadline'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journals = pgTable('journals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  mood: text('mood'),
  energyLevel: integer('energy_level'),
  stressLevel: integer('stress_level'),
  date: timestamp('date').defaultNow().notNull(),
});

export const dailyWins = pgTable('daily_wins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  win1: text('win1').notNull(),
  win2: text('win2'),
  win3: text('win3'),
  date: timestamp('date').defaultNow().notNull(),
});

export const gratitudes = pgTable('gratitudes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  item1: text('item1').notNull(),
  item2: text('item2'),
  item3: text('item3'),
  date: timestamp('date').defaultNow().notNull(),
});

export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: text('role').notNull(), // 'user' or 'coach'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});
