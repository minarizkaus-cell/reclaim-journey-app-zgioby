import { createApplication } from "@specific-dev/framework";
import { eq } from 'drizzle-orm';
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerJournalRoutes } from './routes/journal.js';
import { registerUserRoutes } from './routes/user.js';
import { registerCravingSessionsRoutes } from './routes/craving-sessions.js';
import { registerCopingToolsRoutes } from './routes/coping-tools.js';
import { registerCalendarEventsRoutes } from './routes/calendar-events.js';

const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with Better Auth
// Email/password authentication is enabled by default in Better Auth
// Disable email verification requirement to allow immediate login after signup
app.withAuth({
  emailVerification: {
    sendOnSignUp: false,
  },
});

// Add detailed logging for signup operations - preHandler to log incoming requests
app.fastify.addHook('preHandler', async (request) => {
  // Only log signup requests in detail
  if (request.url?.includes('/api/auth/sign-up/email') && request.method === 'POST') {
    const body = request.body as { email?: string; password?: string; name?: string };
    const rawEmail = body?.email?.trim();
    const normalizedEmail = rawEmail?.toLowerCase();

    app.logger.info(
      {
        path: request.url,
        method: request.method,
        rawEmail,
        normalizedEmail,
        hasPassword: !!body?.password,
        hasName: !!body?.name,
      },
      'Sign-up request received'
    );

    // Check if email exists in database (case-insensitive)
    if (normalizedEmail) {
      try {
        const existingUser = await app.db
          .select({ id: authSchema.user.id, email: authSchema.user.email })
          .from(authSchema.user)
          .where(eq(authSchema.user.email, normalizedEmail));

        app.logger.info(
          {
            normalizedEmail,
            foundCount: existingUser.length,
            foundEmails: existingUser.map(u => u.email),
          },
          'Email database check completed'
        );

        if (existingUser.length > 0) {
          app.logger.warn(
            {
              normalizedEmail,
              existingEmails: existingUser.map(u => u.email),
            },
            'Sign-up attempt with already-existing email'
          );
        }
      } catch (dbError) {
        app.logger.error(
          {
            err: dbError,
            normalizedEmail,
            errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
          },
          'Error checking email existence in database during sign-up'
        );
      }
    }
  }
});

// Add middleware to log auth endpoint errors with full details
app.fastify.addHook('onError', async (request, reply, error) => {
  // Only log auth signup errors in detail
  if (request.url?.includes('/api/auth/sign-up/email')) {
    const body = request.body as { email?: string };
    const rawEmail = body?.email?.trim();
    const normalizedEmail = rawEmail?.toLowerCase();

    app.logger.error(
      {
        err: error,
        path: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        rawEmail,
        normalizedEmail,
        errorMessage: error?.message,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
      },
      'Auth signup endpoint error'
    );
  }
});

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerUserRoutes(app);
registerJournalRoutes(app);
registerCravingSessionsRoutes(app);
registerCopingToolsRoutes(app);
registerCalendarEventsRoutes(app);

await app.run();
app.logger.info('Application running');
