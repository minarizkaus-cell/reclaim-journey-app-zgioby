import { createApplication } from "@specific-dev/framework";
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

// Add middleware to log auth endpoint errors with full details
app.fastify.addHook('onError', async (request, reply, error) => {
  // Only log auth signup errors in detail
  if (request.url?.includes('/api/auth/sign-up/email')) {
    app.logger.error(
      {
        err: error,
        path: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        errorMessage: error?.message,
        errorCode: (error as any)?.code,
        details: (error as any)?.details,
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
