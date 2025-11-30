const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function login(email: string, password: string): Promise<{ user: any; token: string }> {
  throw new Error('Login is handled by the main frontend');
}

export async function logout(): Promise<void> {
  if (!SUP_URL) throw new Error('Supervisor URL not configured. Set REACT_APP_SUPERVISOR_URL in .env');
  await fetch(`${SUP_URL}/api/auth/logout`, { method: 'POST', headers: getHeaders() });
}

export async function me(): Promise<any> {
  if (!SUP_URL) throw new Error('Supervisor URL not configured. Set REACT_APP_SUPERVISOR_URL in .env');
  const res = await fetch(`${SUP_URL}/api/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}
