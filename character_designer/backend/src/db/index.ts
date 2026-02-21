import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import * as schema from './schema.js';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// Ensure data directory exists
await mkdir(dirname(config.databasePath), { recursive: true });

// Create SQLite database connection
const sqlite = new Database(config.databasePath);
sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency

export const db = drizzle(sqlite, { schema });

// Initialize database schema (simple migrations for development)
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('player', 'enemy', 'boss')),
        game TEXT NOT NULL,
        current_version INTEGER NOT NULL DEFAULT 1,
        grid_size INTEGER NOT NULL DEFAULT 32,
        created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS character_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        pixel_data TEXT NOT NULL,
        created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_character_versions_character_id
        ON character_versions(character_id);

      CREATE INDEX IF NOT EXISTS idx_character_versions_version
        ON character_versions(character_id, version);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
