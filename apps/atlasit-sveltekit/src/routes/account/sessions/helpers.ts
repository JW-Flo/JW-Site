export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const formatTimestamp = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.clone().json();
    if (data && typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error;
    }
  } catch (error) {
    // no-op: fall back to default
  }
  return fallback;
};

export const revokeSession = async (sessionId: string, fetcher: Fetcher) => {
  if (!sessionId) {
    return { success: false, message: 'Session id is required' };
  }

  const response = await fetcher(`/api/auth/sessions/${sessionId}/revoke`, { method: 'POST' });
  if (response.ok) {
    return { success: true, message: 'Session revoked' };
  }
  return {
    success: false,
    message: await getErrorMessage(response, 'Failed to revoke session'),
  };
};

export const revokeAllSessions = async (fetcher: Fetcher) => {
  const response = await fetcher('/api/auth/sessions/revoke-all', { method: 'POST' });
  if (response.ok) {
    return { success: true, message: 'All other sessions revoked' };
  }
  return {
    success: false,
    message: await getErrorMessage(response, 'Failed to revoke sessions'),
  };
};
