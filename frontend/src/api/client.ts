const API_BASE = "/api";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ user: { id: string; email: string; onboardingComplete: boolean }; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    api<{ user: { id: string; email: string; onboardingComplete: boolean }; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () =>
    api<{ id: string; email: string; onboardingComplete: boolean }>("/auth/me"),
};

export const profile = {
  get: () => api<ProfileResponse>("/profile"),
  update: (data: ProfileUpdate) => api<ProfileResponse>("/profile", { method: "PATCH", body: JSON.stringify(data) }),
  onboardingComplete: () => api<{ onboardingComplete: boolean }>("/profile/onboarding-complete", { method: "POST" }),
};

export const match = {
  candidates: (limit?: number) =>
    api<{ candidates: Candidate[] }>(`/match/candidates${limit ? `?limit=${limit}` : ""}`),
  like: (userId: string) =>
    api<{ like: boolean; match: Match | null }>(`/match/like/${userId}`, { method: "POST" }),
  pass: (userId: string) =>
    api<{ pass: boolean }>(`/match/pass/${userId}`, { method: "POST" }),
  list: () => api<{ matches: MatchListItem[] }>("/match"),
};

export const chat = {
  messages: (matchId: string) =>
    api<{ messages: Message[] }>(`/chat/matches/${matchId}/messages`),
  send: (matchId: string, body: string) =>
    api<Message>(`/chat/matches/${matchId}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
};

export interface ProfileResponse {
  id: string;
  userId: string;
  onboardingComplete: boolean;
  housingType?: string;
  preferredAreas: string[];
  budgetMin?: number;
  budgetMax?: number;
  leaseDuration?: string;
  moveInDate?: string;
  genderPreference?: string;
  sleepSchedule?: string;
  cleanlinessLevel?: number;
  guestsFrequency?: string;
  studyEnvironment?: string;
  noiseTolerance?: string;
  smokingStance?: string;
  drinkingStance?: string;
  petsStance?: string;
  introvertExtrovert?: number;
  socialHabits?: string;
  conflictStyle?: string;
  sharedActivities: string[];
  bio?: string;
  tags: string[];
  avatarUrl?: string;
  preferences: { category: string; value: string; strength: number; dealbreaker: boolean }[];
}

export type ProfileUpdate = Partial<ProfileResponse> & { preferences?: { category: string; value: string; strength: number; dealbreaker: boolean }[] };

export interface Candidate {
  userId: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  tags: string[];
  housingType?: string;
  preferredAreas: string[];
  budgetMin?: number;
  budgetMax?: number;
  sleepSchedule?: string;
  cleanlinessLevel?: number;
  compatibilityScore: number;
  compatibilityExplanation: string[];
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  userA?: { id: string; email: string };
  userB?: { id: string; email: string };
}

export interface MatchListItem {
  matchId: string;
  otherUserId: string;
  otherEmail: string;
  otherProfile?: { avatarUrl?: string; bio?: string };
  createdAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  body: string;
  read: boolean;
  createdAt: string;
  sender?: { id: string; email: string };
}
