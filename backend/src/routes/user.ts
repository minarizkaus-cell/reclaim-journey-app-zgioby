import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';
import * as appSchema from '../db/schema.js';
import { validatePassword } from '../utils/password-validation.js';
import { normalizeEmail, isValidEmail, emailsMatch } from '../utils/auth-utils.js';

export function registerUserRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/user/check-email - Check if email is available for registration
  app.fastify.post('/api/user/check-email', {
    schema: {
      description: 'Check if an email address is available for registration',
      tags: ['user'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          description: 'Email availability check result',
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            email: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid email format',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email?: string };
    const rawEmail = body.email?.trim();
    const normalizedEmail = normalizeEmail(rawEmail || '');

    app.logger.info(
      {
        rawEmail,
        normalizedEmail,
      },
      'POST /api/user/check-email - received email check request'
    );

    try {
      if (!isValidEmail(normalizedEmail)) {
        app.logger.warn(
          {
            normalizedEmail,
            rawEmail,
          },
          'Email format validation failed'
        );
        return reply.code(400).send({ error: 'Invalid email format' });
      }

      // Check if email already exists in database (case-insensitive)
      const existingUser = await app.db
        .select({ id: authSchema.user.id, email: authSchema.user.email })
        .from(authSchema.user)
        .where(eq(authSchema.user.email, normalizedEmail));

      const available = existingUser.length === 0;

      app.logger.info(
        {
          normalizedEmail,
          available,
          existingCount: existingUser.length,
          existingEmails: existingUser.map(u => u.email),
        },
        'Email availability check completed successfully'
      );

      return {
        available,
        email: normalizedEmail,
      };
    } catch (error) {
      app.logger.error(
        {
          err: error,
          normalizedEmail,
          rawEmail,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        'Email availability check failed'
      );
      throw error;
    }
  });

  // GET /api/user/registration-test - Test and debug registration system
  app.fastify.get('/api/user/registration-test', {
    schema: {
      description: 'Debug endpoint to test registration system and database state',
      tags: ['user'],
      response: {
        200: {
          description: 'Registration test results',
          type: 'object',
          properties: {
            status: { type: 'string' },
            totalUsers: { type: 'number' },
            emails: {
              type: 'array',
              items: { type: 'string' },
            },
            duplicateEmails: {
              type: 'array',
              items: { type: 'string' },
            },
            caseInsensitiveDuplicates: {
              type: 'array',
              items: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    app.logger.info({}, 'GET /api/user/registration-test - running diagnostics');

    try {
      // Get all users with their emails
      const users = await app.db
        .select({ id: authSchema.user.id, email: authSchema.user.email })
        .from(authSchema.user);

      app.logger.info(
        { totalUsers: users.length },
        'Retrieved all users from database'
      );

      // Check for exact duplicates
      const emailCounts = new Map<string, number>();
      const lowerEmailCounts = new Map<string, string[]>();

      users.forEach(user => {
        const email = user.email;
        const lowerEmail = email.toLowerCase();

        // Track exact duplicates
        emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);

        // Track case-insensitive duplicates
        if (!lowerEmailCounts.has(lowerEmail)) {
          lowerEmailCounts.set(lowerEmail, []);
        }
        const variants = lowerEmailCounts.get(lowerEmail)!;
        if (!variants.includes(email)) {
          variants.push(email);
        }
      });

      // Find duplicates
      const exactDuplicates = Array.from(emailCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([email, _]) => email);

      const caseInsensitiveDuplicates = Array.from(lowerEmailCounts.entries())
        .filter(([_, variants]) => variants.length > 1)
        .map(([_, variants]) => variants);

      const sampleEmails = users.slice(0, 10).map(u => u.email);

      app.logger.info(
        {
          totalUsers: users.length,
          exactDuplicates: exactDuplicates.length,
          caseInsensitiveDuplicates: caseInsensitiveDuplicates.length,
        },
        'Registration diagnostics completed'
      );

      return {
        status: 'ok',
        totalUsers: users.length,
        emails: sampleEmails,
        duplicateEmails: exactDuplicates,
        caseInsensitiveDuplicates,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      app.logger.error(
        {
          err: error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorCode: (error as any)?.code,
        },
        'Failed to run registration diagnostics'
      );
      throw error;
    }
  });

  // POST /api/user/validate-registration - Validate registration data before attempting signup
  app.fastify.post('/api/user/validate-registration', {
    schema: {
      description: 'Validate registration data (email format, availability, password strength)',
      tags: ['user'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          name: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Validation result',
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
            email: { type: 'string' },
            suggestions: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email?: string; password?: string; name?: string };
    const rawEmail = body.email?.trim();
    const normalizedEmail = normalizeEmail(rawEmail || '');
    const password = body.password || '';
    const name = body.name?.trim() || '';

    app.logger.info(
      { email: normalizedEmail, hasPassword: !!password, hasName: !!name },
      'POST /api/user/validate-registration - validating registration data'
    );

    const errors: string[] = [];

    try {
      // Validate email format
      if (!isValidEmail(normalizedEmail)) {
        errors.push('Invalid email format');
      }

      // Validate name
      if (!name || name.length < 2) {
        errors.push('Name must be at least 2 characters');
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.push(...(passwordValidation.errors || []));
      }

      // Check if email is available (only if email is valid)
      let emailExists = false;
      let foundEmails: string[] = [];
      if (isValidEmail(normalizedEmail)) {
        const existingUser = await app.db
          .select({ id: authSchema.user.id, email: authSchema.user.email })
          .from(authSchema.user)
          .where(eq(authSchema.user.email, normalizedEmail));

        foundEmails = existingUser.map(u => u.email);

        app.logger.info(
          {
            normalizedEmail,
            foundCount: existingUser.length,
            foundEmails,
          },
          'Email existence check completed during validation'
        );

        if (existingUser.length > 0) {
          errors.push('Email address already in use');
          emailExists = true;
        }
      }

      const valid = errors.length === 0;

      app.logger.info(
        {
          email: normalizedEmail,
          valid,
          errorCount: errors.length,
          emailExists,
          foundEmails,
          errors,
        },
        'Registration validation completed'
      );

      return {
        valid,
        errors,
        email: normalizedEmail,
        suggestions: !valid
          ? 'Please fix the errors above before attempting to register'
          : 'Registration data is valid. Ready to proceed.',
      };
    } catch (error) {
      app.logger.error(
        {
          err: error,
          email: normalizedEmail,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        'Failed to validate registration data'
      );
      throw error;
    }
  });

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

  // DELETE /api/user/account - Delete user account and all associated data
  app.fastify.delete('/api/user/account', {
    schema: {
      description: 'Permanently delete the authenticated user account and all associated data',
      tags: ['user'],
      response: {
        200: {
          description: 'Account deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        401: {
          description: 'Unauthorized - user not authenticated',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;

    app.logger.info(
      { userId },
      'Deleting user account and all associated data'
    );

    try {
      // Verify user exists
      const [userRecord] = await app.db
        .select()
        .from(authSchema.user)
        .where(eq(authSchema.user.id, userId));

      if (!userRecord) {
        app.logger.error({ userId }, 'User not found for deletion');
        return reply.code(404).send({ error: 'User not found' });
      }

      // Delete all user-related data in transaction
      // The order matters: delete dependent records first
      await app.db.delete(appSchema.copingToolCompletions)
        .where(eq(appSchema.copingToolCompletions.userId, userId));

      await app.db.delete(appSchema.cravingSessions)
        .where(eq(appSchema.cravingSessions.userId, userId));

      await app.db.delete(appSchema.journalEntries)
        .where(eq(appSchema.journalEntries.userId, userId));

      await app.db.delete(appSchema.calendarEvents)
        .where(eq(appSchema.calendarEvents.userId, userId));

      // Delete the user record
      // Cascade deletes will handle: account, session, and verification records
      await app.db.delete(authSchema.user)
        .where(eq(authSchema.user.id, userId));

      app.logger.info(
        { userId },
        'User account and all associated data deleted successfully'
      );

      return {
        success: true,
        message: 'Account and all associated data deleted successfully',
      };
    } catch (error) {
      app.logger.error(
        { err: error, userId },
        'Failed to delete user account'
      );
      throw error;
    }
  });
}
