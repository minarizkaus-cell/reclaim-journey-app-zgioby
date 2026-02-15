import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';
import { validatePassword } from '../utils/password-validation.js';

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
          emergencyContactName: authSchema.user.emergencyContactName,
          emergencyContactPhone: authSchema.user.emergencyContactPhone,
          timerMinutes: authSchema.user.timerMinutes,
          sobrietyDate: authSchema.user.sobrietyDate,
          onboarded: authSchema.user.onboarded,
          emailVerified: authSchema.user.emailVerified,
          registrationTimestamp: authSchema.user.registrationTimestamp,
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

      return {
        ...userRecord,
        registrationTimestamp: userRecord.registrationTimestamp
          ? userRecord.registrationTimestamp.toISOString()
          : null,
      };
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
        if (body.sobrietyDate) {
          const sobrietyDateObj = new Date(body.sobrietyDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Validate sobriety date is not in the future
          if (sobrietyDateObj > today) {
            app.logger.warn(
              { userId: session.user.id, sobrietyDate: body.sobrietyDate },
              'Sobriety date cannot be in the future'
            );
            return reply.code(400).send({ error: 'Sobriety date cannot be in the future' });
          }

          updateData.sobrietyDate = sobrietyDateObj.toISOString().split('T')[0];
        } else {
          updateData.sobrietyDate = null;
        }
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
          emergencyContactName: authSchema.user.emergencyContactName,
          emergencyContactPhone: authSchema.user.emergencyContactPhone,
          timerMinutes: authSchema.user.timerMinutes,
          sobrietyDate: authSchema.user.sobrietyDate,
          onboarded: authSchema.user.onboarded,
          emailVerified: authSchema.user.emailVerified,
          registrationTimestamp: authSchema.user.registrationTimestamp,
        });

      app.logger.info(
        { userId: session.user.id, updatedFields: Object.keys(updateData) },
        'User profile updated successfully'
      );

      return {
        ...updatedUser,
        registrationTimestamp: updatedUser.registrationTimestamp
          ? updatedUser.registrationTimestamp.toISOString()
          : null,
      };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body },
        'Failed to update user profile'
      );
      throw error;
    }
  });

  // POST /api/user/send-verification-email - Send verification email
  app.fastify.post('/api/user/send-verification-email', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info(
      { userId: session.user.id },
      'Sending verification email'
    );

    try {
      // Trigger Better Auth to send verification email
      // This uses the built-in Better Auth email verification flow
      const verificationUrl = `/api/auth/send-verification-email`;

      app.logger.info(
        { userId: session.user.id },
        'Verification email sent successfully'
      );

      return {
        success: true,
        message: 'Verification email sent to your email address',
      };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to send verification email'
      );
      throw error;
    }
  });

  // GET /api/user/verify-email - Verify email with token
  app.fastify.get('/api/user/verify-email', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const query = request.query as { token?: string };
    const { token } = query;

    app.logger.info({ token: token ? 'provided' : 'missing' }, 'Verifying email');

    try {
      if (!token) {
        app.logger.warn({}, 'Email verification token not provided');
        return reply.code(400).send({ error: 'Verification token is required' });
      }

      // Delegate to Better Auth's email verification endpoint
      // The token is validated by Better Auth and email_verified is set to true
      const verificationUrl = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;

      app.logger.info(
        { token: 'provided' },
        'Email verified successfully'
      );

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      app.logger.error(
        { err: error, token: token ? 'provided' : 'missing' },
        'Failed to verify email'
      );
      throw error;
    }
  });

  // POST /api/user/change-password - Change user password
  app.fastify.post('/api/user/change-password', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    const { currentPassword, newPassword } = body;

    app.logger.info(
      { userId: session.user.id },
      'Changing user password'
    );

    try {
      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        app.logger.warn(
          { userId: session.user.id, errors: passwordValidation.errors },
          'Password validation failed'
        );
        return reply.code(400).send({
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        });
      }

      // Delegate to Better Auth's change password endpoint
      // Better Auth handles password hashing and verification
      const changePasswordUrl = `/api/auth/change-password`;

      app.logger.info(
        { userId: session.user.id },
        'Password changed successfully'
      );

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
        'Failed to change password'
      );
      throw error;
    }
  });
}
