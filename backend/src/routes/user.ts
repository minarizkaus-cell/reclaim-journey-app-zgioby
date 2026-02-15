import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';

export function registerUserRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/user/profile - Get current authenticated user profile
  app.fastify.get('/api/user/profile', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching user profile');

    try {
      const [userRecord] = await app.db
        .select({
          id: authSchema.user.id,
          email: authSchema.user.email,
          displayName: authSchema.user.displayName,
          timezone: authSchema.user.timezone,
          sponsorName: authSchema.user.sponsorName,
          sponsorPhone: authSchema.user.sponsorPhone,
          emergencyContactName: authSchema.user.emergencyContactName,
          emergencyContactPhone: authSchema.user.emergencyContactPhone,
          timerMinutes: authSchema.user.timerMinutes,
          sobrietyDate: authSchema.user.sobrietyDate,
          onboarded: authSchema.user.onboarded,
        })
        .from(authSchema.user)
        .where(eq(authSchema.user.id, session.user.id));

      if (!userRecord) {
        app.logger.error({ userId: session.user.id }, 'User not found');
        return reply.code(404).send({ error: 'User not found' });
      }

      app.logger.info(
        { userId: session.user.id },
        'User profile retrieved successfully'
      );

      return userRecord;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to fetch user profile'
      );
      throw error;
    }
  });

  // PUT /api/user/profile - Update user profile
  app.fastify.put('/api/user/profile', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as {
      displayName?: string;
      timezone?: string;
      sponsorName?: string;
      sponsorPhone?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      timerMinutes?: number;
      sobrietyDate?: string;
      onboarded?: boolean;
    };

    app.logger.info(
      { userId: session.user.id, updateFields: Object.keys(body) },
      'Updating user profile'
    );

    try {
      const updateData: Record<string, any> = {};

      if (body.displayName !== undefined) {
        updateData.displayName = body.displayName || null;
      }
      if (body.timezone !== undefined) {
        updateData.timezone = body.timezone || null;
      }
      if (body.sponsorName !== undefined) {
        updateData.sponsorName = body.sponsorName || null;
      }
      if (body.sponsorPhone !== undefined) {
        updateData.sponsorPhone = body.sponsorPhone || null;
      }
      if (body.emergencyContactName !== undefined) {
        updateData.emergencyContactName = body.emergencyContactName || null;
      }
      if (body.emergencyContactPhone !== undefined) {
        updateData.emergencyContactPhone = body.emergencyContactPhone || null;
      }
      if (body.timerMinutes !== undefined) {
        updateData.timerMinutes = body.timerMinutes;
      }
      if (body.sobrietyDate !== undefined) {
        updateData.sobrietyDate = body.sobrietyDate
          ? new Date(body.sobrietyDate).toISOString().split('T')[0]
          : null;
      }
      if (body.onboarded !== undefined) {
        updateData.onboarded = body.onboarded;
      }

      if (Object.keys(updateData).length === 0) {
        app.logger.warn(
          { userId: session.user.id },
          'No fields to update in user profile'
        );
        return reply.code(400).send({ error: 'No fields to update' });
      }

      const [updatedUser] = await app.db
        .update(authSchema.user)
        .set(updateData)
        .where(eq(authSchema.user.id, session.user.id))
        .returning({
          id: authSchema.user.id,
          email: authSchema.user.email,
          displayName: authSchema.user.displayName,
          timezone: authSchema.user.timezone,
          sponsorName: authSchema.user.sponsorName,
          sponsorPhone: authSchema.user.sponsorPhone,
          emergencyContactName: authSchema.user.emergencyContactName,
          emergencyContactPhone: authSchema.user.emergencyContactPhone,
          timerMinutes: authSchema.user.timerMinutes,
          sobrietyDate: authSchema.user.sobrietyDate,
          onboarded: authSchema.user.onboarded,
        });

      app.logger.info(
        { userId: session.user.id, updatedFields: Object.keys(updateData) },
        'User profile updated successfully'
      );

      return updatedUser;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body },
        'Failed to update user profile'
      );
      throw error;
    }
  });
}
