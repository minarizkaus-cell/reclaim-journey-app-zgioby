
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
  timer_minutes: number;
  sobriety_date?: string;
  onboarded: boolean;
  email_verified: boolean;
  registration_timestamp?: string;
}

// JournalEntry data model
export interface JournalEntry {
  id: string;
  created_at: string;
  had_craving: boolean;
  triggers: string[];
  intensity?: number;
  tools_used: string[];
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
  started_at: string;
  completed_at?: string;
  triggers: string[];
  intensity: number;
  need_type: 'distract' | 'calm' | 'support' | 'escape' | 'reflect';
}

// CopingTool data model
export interface CopingTool {
  id: string;
  title: string;
  duration: string;
  steps: string[];
  when_to_use: string;
  is_mandatory: boolean;
}

// CopingToolCompletion data model
export interface CopingToolCompletion {
  id: string;
  tool_id: string;
  completed_at: string;
  session_id?: string;
}

// CalendarEvent data model
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  reminder: number;
  reminder_enabled: boolean;
}

// CustomResource data model
export interface CustomResource {
  id: string;
  title: string;
  url?: string;
  notes?: string;
  created_at: string;
}
