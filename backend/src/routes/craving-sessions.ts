import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerCravingSessionsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/craving-sessions - Create a new craving session
  app.fastify.post('/api/craving-sessions', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as {
      triggers: string[];
      intensity: number;
      need_type: string;
    };

    const { triggers = [], intensity, need_type } = body;

    const validNeedTypes = ['distract', 'calm', 'support', 'escape', 'reflect'];
    if (!validNeedTypes.includes(need_type)) {
      app.logger.warn(
        { userId: session.user.id, needType: need_type },
        'Invalid need_type value provided'
      );
      return reply.code(400).send({ error: 'Invalid need_type value' });
    }

    if (typeof intensity !== 'number' || intensity < 1 || intensity > 10) {
      app.logger.warn(
        { userId: session.user.id, intensity },
        'Invalid intensity value provided'
      );
      return reply.code(400).send({ error: 'Intensity must be a number between 1 and 10' });
    }

    app.logger.info(
      {
        userId: session.user.id,
        needType: need_type,
        intensity,
        triggersCount: triggers?.length || 0,
      },
      'Creating craving session'
    );

    try {
      const [cravingSession] = await app.db
        .insert(schema.cravingSessions)
        .values({
          userId: session.user.id,
          triggers: triggers && triggers.length > 0 ? triggers : [],
          intensity,
          needType: need_type as 'distract' | 'calm' | 'support' | 'escape' | 'reflect',
          startedAt: new Date(),
        })
        .returning({
          id: schema.cravingSessions.id,
          startedAt: schema.cravingSessions.startedAt,
          triggers: schema.cravingSessions.triggers,
          intensity: schema.cravingSessions.intensity,
          needType: schema.cravingSessions.needType,
        });

      app.logger.info(
        { userId: session.user.id, sessionId: cravingSession.id },
        'Craving session created successfully'
      );

      return cravingSession;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body },
        'Failed to create craving session'
      );
      throw error;
    }
  });

  // PUT /api/craving-sessions/:id - Update a craving session
  app.fastify.put('/api/craving-sessions/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const params = request.params as { id: string };
    const { id } = params;

    const body = request.body as {
      completed_at?: string;
    };

    app.logger.info(
      { userId: session.user.id, sessionId: id },
      'Updating craving session'
    );

    try {
      // Verify the session belongs to the user
      const [cravingSession] = await app.db
        .select()
        .from(schema.cravingSessions)
        .where(eq(schema.cravingSessions.id, id));

      if (!cravingSession) {
        app.logger.warn(
          { userId: session.user.id, sessionId: id },
          'Craving session not found'
        );
        return reply.code(404).send({ error: 'Craving session not found' });
      }

      if (cravingSession.userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, sessionId: id, ownerId: cravingSession.userId },
          'User attempted to update session they do not own'
        );
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      const updateData: Record<string, any> = {};

      if (body.completed_at !== undefined) {
        updateData.completedAt = body.completed_at ? new Date(body.completed_at) : null;
      }

      if (Object.keys(updateData).length === 0) {
        app.logger.warn(
          { userId: session.user.id, sessionId: id },
          'No fields to update in craving session'
        );
        return reply.code(400).send({ error: 'No fields to update' });
      }

      const [updatedSession] = await app.db
        .update(schema.cravingSessions)
        .set(updateData)
        .where(eq(schema.cravingSessions.id, id))
        .returning({
          id: schema.cravingSessions.id,
          startedAt: schema.cravingSessions.startedAt,
          completedAt: schema.cravingSessions.completedAt,
          triggers: schema.cravingSessions.triggers,
          intensity: schema.cravingSessions.intensity,
          needType: schema.cravingSessions.needType,
        });

      app.logger.info(
        { userId: session.user.id, sessionId: id },
        'Craving session updated successfully'
      );

      return updatedSession;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, sessionId: id, body },
        'Failed to update craving session'
      );
      throw error;
    }
  });

  // GET /api/craving-sessions - Get all craving sessions for authenticated user
  app.fastify.get('/api/craving-sessions', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching craving sessions');

    try {
      const sessions = await app.db
        .select({
          id: schema.cravingSessions.id,
          startedAt: schema.cravingSessions.startedAt,
          completedAt: schema.cravingSessions.completedAt,
          triggers: schema.cravingSessions.triggers,
          intensity: schema.cravingSessions.intensity,
          needType: schema.cravingSessions.needType,
        })
        .from(schema.cravingSessions)
        .where(eq(schema.cravingSessions.userId, session.user.id))
        .orderBy(desc(schema.cravingSessions.startedAt));

      app.logger.info(
        { userId: session.user.id, count: sessions.length },
        'Craving sessions fetched successfully'
      );

      return sessions;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to fetch craving sessions'
      );
      throw error;
    }
  });
}
