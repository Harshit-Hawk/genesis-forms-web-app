export interface UserModel {
  id: string;
  email: string;
  name?: string;
  role: 'Organizer' | 'Staff' | 'Guest' | 'Admin';
  passwordHash?: string;
  salt?: string;
  createdAt: string;
}

export interface SessionModel {
  token: string;
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
}

export interface FormModel {
  id: string;
  name: string;
  category: string;
  sheetId: string;
  url?: string;
  createdAt: string;
}

export interface AttendanceModel {
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
}

export interface ResponseModel {
  id: string;
  form: string;
  formName: string;
  formId: string;
  submitted: string;
  submittedAt: string;
  answers: Record<string, string>;
  attendeeName: string;
  teamName?: string;
  team_name?: string;
  phone?: string;
  utr?: string;
  checked_in: boolean;
  checkedIn: boolean;
  checked_in_at?: string;
  checkedInAt?: string;
}

export interface AIAnalysisModel {
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

export interface CommonStoreState {
  users: Record<string, UserModel>;
  sessions: Record<string, SessionModel>;
  forms: FormModel[];
  responses: ResponseModel[];
  attendance: Record<string, AttendanceModel>;
  lastSyncedAt: number;
}
