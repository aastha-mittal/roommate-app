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
  const contentType = res.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) {
    const d = data as { error?: unknown; detail?: string };
    let msg: string;
    if (typeof d.error === "string") msg = d.error;
    else if (d.error != null) msg = JSON.stringify(d.error);
    else msg = res.statusText || "Request failed";
    if (typeof d.detail === "string" && d.detail) msg = `${msg}: ${d.detail}`;
    throw new Error(msg);
  }
  return data as T;
}

export interface AuthConfigResponse {
  cmuSsoEnabled: boolean;
  cmuLoginUrl: string | null;
  devPasswordLogin: boolean;
}

export const auth = {
  config: () => api<AuthConfigResponse>("/auth/config"),
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
  /** Pass signal so startup auth check cannot hang forever (e.g. DB unreachable). */
  me: (signal?: AbortSignal) =>
    api<{ id: string; email: string; onboardingComplete: boolean }>("/auth/me", { signal }),
};

export const housing = {
  options: (firstYear: boolean, housingType: "ON_CAMPUS" | "OFF_CAMPUS") =>
    api<HousingOptionsResponse>(
      `/housing/options?firstYear=${firstYear ? "true" : "false"}&housingType=${housingType}`
    ),
};

export interface HousingOptionsResponse {
  firstYearDorms: { id: string; label: string }[];
  upperclassDorms: { id: string; label: string }[];
  onCampusDorms: { id: string; label: string }[];
  neighborhoods: { id: string; label: string }[];
  roomStyles: { id: string; label: string }[];
  offCampusRoomTypes: { id: string; label: string }[];
}

export const profile = {
  get: () => api<ProfileResponse>("/profile"),
  update: (data: ProfileUpdate) => api<ProfileResponse>("/profile", { method: "PATCH", body: JSON.stringify(data) }),
  onboardingComplete: () => api<{ onboardingComplete: boolean }>("/profile/onboarding-complete", { method: "POST" }),
};

export const match = {
  stats: () =>
    api<{
      likesGiven: number;
      passesGiven: number;
      matchCount: number;
      onboardingComplete: boolean;
      housingType?: string;
      displayName?: string;
    }>("/match/stats"),
  candidates: (limit?: number) =>
    api<{ candidates: Candidate[]; meta?: { poolSampled: number; cohortSize: number } }>(
      `/match/candidates${limit ? `?limit=${limit}` : ""}`
    ),
  like: (userId: string) =>
    api<{ like: boolean; match: Match | null }>(`/match/like/${userId}`, { method: "POST" }),
  pass: (userId: string) =>
    api<{ pass: boolean }>(`/match/pass/${userId}`, { method: "POST" }),
  list: () => api<{ matches: MatchListItem[] }>("/match"),
  likes: () => api<{ likes: LikeSentItem[] }>("/match/likes"),
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
  displayName?: string;
  schoolYear?: string;
  isFirstYear?: boolean;
  housingType?: string;
  preferredAreas: string[];
  dormRanking?: string[];
  roomStylePreferences?: string[];
  budgetMin?: number;
  budgetMax?: number;
  leaseDuration?: string;
  moveInDate?: string;
  offCampusRoomType?: string;
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
  preferences?: { category: string; value: string; strength: number; dealbreaker: boolean }[];
}

export type ProfileUpdate = Partial<ProfileResponse> & {
  preferences?: { category: string; value: string; strength: number; dealbreaker: boolean }[];
};

export interface Candidate {
  userId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  tags: string[];
  housingType?: string;
  isFirstYear?: boolean;
  schoolYear?: string;
  preferredAreas: string[];
  dormRanking?: string[];
  dormLabels?: string[];
  topDormLabel?: string;
  budgetMin?: number;
  budgetMax?: number;
  leaseDuration?: string;
  offCampusRoomType?: string;
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
  sharedActivities?: string[];
  roomStylePreferences?: string[];
  compatibilityScore: number;
  compatibilityExplanation: string[];
}

export interface LikeSentItem extends Candidate {
  likedAt: string;
  status: "pending" | "matched";
  matchId: string | null;
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
  otherProfile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    housingType?: string | null;
  };
  compatibilityScore?: number | null;
  compatibilityExplanation?: string[];
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
