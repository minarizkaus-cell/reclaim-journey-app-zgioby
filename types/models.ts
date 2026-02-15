
// User data model
export interface User {
  id: string;
  email: string;
  display_name?: string;
  timezone?: string;
  sponsor_name?: string;
  sponsor_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  timer_minutes: number; // Default 15
  sobriety_date?: string; // YYYY-MM-DD format
  onboarded: boolean;
}

// JournalEntry data model
export interface JournalEntry {
  id: string;
  created_at: string; // ISO 8601 date string
  had_craving: boolean;
  triggers: string[]; // Array of strings
  intensity?: number; // Nullable number
  tools_used: string[]; // Array of strings
  outcome: 'resisted' | 'partial' | 'used';
  notes?: string;
}

// Journal statistics
export interface JournalStats {
  totalEntries: number;
  cravingCount: number;
  resistedCount: number;
  partialCount: number;
  usedCount: number;
  commonTriggers: string[];
  commonTools: string[];
  averageIntensity: number;
}

// CravingSession data model
export interface CravingSession {
  id: string;
  started_at: string; // ISO 8601 date string
  completed_at?: string; // ISO 8601 date string, nullable
  triggers: string[]; // Array of strings
  intensity: number;
  need_type: 'distract' | 'calm' | 'support' | 'escape' | 'reflect';
}

// CopingTool data model
export interface CopingTool {
  id: string;
  title: string;
  duration: string;
  steps: string[]; // Array of strings
  when_to_use: string;
  is_mandatory: boolean;
}

// CalendarEvent data model
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string; // Optional string
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  duration: number; // Duration in minutes
  reminder: number; // Reminder time in minutes before event
  reminder_enabled: boolean;
}

// CustomResource data model
export interface CustomResource {
  id: string;
  title: string;
  url?: string; // Optional string
  notes?: string; // Optional string
  created_at: string; // ISO 8601 date string
}
