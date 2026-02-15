import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerCalendarEventsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/calendar-events - Get events for a specific date or month
  app.fastify.get('/api/calendar-events', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const query = request.query as {
      date?: string;
      month?: string;
    };

    const { date, month } = query;

    app.logger.info(
      { userId: session.user.id, date, month },
      'Fetching calendar events'
    );

    try {
      const whereConditions = [eq(schema.calendarEvents.userId, session.user.id)];

      if (date) {
        // Validate date format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          app.logger.warn({ date }, 'Invalid date format');
          return reply.code(400).send({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }
        whereConditions.push(eq(schema.calendarEvents.date, date));
      } else if (month) {
        // Validate month format YYYY-MM
        if (!/^\d{4}-\d{2}$/.test(month)) {
          app.logger.warn({ month }, 'Invalid month format');
          return reply.code(400).send({ error: 'Invalid month format. Use YYYY-MM' });
        }

        // Get all events for the given month
        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;

        // Calculate end date (last day of month)
        const nextMonth = new Date(`${year}-${monthNum}-01`);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const endDate = new Date(nextMonth);
        endDate.setDate(0); // Last day of previous month
        const endDateStr = endDate.toISOString().split('T')[0];

        whereConditions.push(gte(schema.calendarEvents.date, startDate));
        whereConditions.push(lte(schema.calendarEvents.date, endDateStr));
      }

      const events = await app.db
        .select({
          id: schema.calendarEvents.id,
          title: schema.calendarEvents.title,
          description: schema.calendarEvents.description,
          date: schema.calendarEvents.date,
          time: schema.calendarEvents.time,
          duration: schema.calendarEvents.duration,
          reminder: schema.calendarEvents.reminder,
          reminderEnabled: schema.calendarEvents.reminderEnabled,
          createdAt: schema.calendarEvents.createdAt,
        })
        .from(schema.calendarEvents)
        .where(and(...whereConditions))
        .orderBy(
          desc(schema.calendarEvents.date),
          desc(schema.calendarEvents.time)
        );

      app.logger.info(
        { userId: session.user.id, count: events.length, date, month },
        'Calendar events fetched successfully'
      );

      return events;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, date, month },
        'Failed to fetch calendar events'
      );
      throw error;
    }
  });

  // POST /api/calendar-events - Create a new calendar event
  app.fastify.post('/api/calendar-events', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as {
      title: string;
      description?: string;
      date: string;
      time: string;
      duration: number;
      reminder: number;
      reminder_enabled: boolean;
    };

    const { title, description, date, time, duration, reminder, reminder_enabled } = body;

    // Validate date format YYYY-MM-DD
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      app.logger.warn({ date }, 'Invalid date format');
      return reply.code(400).send({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate time format HH:MM
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      app.logger.warn({ time }, 'Invalid time format');
      return reply.code(400).send({ error: 'Invalid time format. Use HH:MM' });
    }

    // Validate duration
    if (typeof duration !== 'number' || duration <= 0) {
      app.logger.warn({ duration }, 'Invalid duration');
      return reply.code(400).send({ error: 'Duration must be a positive number' });
    }

    // Validate reminder
    if (typeof reminder !== 'number' || reminder < 0) {
      app.logger.warn({ reminder }, 'Invalid reminder');
      return reply.code(400).send({ error: 'Reminder must be a non-negative number' });
    }

    app.logger.info(
      { userId: session.user.id, title, date, time, duration },
      'Creating calendar event'
    );

    try {
      const [event] = await app.db
        .insert(schema.calendarEvents)
        .values({
          userId: session.user.id,
          title,
          description: description || null,
          date,
          time,
          duration,
          reminder,
          reminderEnabled: reminder_enabled !== undefined ? reminder_enabled : true,
          createdAt: new Date(),
        })
        .returning({
          id: schema.calendarEvents.id,
          title: schema.calendarEvents.title,
          description: schema.calendarEvents.description,
          date: schema.calendarEvents.date,
          time: schema.calendarEvents.time,
          duration: schema.calendarEvents.duration,
          reminder: schema.calendarEvents.reminder,
          reminderEnabled: schema.calendarEvents.reminderEnabled,
          createdAt: schema.calendarEvents.createdAt,
        });

      app.logger.info(
        { userId: session.user.id, eventId: event.id },
        'Calendar event created successfully'
      );

      return event;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body },
        'Failed to create calendar event'
      );
      throw error;
    }
  });

  // PUT /api/calendar-events/:id - Update a calendar event
  app.fastify.put('/api/calendar-events/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const params = request.params as { id: string };
    const { id } = params;

    const body = request.body as {
      title?: string;
      description?: string;
      date?: string;
      time?: string;
      duration?: number;
      reminder?: number;
      reminder_enabled?: boolean;
    };

    app.logger.info(
      { userId: session.user.id, eventId: id, updateFields: Object.keys(body) },
      'Updating calendar event'
    );

    try {
      // Verify the event belongs to the user
      const [event] = await app.db
        .select()
        .from(schema.calendarEvents)
        .where(eq(schema.calendarEvents.id, id));

      if (!event) {
        app.logger.warn(
          { userId: session.user.id, eventId: id },
          'Calendar event not found'
        );
        return reply.code(404).send({ error: 'Calendar event not found' });
      }

      if (event.userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, eventId: id, ownerId: event.userId },
          'User attempted to update event they do not own'
        );
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      // Validate date if provided
      if (body.date && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        app.logger.warn({ date: body.date }, 'Invalid date format');
        return reply.code(400).send({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      // Validate time if provided
      if (body.time && !/^\d{2}:\d{2}$/.test(body.time)) {
        app.logger.warn({ time: body.time }, 'Invalid time format');
        return reply.code(400).send({ error: 'Invalid time format. Use HH:MM' });
      }

      // Validate duration if provided
      if (body.duration !== undefined && (typeof body.duration !== 'number' || body.duration <= 0)) {
        app.logger.warn({ duration: body.duration }, 'Invalid duration');
        return reply.code(400).send({ error: 'Duration must be a positive number' });
      }

      // Validate reminder if provided
      if (body.reminder !== undefined && (typeof body.reminder !== 'number' || body.reminder < 0)) {
        app.logger.warn({ reminder: body.reminder }, 'Invalid reminder');
        return reply.code(400).send({ error: 'Reminder must be a non-negative number' });
      }

      const updateData: Record<string, any> = {};

      if (body.title !== undefined) {
        updateData.title = body.title;
      }
      if (body.description !== undefined) {
        updateData.description = body.description || null;
      }
      if (body.date !== undefined) {
        updateData.date = body.date;
      }
      if (body.time !== undefined) {
        updateData.time = body.time;
      }
      if (body.duration !== undefined) {
        updateData.duration = body.duration;
      }
      if (body.reminder !== undefined) {
        updateData.reminder = body.reminder;
      }
      if (body.reminder_enabled !== undefined) {
        updateData.reminderEnabled = body.reminder_enabled;
      }

      if (Object.keys(updateData).length === 0) {
        app.logger.warn(
          { userId: session.user.id, eventId: id },
          'No fields to update in calendar event'
        );
        return reply.code(400).send({ error: 'No fields to update' });
      }

      const [updatedEvent] = await app.db
        .update(schema.calendarEvents)
        .set(updateData)
        .where(eq(schema.calendarEvents.id, id))
        .returning({
          id: schema.calendarEvents.id,
          title: schema.calendarEvents.title,
          description: schema.calendarEvents.description,
          date: schema.calendarEvents.date,
          time: schema.calendarEvents.time,
          duration: schema.calendarEvents.duration,
          reminder: schema.calendarEvents.reminder,
          reminderEnabled: schema.calendarEvents.reminderEnabled,
          createdAt: schema.calendarEvents.createdAt,
        });

      app.logger.info(
        { userId: session.user.id, eventId: id, updatedFields: Object.keys(updateData) },
        'Calendar event updated successfully'
      );

      return updatedEvent;
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, eventId: id, body },
        'Failed to update calendar event'
      );
      throw error;
    }
  });

  // DELETE /api/calendar-events/:id - Delete a calendar event
  app.fastify.delete('/api/calendar-events/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const params = request.params as { id: string };
    const { id } = params;

    app.logger.info(
      { userId: session.user.id, eventId: id },
      'Deleting calendar event'
    );

    try {
      // Verify the event belongs to the user
      const [event] = await app.db
        .select()
        .from(schema.calendarEvents)
        .where(eq(schema.calendarEvents.id, id));

      if (!event) {
        app.logger.warn(
          { userId: session.user.id, eventId: id },
          'Calendar event not found'
        );
        return reply.code(404).send({ error: 'Calendar event not found' });
      }

      if (event.userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, eventId: id, ownerId: event.userId },
          'User attempted to delete event they do not own'
        );
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      await app.db
        .delete(schema.calendarEvents)
        .where(eq(schema.calendarEvents.id, id));

      app.logger.info(
        { userId: session.user.id, eventId: id },
        'Calendar event deleted successfully'
      );

      return { success: true };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, eventId: id },
        'Failed to delete calendar event'
      );
      throw error;
    }
  });
}
