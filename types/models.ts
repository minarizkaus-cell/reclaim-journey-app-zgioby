
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
