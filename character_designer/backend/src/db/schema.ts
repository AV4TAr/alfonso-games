import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const characters = sqliteTable('characters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['player', 'enemy', 'boss'] }).notNull(),
  game: text('game').notNull(),
  currentVersion: integer('current_version').notNull().default(1),
  gridSize: integer('grid_size').notNull().default(32),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const characterVersions = sqliteTable('character_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  pixelData: text('pixel_data').notNull(), // JSON stringified 2D array
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type CharacterVersion = typeof characterVersions.$inferSelect;
export type NewCharacterVersion = typeof characterVersions.$inferInsert;
