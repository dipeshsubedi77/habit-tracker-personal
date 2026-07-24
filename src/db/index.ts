import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('DATABASE_URL environment variable is missing. Database operations will fail.');
      throw new Error('DATABASE_URL is not set.');
    }
    
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
  }
  return db;
}
