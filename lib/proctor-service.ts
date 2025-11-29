import { ENV, getUserId } from "./env";

// ============================================================================
// Type Definitions
// ============================================================================

// Study Session Types
export interface StudySession {
  id?: number;
  user_id?: number;
  course_name: string;
  duration_minutes: number;
  session_date?: string;
  notes?: string;
  created_at?: string;
}

export interface PaginatedSessions {
  items: StudySession[];
  total: number;
  page: number;
  page_size: number;
}

// AI Insight Types
export interface AIInsight {
  id: number;
  user_id: number;
  insight_type: string;
  title: string;
  message: string;
  confidence_score: number;
  created_at: string;
}

export interface StudyPattern {
  total_sessions: number;
  total_hours: number;
  average_session_duration: number;
  consistency_score: number;
  most_active_subject: string;
  least_active_subject: string;
  subject_distribution: Record<string, number>;
  peak_study_times: string[];
  study_gaps: Array<{
    start: string;
    end: string;
    days: number;
  }>;
  unique_study_days: number;
}

export interface ReminderSchedule {
  user_id: number;
  schedule: Array<{
    day: string;
    time: string;
    datetime: string;
    message: string;
    subject: string;
  }>;
  total_reminders: number;
}

export interface OptimalStudyTimes {
  user_id: number;
  has_established_pattern: boolean;
  preferred_hours: number[];
  preferred_days: string[];
  recommended_times: string[];
  confidence: string;
}

export interface NeglectedSubjects {
  user_id: number;
  period_days: number;
  neglected_subjects: string[];
  count: number;
  recommendation: string;
}

export interface ShouldStudyNow {
  should_study: boolean;
  message: string;
  days_since_last_session: number;
  last_session_date: string | null;
}

export interface StudyRecommendation {
  type: string;
  priority: string;
  title: string;
  message: string;
}

export interface StudyRecommendations {
  user_id: number;
  total_recommendations: number;
  recommendations: StudyRecommendation[];
  generated_at: string;
}

// Chatbot Types
export interface ChatbotLogStudyResponse {
  success: boolean;
  message: string;
  session_id: number;
  duration_minutes: number;
  session_date: string;
}

export interface ChatbotStatus {
  user_id: number;
  total_sessions: number;
  total_hours: number;
  consistency_score: number;
  last_session_date: string | null;
  days_since_last_session: number;
  current_streak: number;
  top_subject: string;
}

export interface ChatbotInsights {
  insights: AIInsight[];
  summary: string;
}

export interface ActivitySummary {
  period_days: number;
  total_sessions: number;
  total_hours: number;
  subjects_studied: string[];
  average_daily_hours: number;
  summary_text: string;
}

// Supervisor Types
export interface ActivityLog {
  date: string;
  subject: string;
  status: string;
  duration_minutes: number;
}

export interface StudySchedule {
  preferred_times: string[];
}

export interface SupervisorAnalysis {
  student_id: string;
  analysis_summary: {
    total_study_hours: number;
    average_completion_rate: string;
    most_active_subject: string;
    least_active_subject: string;
  };
  recommendations: string[];
  reminder_schedule: Array<{
    day: string;
    time: string;
  }>;
  performance_alerts: Array<{
    type: string;
    message: string;
  }>;
  report_summary: {
    week: string;
    consistency_score: number;
    engagement_level: string;
  };
}

export interface StudentTrends {
  student_id: string;
  period_days: number;
  total_study_hours: number;
  total_sessions: number;
  consistency_score: number;
  most_active_subject: string;
  average_session_duration: number;
  unique_study_days: number;
}

export interface EngagementMetrics {
  student_id: string;
  engagement_level: string;
  consistency_score: number;
  total_sessions_30d: number;
  total_hours_30d: number;
  at_risk: boolean;
  last_activity_days_ago: number;
}

// Analytics Types
export interface UserProgress {
  period_days: number;
  total_sessions: number;
  total_minutes: number;
  total_hours: number;
  sessions_per_week: number;
  avg_session_duration_minutes: number;
  courses: Array<{
    course_name: string;
    session_count: number;
    total_minutes: number;
  }>;
}

export interface ConsistencyTrends {
  period_days: number;
  days_with_sessions: number;
  consistency_percentage: number;
  daily_data: Array<{
    date: string;
    sessions: number;
    total_minutes: number;
  }>;
  weekly_trends: Array<{
    week_start: string;
    sessions: number;
    total_minutes: number;
    days_active: number;
  }>;
}

export interface InsightsData {
  user_id: number;
  period_days: number;
  total_sessions: number;
  total_minutes: number;
  courses: string[];
  sessions: StudySession[];
  day_of_week_distribution: Record<string, number>;
  avg_session_duration: number;
}

// Reminder Types
export interface Reminder {
  id?: number;
  user_id: number;
  scheduled_time: string;
  message: string;
  status: "SENT" | "DELIVERED" | "CLICKED" | "DISMISSED" | "FAILED";
  created_at?: string;
}

export interface ReminderStatus {
  user_id: number;
  total_reminders_30d: number;
  status_counts: Record<string, number>;
  recent_reminders: Reminder[];
}

// User Profile Types
export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface UserReminderData {
  user_id: number;
  total_sessions_30d: number;
  total_minutes_30d: number;
  avg_sessions_per_week: number;
  courses: string[];
  recent_sessions: Array<{
    course_name: string;
    duration_minutes: number;
    session_date: string;
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 
    "Content-Type": "application/json",
    // Token signed with SECRET_KEY from docker-compose, expires 2026-11-29
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MSwiZXhwIjoxNzk1OTUwODg0fQ.eITxTZvy3S0XbJrlKjHPgsWv2k7WsdEyWmL3yu9Cxqs"
  };
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Study Sessions API
// ============================================================================

export async function createStudySession(session: StudySession): Promise<StudySession> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/sessions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(session),
  });
  return handleResponse<StudySession>(response);
}

export async function listStudySessions(params?: {
  page?: number;
  page_size?: number;
  course_name?: string;
  start_date?: string;
  end_date?: string;
}): Promise<PaginatedSessions> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.page_size) queryParams.append("page_size", params.page_size.toString());
  if (params?.course_name) queryParams.append("course_name", params.course_name);
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);

  const response = await fetch(
    `${ENV.BACKEND_API_URL}/sessions?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<PaginatedSessions>(response);
}

export async function getStudySession(sessionId: number): Promise<StudySession> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/sessions/${sessionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<StudySession>(response);
}

export async function updateStudySession(
  sessionId: number,
  session: Partial<StudySession>
): Promise<StudySession> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/sessions/${sessionId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(session),
  });
  return handleResponse<StudySession>(response);
}

export async function deleteStudySession(sessionId: number): Promise<void> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete session: ${response.statusText}`);
  }
}

// ============================================================================
// AI & Insights API
// ============================================================================

export async function generateAIInsights(forceRegenerate = false): Promise<AIInsight[]> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/generate-insights`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ force_regenerate: forceRegenerate }),
  });
  return handleResponse<AIInsight[]>(response);
}

export async function getPreviousInsights(limit = 10): Promise<AIInsight[]> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/insights?limit=${limit}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<AIInsight[]>(response);
}

export async function analyzeStudyPatterns(days = 30): Promise<StudyPattern> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/study-patterns?days=${days}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<StudyPattern>(response);
}

export async function createReminderSchedule(
  daysAhead = 7,
  preferredTimes: string[] = ["19:00", "21:00"]
): Promise<ReminderSchedule> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/reminder-schedule`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      days_ahead: daysAhead,
      preferred_times: preferredTimes,
    }),
  });
  return handleResponse<ReminderSchedule>(response);
}

export async function getOptimalStudyTimes(): Promise<OptimalStudyTimes> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/optimal-study-times`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<OptimalStudyTimes>(response);
}

export async function getNeglectedSubjects(days = 7): Promise<NeglectedSubjects> {
  const response = await fetch(
    `${ENV.BACKEND_API_URL}/ai/neglected-subjects?days=${days}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<NeglectedSubjects>(response);
}

export async function shouldStudyNow(): Promise<ShouldStudyNow> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/should-study-now`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<ShouldStudyNow>(response);
}

export async function getStudyRecommendations(): Promise<StudyRecommendations> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/ai/study-recommendations`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<StudyRecommendations>(response);
}

// ============================================================================
// Chatbot Integration API
// ============================================================================

export async function logStudyViaChatbot(
  session: StudySession
): Promise<ChatbotLogStudyResponse> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/chatbot/log-study`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(session),
  });
  return handleResponse<ChatbotLogStudyResponse>(response);
}

export async function getChatbotStatus(): Promise<ChatbotStatus> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/chatbot/status`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<ChatbotStatus>(response);
}

export async function triggerReminderViaChatbot(
  subject: string,
  customMessage?: string
): Promise<{ success: boolean; message: string; scheduled_time: string; subject: string }> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/chatbot/trigger-reminder`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      subject,
      custom_message: customMessage,
    }),
  });
  return handleResponse(response);
}

export async function getChatbotInsights(): Promise<ChatbotInsights> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/chatbot/insights`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<ChatbotInsights>(response);
}

export async function getActivitySummary(days = 7): Promise<ActivitySummary> {
  const response = await fetch(
    `${ENV.BACKEND_API_URL}/chatbot/activity-summary?days=${days}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<ActivitySummary>(response);
}

// ============================================================================
// Supervisor Agent API
// ============================================================================

export async function analyzeStudent(
  studentId: string,
  activityLog: ActivityLog[],
  studySchedule: StudySchedule
): Promise<SupervisorAnalysis> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/supervisor/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      student_id: studentId,
      activity_log: activityLog,
      study_schedule: studySchedule,
    }),
  });
  return handleResponse<SupervisorAnalysis>(response);
}

export async function getStudentTrends(
  studentId: string,
  days = 30
): Promise<StudentTrends> {
  const response = await fetch(
    `${ENV.BACKEND_API_URL}/supervisor/student-trends/${studentId}?days=${days}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<StudentTrends>(response);
}

export async function getEngagementMetrics(studentId: string): Promise<EngagementMetrics> {
  const response = await fetch(
    `${ENV.BACKEND_API_URL}/supervisor/engagement-metrics/${studentId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<EngagementMetrics>(response);
}

// ============================================================================
// Analytics API
// ============================================================================

export async function getUserProgress(days = 30): Promise<UserProgress> {
  const response = await fetch(
    `${ENV.BACKEND_API_URL}/analytics/user-progress?days=${days}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<UserProgress>(response);
}

export async function getConsistencyTrends(days = 30): Promise<ConsistencyTrends> {
  const response = await fetch(
    `${ENV.BACKEND_API_URL}/analytics/consistency?days=${days}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<ConsistencyTrends>(response);
}

export async function getInsightsData(): Promise<InsightsData> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/analytics/insights-data`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<InsightsData>(response);
}

// ============================================================================
// Reminders API
// ============================================================================

export async function logReminder(reminder: Reminder): Promise<Reminder> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/reminders/log`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(reminder),
  });
  return handleResponse<Reminder>(response);
}

export async function getReminderStatus(): Promise<ReminderStatus> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/reminders/status`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<ReminderStatus>(response);
}

// ============================================================================
// User Profile API
// ============================================================================

export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/users/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<UserProfile>(response);
}

export async function updateUserProfile(
  profile: Partial<Pick<UserProfile, "email" | "full_name">>
): Promise<UserProfile> {
  const response = await fetch(`${ENV.BACKEND_API_URL}/users/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profile),
  });
  return handleResponse<UserProfile>(response);
}

export async function getUserReminderData(userId?: number): Promise<UserReminderData> {
  const id = userId || getUserId();
  const response = await fetch(`${ENV.BACKEND_API_URL}/users/${id}/reminder-data`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<UserReminderData>(response);
}
