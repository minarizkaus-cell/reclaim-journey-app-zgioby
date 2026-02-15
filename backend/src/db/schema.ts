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

export const cravingSessions = pgTable('craving_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  triggers: jsonb('triggers').$type<string[]>().notNull().default([]),
  intensity: integer('intensity').notNull(),
  needType: text('need_type', { enum: ['distract', 'calm', 'support', 'escape', 'reflect'] }).notNull(),
});

export const copingTools = pgTable('coping_tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  duration: text('duration').notNull(),
  steps: jsonb('steps').$type<string[]>().notNull(),
  whenToUse: text('when_to_use').notNull(),
  isMandatory: boolean('is_mandatory').notNull().default(false),
});

export const copingToolCompletions = pgTable('coping_tool_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  toolId: uuid('tool_id').notNull().references(() => copingTools.id),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  sessionId: uuid('session_id').references(() => cravingSessions.id),
});
