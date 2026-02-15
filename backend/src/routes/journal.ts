import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, sql, isNotNull } from 'drizzle-orm';
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
          createdAt: schema.journalEntries.createdAt,
          hadCraving: schema.journalEntries.hadCraving,
          triggers: schema.journalEntries.triggers,
          intensity: schema.journalEntries.intensity,
          toolsUsed: schema.journalEntries.toolsUsed,
          outcome: schema.journalEntries.outcome,
          notes: schema.journalEntries.notes,
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
  app.fastify.post('/api/journal', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as {
      hadCraving: boolean;
      triggers: string[];
      intensity?: number;
      toolsUsed: string[];
      outcome: string;
      notes?: string;
    };

    const { hadCraving, triggers, intensity, toolsUsed, outcome, notes } = body;

    const validOutcomes = ['resisted', 'partial', 'used'];
    if (!validOutcomes.includes(outcome)) {
      app.logger.warn(
        { userId: session.user.id, outcome },
        'Invalid outcome value provided'
      );
      return reply.code(400).send({ error: 'Invalid outcome value' });
    }

    app.logger.info(
      {
        userId: session.user.id,
        hadCraving,
        outcome,
        triggersCount: triggers?.length || 0,
        toolsCount: toolsUsed?.length || 0,
      },
      'Creating journal entry'
    );

    try {
      const [entry] = await app.db
        .insert(schema.journalEntries)
        .values({
          userId: session.user.id,
          hadCraving,
          triggers: triggers && triggers.length > 0 ? triggers : [],
          intensity: intensity || null,
          toolsUsed: toolsUsed && toolsUsed.length > 0 ? toolsUsed : [],
          outcome: outcome as 'resisted' | 'partial' | 'used',
          notes: notes || null,
          createdAt: new Date(),
        })
        .returning({
          id: schema.journalEntries.id,
          createdAt: schema.journalEntries.createdAt,
          hadCraving: schema.journalEntries.hadCraving,
          triggers: schema.journalEntries.triggers,
          intensity: schema.journalEntries.intensity,
          toolsUsed: schema.journalEntries.toolsUsed,
          outcome: schema.journalEntries.outcome,
          notes: schema.journalEntries.notes,
        });

      app.logger.info(
        { userId: session.user.id, entryId: entry.id },
        'Journal entry created successfully'
      );

      return entry;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body },
        'Failed to create journal entry'
      );
      throw error;
    }
  });

  // PUT /api/journal/:id - Update a journal entry
  app.fastify.put('/api/journal/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const params = request.params as { id: string };
    const { id } = params;

    const body = request.body as {
      hadCraving?: boolean;
      triggers?: string[];
      intensity?: number;
      toolsUsed?: string[];
      outcome?: string;
      notes?: string;
    };

    app.logger.info(
      { userId: session.user.id, entryId: id, updateFields: Object.keys(body) },
      'Updating journal entry'
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
          'User attempted to update entry they do not own'
        );
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      // Validate outcome if provided
      if (body.outcome !== undefined) {
        const validOutcomes = ['resisted', 'partial', 'used'];
        if (!validOutcomes.includes(body.outcome)) {
          app.logger.warn(
            { userId: session.user.id, outcome: body.outcome },
            'Invalid outcome value provided'
          );
          return reply.code(400).send({ error: 'Invalid outcome value' });
        }
      }

      const updateData: Record<string, any> = {};

      if (body.hadCraving !== undefined) {
        updateData.hadCraving = body.hadCraving;
      }
      if (body.triggers !== undefined) {
        updateData.triggers = body.triggers && body.triggers.length > 0 ? body.triggers : [];
      }
      if (body.intensity !== undefined) {
        updateData.intensity = body.intensity || null;
      }
      if (body.toolsUsed !== undefined) {
        updateData.toolsUsed =
          body.toolsUsed && body.toolsUsed.length > 0 ? body.toolsUsed : [];
      }
      if (body.outcome !== undefined) {
        updateData.outcome = body.outcome;
      }
      if (body.notes !== undefined) {
        updateData.notes = body.notes || null;
      }

      if (Object.keys(updateData).length === 0) {
        app.logger.warn(
          { userId: session.user.id, entryId: id },
          'No fields to update in journal entry'
        );
        return reply.code(400).send({ error: 'No fields to update' });
      }

      const [updatedEntry] = await app.db
        .update(schema.journalEntries)
        .set(updateData)
        .where(eq(schema.journalEntries.id, id))
        .returning({
          id: schema.journalEntries.id,
          createdAt: schema.journalEntries.createdAt,
          hadCraving: schema.journalEntries.hadCraving,
          triggers: schema.journalEntries.triggers,
          intensity: schema.journalEntries.intensity,
          toolsUsed: schema.journalEntries.toolsUsed,
          outcome: schema.journalEntries.outcome,
          notes: schema.journalEntries.notes,
        });

      app.logger.info(
        { userId: session.user.id, entryId: id, updatedFields: Object.keys(updateData) },
        'Journal entry updated successfully'
      );

      return updatedEntry;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, entryId: id, body },
        'Failed to update journal entry'
      );
      throw error;
    }
  });

  // DELETE /api/journal/:id - Delete a journal entry
  app.fastify.delete('/api/journal/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
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

  // GET /api/journal/stats - Get statistics for user's journal entries
  app.fastify.get('/api/journal/stats', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching journal statistics');

    try {
      // Get total entries count
      const [{ totalEntries }] = await app.db
        .select({
          totalEntries: sql<number>`cast(count(*) as int)`,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id));

      // Get craving count
      const [{ cravingCount }] = await app.db
        .select({
          cravingCount: sql<number>`cast(count(*) as int)`,
        })
        .from(schema.journalEntries)
        .where(
          and(
            eq(schema.journalEntries.userId, session.user.id),
            eq(schema.journalEntries.hadCraving, true)
          )
        );

      // Get outcome counts
      const outcomeCounts = await app.db
        .select({
          outcome: schema.journalEntries.outcome,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .groupBy(schema.journalEntries.outcome);

      const resistedCount =
        outcomeCounts.find((o) => o.outcome === 'resisted')?.count || 0;
      const partialCount =
        outcomeCounts.find((o) => o.outcome === 'partial')?.count || 0;
      const usedCount = outcomeCounts.find((o) => o.outcome === 'used')?.count || 0;

      // Get recent entries for triggers and tools
      const recentEntries = await app.db
        .select({
          triggers: schema.journalEntries.triggers,
          toolsUsed: schema.journalEntries.toolsUsed,
          intensity: schema.journalEntries.intensity,
        })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .orderBy(desc(schema.journalEntries.createdAt))
        .limit(20);

      // Collect unique triggers and tools with frequency
      const triggerFreq: Record<string, number> = {};
      const toolFreq: Record<string, number> = {};
      let totalIntensity = 0;
      let intensityCount = 0;

      recentEntries.forEach(({ triggers, toolsUsed, intensity }) => {
        if (triggers && Array.isArray(triggers)) {
          triggers.forEach((trigger) => {
            if (trigger) {
              triggerFreq[trigger] = (triggerFreq[trigger] || 0) + 1;
            }
          });
        }

        if (toolsUsed && Array.isArray(toolsUsed)) {
          toolsUsed.forEach((tool) => {
            if (tool) {
              toolFreq[tool] = (toolFreq[tool] || 0) + 1;
            }
          });
        }

        if (intensity !== null && intensity !== undefined) {
          totalIntensity += intensity;
          intensityCount += 1;
        }
      });

      // Sort and get top items
      const commonTriggers = Object.entries(triggerFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([trigger]) => trigger);

      const commonTools = Object.entries(toolFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tool]) => tool);

      const averageIntensity =
        intensityCount > 0 ? totalIntensity / intensityCount : 0;

      const stats = {
        totalEntries,
        cravingCount,
        resistedCount,
        partialCount,
        usedCount,
        commonTriggers,
        commonTools,
        averageIntensity: parseFloat(averageIntensity.toFixed(2)),
      };

      app.logger.info(
        { userId: session.user.id, totalEntries, cravingCount },
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
}
