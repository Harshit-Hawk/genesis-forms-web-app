import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CommonStoreState, FormModel, ResponseModel, SessionModel, UserModel } from '@/models';
import { DEFAULT_FORMS } from '@/lib/data';
import realResponses from '@/data/real_responses.json';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'genesis_store.json');

function hashPassword(pwd: string, salt: string): string {
  return crypto.pbkdf2Sync(pwd, salt, 100000, 32, 'sha256').toString('hex');
}

function verifyPassword(pwd: string, salt: string, expectedHash: string): boolean {
  const computed = hashPassword(pwd, salt);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
}

function extractAttendeeName(answers: Record<string, string>): string {
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (lk.includes('full name') || lk.includes('leader name') || lk.includes('team lead') || lk.includes('player name') || lk === 'name') {
      if (answers[key]?.trim()) return answers[key].trim();
    }
  }
  for (const key of Object.keys(answers)) {
    if (key.toLowerCase().includes('name') && answers[key]?.trim()) {
      return answers[key].trim();
    }
  }
  return 'Attendee';
}

function extractPhone(answers: Record<string, string>): string {
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (lk.includes('phone') || lk.includes('whatsapp') || lk.includes('contact') || lk.includes('mobile')) {
      const val = answers[key]?.trim();
      if (val && /\d{8,}/.test(val)) return val.replace(/\D/g, '');
    }
  }
  return '';
}

function extractTeamName(answers: Record<string, string>): string {
  if (!answers) return '';
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (
      (lk.includes('squad name') ||
        lk.includes('team name') ||
        lk.includes('group name') ||
        lk === 'squad' ||
        lk === 'team') &&
      !lk.includes('captain') &&
      !lk.includes('leader') &&
      !lk.includes('lead') &&
      !lk.includes('member') &&
      !lk.includes('player') &&
      !lk.includes('email') &&
      !lk.includes('phone') &&
      !lk.includes('mobile')
    ) {
      const val = answers[key]?.trim();
      if (val && val.toLowerCase() !== 'n/a' && val.toLowerCase() !== 'none' && val.toLowerCase() !== 'na') {
        return val;
      }
    }
  }
  return '';
}

function extractUTR(answers: Record<string, string>): string {
  for (const key of Object.keys(answers)) {
    const lk = key.toLowerCase();
    if (lk.includes('utr') || lk.includes('transaction') || lk.includes('reference') || lk.includes('payment id')) {
      const val = answers[key]?.trim();
      if (val) return val;
    }
  }
  return '';
}

function createInitialState(): CommonStoreState {
  const salt = crypto.randomBytes(16).toString('hex');
  const initialUser: UserModel = {
    id: 'user_harshit',
    email: 'harshitgujjar73@gmail.com',
    name: 'Harshit Gujjar',
    role: 'Organizer',
    salt,
    passwordHash: hashPassword('admin123', salt),
    createdAt: new Date().toISOString()
  };

  const initialForms: FormModel[] = DEFAULT_FORMS.map(f => ({
    id: f.id,
    name: f.name,
    category: f.category,
    sheetId: f.sheet_id,
    url: f.url || `https://docs.google.com/spreadsheets/d/${f.sheet_id}`,
    createdAt: '2026-10-25T00:00:00.000Z'
  }));

  const initialResponses: ResponseModel[] = (realResponses as unknown as Array<{
    id: string;
    form: string;
    form_id?: string;
    submitted: string;
    answers: Record<string, string>;
  }>).map(r => ({
    id: r.id,
    form: r.form,
    formName: r.form,
    formId: r.form_id || '',
    submitted: r.submitted,
    submittedAt: r.submitted,
    answers: r.answers,
    attendeeName: extractAttendeeName(r.answers),
    teamName: extractTeamName(r.answers) || undefined,
    team_name: extractTeamName(r.answers) || undefined,
    phone: extractPhone(r.answers),
    utr: extractUTR(r.answers),
    checked_in: false,
    checkedIn: false
  }));

  return {
    users: {
      'harshitgujjar73@gmail.com': initialUser
    },
    sessions: {},
    forms: initialForms,
    responses: initialResponses,
    attendance: {},
    lastSyncedAt: Date.now()
  };
}

class CommonStore {
  private state: CommonStoreState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CommonStoreState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...createInitialState(),
          ...parsed
        };
      }
    } catch {
      // Fallback
    }

    const initial = createInitialState();
    this.persist(initial);
    return initial;
  }

  private persist(state: CommonStoreState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch {
      // Ignore in read-only environments
    }
  }

  public getState(): CommonStoreState {
    return this.state;
  }

  // --- Auth & Users ---
  public getUser(email: string): UserModel | null {
    return this.state.users[email.toLowerCase().trim()] || null;
  }

  public createUser(email: string, password: string, name?: string, role: UserModel['role'] = 'Organizer'): UserModel {
    const cleanEmail = email.toLowerCase().trim();
    const salt = crypto.randomBytes(16).toString('hex');
    const user: UserModel = {
      id: 'user_' + crypto.randomBytes(6).toString('hex'),
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString()
    };

    this.state.users[cleanEmail] = user;
    this.persist(this.state);
    return user;
  }

  public verifyPassword(email: string, password: string): UserModel | null {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.state.users[cleanEmail];
    if (!user || !user.salt || !user.passwordHash) {
      if (cleanEmail === 'harshitgujjar73@gmail.com' && password === 'admin123') {
        return this.createUser('harshitgujjar73@gmail.com', 'admin123', 'Harshit Gujjar', 'Organizer');
      }
      return null;
    }

    if (verifyPassword(password, user.salt, user.passwordHash)) {
      return user;
    }
    return null;
  }

  public createSession(user: UserModel): SessionModel {
    const token = crypto.randomBytes(32).toString('hex');
    const session: SessionModel = {
      token,
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: Date.now() + 86400 * 30 * 1000 // 30 days
    };

    this.state.sessions[token] = session;
    this.persist(this.state);
    return session;
  }

  public getSession(token: string): SessionModel | null {
    const sess = this.state.sessions[token];
    if (sess && sess.expiresAt > Date.now()) {
      return sess;
    }
    return null;
  }

  public removeSession(token: string): void {
    if (this.state.sessions[token]) {
      delete this.state.sessions[token];
      this.persist(this.state);
    }
  }

  // --- Forms ---
  public getForms(): FormModel[] {
    return this.state.forms;
  }

  public addForm(form: Omit<FormModel, 'id' | 'createdAt'>): FormModel {
    const newForm: FormModel = {
      ...form,
      id: crypto.randomBytes(5).toString('hex'),
      createdAt: new Date().toISOString()
    };
    this.state.forms.push(newForm);
    this.persist(this.state);
    return newForm;
  }

  public deleteForm(id: string): boolean {
    const initialLen = this.state.forms.length;
    this.state.forms = this.state.forms.filter(f => f.id !== id);
    if (this.state.forms.length !== initialLen) {
      this.persist(this.state);
      return true;
    }
    return false;
  }

  // --- Responses & Attendance ---
  public getResponses(): ResponseModel[] {
    return this.state.responses.map(r => {
      const att = this.state.attendance[r.id];
      const isChecked = att ? att.checkedIn : !!(r.checkedIn ?? r.checked_in);
      const checkedAt = att ? att.checkedInAt : (r.checkedInAt || r.checked_in_at);
      const formName = r.form || r.formName || '';
      const submitted = r.submitted || r.submittedAt || '';
      const teamName = r.teamName || r.team_name || extractTeamName(r.answers);

      return {
        ...r,
        form: formName,
        formName: formName,
        teamName: teamName || undefined,
        team_name: teamName || undefined,
        submitted,
        submittedAt: submitted,
        checkedIn: isChecked,
        checked_in: isChecked,
        checkedInAt: checkedAt,
        checked_in_at: checkedAt
      };
    });
  }

  public toggleAttendance(responseId: string, checkedInBy = 'Organizer'): ResponseModel | null {
    const resp = this.state.responses.find(r => r.id === responseId);
    if (!resp) return null;

    const current = this.state.attendance[responseId] ? this.state.attendance[responseId].checkedIn : !!(resp.checkedIn ?? resp.checked_in);
    const nextState = !current;
    const nowTime = nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;

    this.state.attendance[responseId] = {
      checkedIn: nextState,
      checkedInAt: nowTime,
      checkedInBy
    };

    resp.checkedIn = nextState;
    resp.checked_in = nextState;
    resp.checkedInAt = nowTime;
    resp.checked_in_at = nowTime;

    this.persist(this.state);
    return resp;
  }

  public setResponses(newResponses: ResponseModel[]): void {
    const mapped = newResponses.map(r => {
      const att = this.state.attendance[r.id];
      const isChecked = att ? att.checkedIn : !!(r.checkedIn ?? r.checked_in);
      const checkedAt = att ? att.checkedInAt : (r.checkedInAt || r.checked_in_at);
      const teamName = r.teamName || r.team_name || extractTeamName(r.answers);
      return {
        ...r,
        form: r.form || r.formName || '',
        formName: r.formName || r.form || '',
        teamName: teamName || undefined,
        team_name: teamName || undefined,
        submitted: r.submitted || r.submittedAt || '',
        submittedAt: r.submittedAt || r.submitted || '',
        checkedIn: isChecked,
        checked_in: isChecked,
        checkedInAt: checkedAt,
        checked_in_at: checkedAt
      };
    });
    this.state.responses = mapped;
    this.state.lastSyncedAt = Date.now();
    this.persist(this.state);
  }
}

export const serverStore = new CommonStore();

