import { FormItem, ResponseItem } from '@/types';
import realResponses from '@/data/real_responses.json';

export const DEFAULT_FORMS: FormItem[] = [
  { id: "2cc6c021b4", name: "BGMI Championship", category: "Esports", sheet_id: "1zW0iPE3c7yQNi81sZtuPNsxkXLZvLhtzO13HHZtkDZE" },
  { id: "57fe3cfad4", name: "Tekken", category: "Gaming", sheet_id: "1F30K9HWAJWeAip2coOzUHdDJIY_k5axlpJb0Eyvt2iY" },
  { id: "00d1a90b9a", name: "Vibeathon", category: "Hackathon", sheet_id: "1aXh_IU0gMDpbz6ZdyTOFmLuEtLv7R9ku5QlyXYjRmzU" },
  { id: "d52749b4be", name: "InnovateX", category: "Technical", sheet_id: "1dQyOoBekl_J8q9K6JcsKMdRFDl59LWL5NEYdKoKftSA" },
  { id: "7ab268f8ad", name: "Free Fire Max", category: "Esports", sheet_id: "1d4OMjJ507UmejQbKbywnQFk4fMk06oh9HsnOvIPmi74" },
  { id: "45a0eba3de", name: "Cyber Sleuthus", category: "Technical", sheet_id: "1Q3rjTC92VrYOkVuGQu9pXZUnYiUyubm7uslX0KYpBOU" },
  { id: "21e55ac1f1", name: "Pixel Perfect", category: "Design", sheet_id: "1tbTikDbI_r1mF4JT51qRtfHcjorIm1AHy5kjds05_Lk" },
  { id: "a777013712", name: "Brand Battle", category: "Management", sheet_id: "1LIqpepCo22IljZk9e2gUUguyP8SOxu1FS4tjc22Tl-4" },
  { id: "6eb6825e34", name: "Venture Vault", category: "Management", sheet_id: "1Ij7XbeTBFTR0AMKIIC9Wba6QhYjY-C2CIoTKSyp51VM" },
  { id: "d0ad634b42", name: "Architectural Design Competition", category: "Design", sheet_id: "1GJgwpncmJPQhk6IsH_dtvM9fsLJbcKwsYu60jzBBQ7Y" },
  { id: "7c4bddd5b5", name: "Biz Quest", category: "Management", sheet_id: "1fIqA-8l1ft90ZbOwPLnwHKx8r3GHlMaw9hyatA3ak_s" },
  { id: "16bd3e7870", name: "TECH CHARADES", category: "Cultural", sheet_id: "1xJHQf8sITvZepXXMbOoDT1GlJdhnp_oCSOmGZbQlFsE" },
  { id: "be570e6031", name: "Slide Sizzle", category: "Cultural", sheet_id: "1OHBr-A4hfqx0nuSz8cWIlilUMGVG5NJE_KyGH6t8vOk" },
  { id: "7ee48cb248", name: "Tech Trivia", category: "Technical", sheet_id: "1sSa8OUfCfs__iTcuBxfsvbVdXcYyO3ljccq9M7AgZB8" },
  { id: "3d0c0e7f9e", name: "3D Modeling Sprint", category: "Design", sheet_id: "1_t-bXURc2_0pYoHqCdLYl574ukMPmHDKQdbR5otJKwo" },
  { id: "f2d26e9597", name: "Ludo Mania", category: "Gaming", sheet_id: "17fJLjSeYTyD-Anv48f2ZKWpDe7jm9jUBaA008FMSWfQ" },
  { id: "630ad9369f", name: "The Tech Canvas", category: "Design", sheet_id: "1QcT0SN6ZfcOCb65FjA48ZSQc783iHmwFjAdQMk6r4jo" }
];

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

export const DEFAULT_RESPONSES: ResponseItem[] = (realResponses as any[]).map(r => {
  const team = extractTeamName(r.answers);
  return {
    ...r,
    form: r.form || r.formName || '',
    formName: r.formName || r.form || '',
    formId: r.formId || r.form_id || '',
    form_id: r.form_id || r.formId || '',
    teamName: team || undefined,
    team_name: team || undefined,
    submitted: r.submitted || r.submittedAt || '',
    submittedAt: r.submittedAt || r.submitted || '',
    checked_in: false,
    checkedIn: false
  };
});

export const VENUE_ALLOCATIONS: Record<string, { venue: string; capacity: number }> = {
  "BGMI Championship": { venue: "Esports Arena 1 (Main Stage)", capacity: 100 },
  "Tekken": { venue: "Gaming Hub - Zone B", capacity: 32 },
  "Vibeathon": { venue: "Innovation Center (Hackathon Hall)", capacity: 120 },
  "InnovateX": { venue: "Auditorium A (Ground Floor)", capacity: 60 },
  "Free Fire Max": { venue: "Esports Arena 2 (Mobile Lounge)", capacity: 80 },
  "Cyber Sleuthus": { venue: "Security Lab 402", capacity: 50 },
  "Pixel Perfect": { venue: "Media & Design Lab 201", capacity: 40 },
  "Brand Battle": { venue: "Management Seminar Hall 1", capacity: 45 },
  "Venture Vault": { venue: "Boardroom & Incubation Suite", capacity: 35 },
  "Architectural Design Competition": { venue: "Architecture Studio 3", capacity: 30 },
  "Biz Quest": { venue: "Auditorium B (First Floor)", capacity: 50 },
  "TECH CHARADES": { venue: "Open Amphitheatre Stage", capacity: 60 },
  "Slide Sizzle": { venue: "Seminar Hall 204", capacity: 40 },
  "Tech Trivia": { venue: "Lecture Hall 101", capacity: 70 },
  "3D Modeling Sprint": { venue: "CAD / Modeling Studio 1", capacity: 30 },
  "Ludo Mania": { venue: "Student Activity Center", capacity: 40 },
  "The Tech Canvas": { venue: "Fine Arts & Design Wing", capacity: 35 }
};

