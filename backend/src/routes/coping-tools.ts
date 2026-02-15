import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerCopingToolsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/coping-tools - Get all coping tools
  app.fastify.get('/api/coping-tools', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    app.logger.info('Fetching all coping tools');

    try {
      const tools = await app.db
        .select({
          id: schema.copingTools.id,
          title: schema.copingTools.title,
          duration: schema.copingTools.duration,
          steps: schema.copingTools.steps,
          whenToUse: schema.copingTools.whenToUse,
          isMandatory: schema.copingTools.isMandatory,
        })
        .from(schema.copingTools)
        .orderBy(schema.copingTools.title);

      app.logger.info(
        { count: tools.length },
        'Coping tools fetched successfully'
      );

      return tools;
    } catch (error) {
      app.logger.error(
        { err: error },
        'Failed to fetch coping tools'
      );
      throw error;
    }
  });

  // POST /api/coping-tools/complete - Record completion of a coping tool
  app.fastify.post('/api/coping-tools/complete', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as {
      tool_id: string;
      session_id?: string;
    };

    const { tool_id, session_id } = body;

    app.logger.info(
      {
        userId: session.user.id,
        toolId: tool_id,
        sessionId: session_id,
      },
      'Recording coping tool completion'
    );

    try {
      // Verify the tool exists
      const [tool] = await app.db
        .select()
        .from(schema.copingTools)
        .where(eq(schema.copingTools.id, tool_id));

      if (!tool) {
        app.logger.warn(
          { userId: session.user.id, toolId: tool_id },
          'Coping tool not found'
        );
        return reply.code(404).send({ error: 'Coping tool not found' });
      }

      // If session_id is provided, verify it belongs to the user
      if (session_id) {
        const [cravingSession] = await app.db
          .select()
          .from(schema.cravingSessions)
          .where(eq(schema.cravingSessions.id, session_id));

        if (!cravingSession) {
          app.logger.warn(
            { userId: session.user.id, sessionId: session_id },
            'Craving session not found'
          );
          return reply.code(404).send({ error: 'Craving session not found' });
        }

        if (cravingSession.userId !== session.user.id) {
          app.logger.warn(
            { userId: session.user.id, sessionId: session_id, ownerId: cravingSession.userId },
            'User attempted to use session they do not own'
          );
          return reply.code(403).send({ error: 'Unauthorized' });
        }
      }

      const [completion] = await app.db
        .insert(schema.copingToolCompletions)
        .values({
          userId: session.user.id,
          toolId: tool_id,
          sessionId: session_id || null,
          completedAt: new Date(),
        })
        .returning({
          id: schema.copingToolCompletions.id,
          toolId: schema.copingToolCompletions.toolId,
          completedAt: schema.copingToolCompletions.completedAt,
        });

      app.logger.info(
        { userId: session.user.id, toolId: tool_id, completionId: completion.id },
        'Coping tool completion recorded successfully'
      );

      return {
        success: true,
        completion,
      };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body },
        'Failed to record coping tool completion'
      );
      throw error;
    }
  });

  // GET /api/coping-tools/completions - Get authenticated user's tool completions
  app.fastify.get('/api/coping-tools/completions', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const query = request.query as { session_id?: string };
    const { session_id } = query;

    app.logger.info(
      { userId: session.user.id, sessionId: session_id },
      'Fetching coping tool completions'
    );

    try {
      const whereConditions = [eq(schema.copingToolCompletions.userId, session.user.id)];

      if (session_id) {
        whereConditions.push(eq(schema.copingToolCompletions.sessionId, session_id));
      }

      const completions = await app.db
        .select({
          id: schema.copingToolCompletions.id,
          toolId: schema.copingToolCompletions.toolId,
          completedAt: schema.copingToolCompletions.completedAt,
          sessionId: schema.copingToolCompletions.sessionId,
        })
        .from(schema.copingToolCompletions)
        .where(and(...whereConditions))
        .orderBy(desc(schema.copingToolCompletions.completedAt));

      app.logger.info(
        { userId: session.user.id, sessionId: session_id, count: completions.length },
        'Coping tool completions fetched successfully'
      );

      return completions;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, sessionId: session_id },
        'Failed to fetch coping tool completions'
      );
      throw error;
    }
  });
}
