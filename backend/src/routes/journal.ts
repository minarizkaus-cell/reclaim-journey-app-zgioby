import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerJournalRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/journal - Get all journal entries for authenticated user
  app.fastify.get('/api/journal', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching journal entries');

    try {
      const entries = await app.db
        .select({
          id: schema.journalEntries.id,
          mood: schema.journalEntries.mood,
          triggers: schema.journalEntries.triggers,
          notes: schema.journalEntries.notes,
          createdAt: schema.journalEntries.createdAt,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .orderBy(desc(schema.journalEntries.createdAt));

      app.logger.info(
        { userId: session.user.id, count: entries.length },
        'Journal entries fetched successfully'
      );

      return entries;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to fetch journal entries'
      );
      throw error;
    }
  });

  // POST /api/journal - Create a new journal entry
  app.fastify.post('/api/journal', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as { mood: string; triggers?: string[]; notes?: string };
    const { mood, triggers = [], notes } = body;

    const validMoods = ['great', 'good', 'okay', 'struggling', 'difficult'];
    if (!validMoods.includes(mood)) {
      app.logger.warn(
        { userId: session.user.id, mood },
        'Invalid mood value provided'
      );
      return reply.code(400).send({ error: 'Invalid mood value' });
    }

    app.logger.info(
      { userId: session.user.id, mood, triggersCount: triggers.length },
      'Creating journal entry'
    );

    try {
      const [entry] = await app.db
        .insert(schema.journalEntries)
        .values({
          userId: session.user.id,
          mood: mood as 'great' | 'good' | 'okay' | 'struggling' | 'difficult',
          triggers: triggers.length > 0 ? triggers : null,
          notes: notes || null,
          createdAt: new Date(),
        })
        .returning({
          id: schema.journalEntries.id,
          mood: schema.journalEntries.mood,
          triggers: schema.journalEntries.triggers,
          notes: schema.journalEntries.notes,
          createdAt: schema.journalEntries.createdAt,
        });

      app.logger.info(
        { userId: session.user.id, entryId: entry.id },
        'Journal entry created successfully'
      );

      return entry;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body: request.body },
        'Failed to create journal entry'
      );
      throw error;
    }
  });

  // GET /api/journal/stats - Get mood statistics for authenticated user
  app.fastify.get('/api/journal/stats', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching journal statistics');

    try {
      // Get mood counts
      const moodCountsResult = await app.db
        .select({
          mood: schema.journalEntries.mood,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .groupBy(schema.journalEntries.mood);

      // Get total entries count
      const [{ totalEntries }] = await app.db
        .select({
          totalEntries: sql<number>`cast(count(*) as int)`,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id));

      // Get recent triggers
      const recentEntries = await app.db
        .select({
          triggers: schema.journalEntries.triggers,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .orderBy(desc(schema.journalEntries.createdAt))
        .limit(10);

      // Build mood counts object with default zeros
      const moodCounts = {
        great: 0,
        good: 0,
        okay: 0,
        struggling: 0,
        difficult: 0,
      };

      moodCountsResult.forEach(({ mood, count }) => {
        if (mood in moodCounts) {
          moodCounts[mood as keyof typeof moodCounts] = count;
        }
      });

      // Collect unique triggers from recent entries
      const triggersSet = new Set<string>();
      recentEntries.forEach(({ triggers }) => {
        if (triggers && Array.isArray(triggers)) {
          triggers.forEach((trigger) => {
            if (trigger) {
              triggersSet.add(trigger);
            }
          });
        }
      });

      const recentTriggers = Array.from(triggersSet);

      const stats = {
        moodCounts,
        totalEntries,
        recentTriggers,
      };

      app.logger.info(
        { userId: session.user.id, totalEntries, moodCounts },
        'Journal statistics retrieved successfully'
      );

      return stats;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to fetch journal statistics'
      );
      throw error;
    }
  });

  // DELETE /api/journal/:id - Delete a journal entry
  app.fastify.delete('/api/journal/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const params = request.params as { id: string };
    const { id } = params;

    app.logger.info(
      { userId: session.user.id, entryId: id },
      'Deleting journal entry'
    );

    try {
      // Verify the entry belongs to the user
      const [entry] = await app.db
        .select()
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.id, id));

      if (!entry) {
        app.logger.warn(
          { userId: session.user.id, entryId: id },
          'Journal entry not found'
        );
        return reply.code(404).send({ error: 'Journal entry not found' });
      }

      if (entry.userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, entryId: id, entryOwnerId: entry.userId },
          'User attempted to delete entry they do not own'
        );
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      await app.db
        .delete(schema.journalEntries)
        .where(eq(schema.journalEntries.id, id));

      app.logger.info(
        { userId: session.user.id, entryId: id },
        'Journal entry deleted successfully'
      );

      return { success: true };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, entryId: id },
        'Failed to delete journal entry'
      );
      throw error;
    }
  });
}
