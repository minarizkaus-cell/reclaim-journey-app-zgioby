import { createApplication } from "@specific-dev/framework";
import * as appSchema from './schema.js';
import * as authSchema from './auth-schema.js';
import { eq } from 'drizzle-orm';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);

// Map of tool IDs to their mandatory status
const MANDATORY_TOOL_IDS = [
  'tool-deep-breathing',
  'tool-box-breathing',
  'tool-grounding',
  'tool-delay-10',
  'tool-change-location',
];

const DEFAULT_COPING_TOOLS = [
  {
    id: 'tool-deep-breathing',
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
  },
  {
    id: 'tool-box-breathing',
    title: "Box Breathing",
    duration: "5 minutes",
    steps: [
      "Breathe in for 4 counts",
      "Hold for 4 counts",
      "Breathe out for 4 counts",
      "Hold for 4 counts",
      "Repeat 5 times",
    ],
    whenToUse: "When feeling stressed or anxious",
  },
  {
    id: 'tool-grounding',
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
  },
  {
    id: 'tool-progressive-muscle',
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
  },
  {
    id: 'tool-affirmations',
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
  },
  {
    id: 'tool-distraction',
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
  },
  {
    id: 'tool-urge-surfing',
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
  },
  {
    id: 'tool-delay-10',
    title: "10-Minute Delay",
    duration: "10 minutes",
    steps: [
      "Set a timer for 10 minutes",
      "Engage in a distracting activity",
      "Wait for the timer to go off",
      "Reassess how you're feeling",
      "Decide if you still need the substance",
    ],
    whenToUse: "When experiencing cravings",
  },
  {
    id: 'tool-change-location',
    title: "Change Your Location",
    duration: "5 minutes",
    steps: [
      "Identify your current location",
      "Leave immediately to a different place",
      "Go to a safe, supportive environment",
      "Spend at least 5 minutes there",
      "Reassess your craving intensity",
    ],
    whenToUse: "When triggered by your environment",
  },
  {
    id: 'tool-short-walk',
    title: "Short Walk",
    duration: "5 minutes",
    steps: [
      "Stand up and put on comfortable shoes",
      "Step outside or find a safe indoor space",
      "Walk at a moderate pace for 5 minutes",
      "Focus on your surroundings",
      "Return and reassess your craving",
    ],
    whenToUse: "When needing physical activity and a change of scenery",
  },
  {
    id: 'tool-cold-water',
    title: "Cold Water Immersion",
    duration: "2 minutes",
    steps: [
      "Fill a bowl with cold water",
      "Submerge your face or hands for 30 seconds",
      "Take deep breaths",
      "Repeat 2-3 times if needed",
      "Notice the change in your mental state",
    ],
    whenToUse: "When needing an immediate physical reset",
  },
  {
    id: 'tool-reach-out',
    title: "Reach Out to Someone",
    duration: "10 minutes",
    steps: [
      "Identify a trusted person you can contact",
      "Call, text, or visit them",
      "Share how you're feeling",
      "Listen to their support and advice",
      "Feel the connection and strength",
    ],
    whenToUse: "When feeling isolated or overwhelmed",
  },
];

async function seedCopingTools() {
  app.logger.info('Starting coping tools seed');

  try {
    for (const tool of DEFAULT_COPING_TOOLS) {
      const isMandatory = MANDATORY_TOOL_IDS.includes(tool.id);

      // Check if tool already exists
      const existing = await app.db
        .select()
        .from(appSchema.copingTools)
        .where(eq(appSchema.copingTools.title, tool.title));

      if (existing.length > 0) {
        // Update existing tool to ensure correct mandatory status
        await app.db
          .update(appSchema.copingTools)
          .set({ isMandatory })
          .where(eq(appSchema.copingTools.title, tool.title));

        app.logger.info(
          { title: tool.title, isMandatory },
          'Coping tool already exists, updated mandatory status'
        );
        continue;
      }

      await app.db.insert(appSchema.copingTools).values({
        title: tool.title,
        duration: tool.duration,
        steps: tool.steps,
        whenToUse: tool.whenToUse,
        isMandatory,
      });

      app.logger.info({ title: tool.title, isMandatory }, 'Coping tool created');
    }

    // Ensure all tools not in MANDATORY_TOOL_IDS are set to is_mandatory=false
    // This handles any tools that might exist in the database but aren't in our seed list
    const toolTitles = DEFAULT_COPING_TOOLS.map((t) => t.title);
    const allTools = await app.db
      .select({ id: appSchema.copingTools.id, title: appSchema.copingTools.title })
      .from(appSchema.copingTools);

    for (const existingTool of allTools) {
      // If tool is not in our seed list, it should not be mandatory
      if (!toolTitles.includes(existingTool.title)) {
        await app.db
          .update(appSchema.copingTools)
          .set({ isMandatory: false })
          .where(eq(appSchema.copingTools.id, existingTool.id));

        app.logger.info(
          { title: existingTool.title },
          'Existing tool updated to non-mandatory'
        );
      }
    }

    app.logger.info('Coping tools seed completed successfully');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed coping tools');
    throw error;
  }
}

await seedCopingTools();
process.exit(0);
