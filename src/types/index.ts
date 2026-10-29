export interface FormItem {
  id: string;
  name: string;
  category: string;
  sheet_id: string;
  sheetId?: string;
  url?: string;
}

export interface ResponseItem {
  id: string;
  form: string;
  formName?: string;
  form_id?: string;
  formId?: string;
  submitted: string;
  submittedAt?: string;
  answers: Record<string, string>;
  attendeeName?: string;
  teamName?: string;
  team_name?: string;
  phone?: string;
  utr?: string;
  checked_in?: boolean;
  checkedIn?: boolean;
  checked_in_at?: string;
  checkedInAt?: string;
}

export interface User {
  email: string;
  id: string;
  role?: string;
  name?: string;
}

export interface AIAnalysis {
  rank: number;
  event: string;
  category: string;
  total: number;
  capacity: number;
  share: number;
  demand: 'High Demand' | 'Optimal' | 'Moderate' | 'Low';
  projectedTurnout: number;
  venue: string;
}

export interface FilterState {
  query: string;
  event: string;
  category: string;
  attendance: 'all' | 'checked_in' | 'pending';
  sortBy: 'submitted_desc' | 'submitted_asc' | 'name_asc' | 'event_asc';
}

export type ActiveTab = 'overview' | 'desk' | 'ai_table';
