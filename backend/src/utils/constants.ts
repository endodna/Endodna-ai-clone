export const SESSION_KEY = (sessionId: string) => `session:${sessionId}`;
export const SESSION_BLACKLIST_KEY = (sessionId: string) => `session_blacklist:${sessionId}`;
export const SESSION_BLACKLIST_EXPIRY_TIME = 86400; // 1 day in seconds