import type { AgeBracket, CharacterGender } from "@/types/database";

export interface AdminStudentOverview {
  student_id: string;
  display_name: string;
  username: string | null;
  birthdate: string | null;
  age_bracket: AgeBracket | null;
  gender: CharacterGender | null;
  character_id: string | null;
  diamonds: number;
  is_active: boolean;
  created_at: string;
  guardian_name: string | null;
  guardian_email: string | null;
  tags: string[];
  status_reason: string | null;
  last_contacted_at: string | null;
  last_activity_at: string | null;
  attempt_count: number;
  correct_count: number;
  accuracy_pct: number | null;
  topics_started: number;
  topics_passed: number;
  assigned_subjects: number;
}

export interface AdminSummary {
  students_total: number;
  students_active: number;
  students_inactive: number;
  active_last_7d: number;
  needs_attention: number;
  attempts_last_7d: number;
  accuracy_last_7d: number | null;
  topics_passed: number;
  diamonds_in_circulation: number;
  purchases_total: number;
  content_subjects: number;
  content_exercises: number;
}

export interface DailyActivity {
  day: string;
  attempts: number;
  correct: number;
  active_students?: number;
  diamonds?: number;
}

export interface SubjectPerformance {
  subject_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  attempts: number;
  accuracy_pct: number | null;
  students: number;
}

export interface AttentionStudent {
  student_id: string;
  display_name: string;
  last_activity_at: string | null;
  accuracy_pct: number | null;
  attempt_count: number;
  reason: string;
}

export interface AdminActivity {
  id: string;
  action: string;
  summary: string;
  student_id?: string | null;
  student_name?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AdminDashboardData {
  summary: AdminSummary;
  daily_activity: DailyActivity[];
  subject_performance: SubjectPerformance[];
  attention: AttentionStudent[];
  recent_admin_activity: AdminActivity[];
}

export interface StudentSubjectProgress {
  subject_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  attempts: number;
  correct: number;
  accuracy_pct: number | null;
  topics_started: number;
  topics_passed: number;
  last_activity_at: string | null;
}

export interface RecentAttempt {
  id: string;
  is_correct: boolean;
  diamonds_earned: number;
  time_spent_seconds: number | null;
  attempted_at: string;
  prompt: string | null;
  topic_name: string;
  subject_name: string;
  subject_icon: string | null;
}

export interface AdminDiamondTransaction {
  id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

export interface AdminStudentRecord {
  id: string;
  display_name: string;
  username: string | null;
  birthdate: string | null;
  age_bracket: AgeBracket | null;
  gender: CharacterGender | null;
  character_id: string | null;
  diamonds: number;
  is_active: boolean;
  created_at: string;
  guardian_name: string | null;
  guardian_email: string | null;
  admin_notes: string | null;
  status_reason: string | null;
  tags: string[];
  last_contacted_at: string | null;
}

export interface AdminStudentDetail {
  student: AdminStudentRecord;
  overview: AdminStudentOverview;
  assigned_subject_ids: string[];
  subjects: StudentSubjectProgress[];
  recent_attempts: RecentAttempt[];
  diamond_transactions: AdminDiamondTransaction[];
  daily_activity: DailyActivity[];
  admin_activity: AdminActivity[];
}
