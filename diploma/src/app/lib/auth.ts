export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const KEY = "investai_session";

export function getSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
