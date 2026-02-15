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

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerUserRoutes(app);
registerJournalRoutes(app);
registerCravingSessionsRoutes(app);
registerCopingToolsRoutes(app);
registerCalendarEventsRoutes(app);

await app.run();
app.logger.info('Application running');
