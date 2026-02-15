import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  hadCraving: boolean('had_craving').notNull(),
  triggers: jsonb('triggers').$type<string[]>().notNull().default([]),
  intensity: integer('intensity'),
  toolsUsed: jsonb('tools_used').$type<string[]>().notNull().default([]),
  outcome: text('outcome', { enum: ['resisted', 'partial', 'used'] }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
