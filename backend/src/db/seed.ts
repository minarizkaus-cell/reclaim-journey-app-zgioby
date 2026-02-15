import { createApplication } from "@specific-dev/framework";
import * as appSchema from './schema.js';
import * as authSchema from './auth-schema.js';
import { eq } from 'drizzle-orm';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);

const DEFAULT_COPING_TOOLS = [
  {
    title: "Deep Breathing",
    duration: "5 minutes",
    steps: [
      "Find a comfortable position",
      "Breathe in slowly through your nose for 4 counts",
      "Hold your breath for 4 counts",
      "Exhale slowly through your mouth for 6 counts",
      "Repeat 5-10 times",
    ],
    whenToUse: "When feeling anxious or overwhelmed",
    isMandatory: true,
  },
  {
    title: "Grounding Exercise",
    duration: "5 minutes",
    steps: [
      "Name 5 things you can see",
      "Name 4 things you can touch",
      "Name 3 things you can hear",
      "Name 2 things you can smell",
      "Name 1 thing you can taste",
    ],
    whenToUse: "When feeling disconnected or panicked",
    isMandatory: true,
  },
  {
    title: "Progressive Muscle Relaxation",
    duration: "10 minutes",
    steps: [
      "Start with your feet, tense for 5 seconds",
      "Release and notice the relaxation",
      "Move up to your calves, repeat",
      "Continue through each muscle group",
      "End with your face and head",
    ],
    whenToUse: "When experiencing physical tension",
    isMandatory: false,
  },
  {
    title: "Positive Affirmations",
    duration: "3 minutes",
    steps: [
      "I am strong and capable",
      "I choose health and wellness",
      "Every day I am getting better",
      "I deserve a life of recovery",
      "I am proud of my progress",
    ],
    whenToUse: "When needing motivation",
    isMandatory: false,
  },
  {
    title: "Distraction Techniques",
    duration: "15 minutes",
    steps: [
      "Call a supportive friend or family member",
      "Go for a walk or exercise",
      "Listen to your favorite music",
      "Engage in a hobby or creative activity",
      "Watch a funny video or movie",
    ],
    whenToUse: "When experiencing strong cravings",
    isMandatory: true,
  },
  {
    title: "Urge Surfing",
    duration: "15 minutes",
    steps: [
      "Acknowledge the craving without judgment",
      "Notice where you feel it in your body",
      "Observe how it changes over time",
      "Remember: cravings peak and then subside",
      "Wait 15-20 minutes before making any decisions",
    ],
    whenToUse: "During intense cravings",
    isMandatory: false,
  },
];

async function seedCopingTools() {
  app.logger.info('Starting coping tools seed');

  try {
    for (const tool of DEFAULT_COPING_TOOLS) {
      // Check if tool already exists
      const existing = await app.db
        .select()
        .from(appSchema.copingTools)
        .where(eq(appSchema.copingTools.title, tool.title));

      if (existing.length > 0) {
        app.logger.info({ title: tool.title }, 'Coping tool already exists, skipping');
        continue;
      }

      await app.db.insert(appSchema.copingTools).values({
        title: tool.title,
        duration: tool.duration,
        steps: tool.steps,
        whenToUse: tool.whenToUse,
        isMandatory: tool.isMandatory,
      });

      app.logger.info({ title: tool.title }, 'Coping tool created');
    }

    app.logger.info('Coping tools seed completed successfully');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed coping tools');
    throw error;
  }
}

await seedCopingTools();
process.exit(0);
