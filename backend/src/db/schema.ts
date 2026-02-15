import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mood: text('mood', { enum: ['great', 'good', 'okay', 'struggling', 'difficult'] }).notNull(),
  triggers: text('triggers').array(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
