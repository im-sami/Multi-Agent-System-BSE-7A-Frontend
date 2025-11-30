export type SavedCitation = {
  id: number;
  user_id: string;
  style: string;
  raw_text?: string;
  formatted: string;
  created_at: string;
  score?: number;
  metadata?: Record<string, any>;
};

const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function ltmRetrieve(params: {
  agentId?: string;
  query?: string;
  style?: string;
  limit?: number;
  since?: string;
  until?: string;
}): Promise<SavedCitation[]> {
  if (!SUP_URL) {
    throw new Error('Supervisor URL not configured. Set REACT_APP_SUPERVISOR_URL in .env');
  }

  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('api_token') : '') || '';
  if (!token) {
    return [];
  }
  const payload = {
    agentId: params.agentId || 'citation_manager_agent',
    query: params.query || null,
    style: params.style || null,
    limit: params.limit ?? 50,
    since: params.since || null,
    until: params.until || null,
  };

  const headers = getHeaders();

  const res = await fetch(`${SUP_URL}/api/supervisor/citation/ltm/retrieve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    try {
      const err = JSON.parse(bodyText);
      const msg = err?.detail || err?.error?.message || bodyText;
      throw new Error(`Supervisor error: ${res.status} ${msg}`);
    } catch (_) {
      throw new Error(`Supervisor error: ${res.status} ${bodyText}`);
    }
  }
  let rr: any = {};
  try {
    rr = JSON.parse(bodyText);
  } catch {
    throw new Error('Invalid Supervisor response');
  }
  const responseStr = rr?.response || '[]';
  const toItems = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
      if (Array.isArray((data as any).items)) return (data as any).items;
      if (data.result && Array.isArray((data.result as any).items)) return (data.result as any).items;
      if (Array.isArray((data as any).data)) return (data as any).data;
    }
    return [];
  };
  const mapItem = (it: any, i: number): SavedCitation => ({
    id: typeof it.id === 'number' ? it.id : (typeof it.id === 'string' ? parseInt(it.id, 10) || i : i),
    user_id: it.user_id || it.userId || '',
    style: it.style || it.citation_style || 'APA',
    raw_text: it.raw_text || it.rawText || '',
    formatted: it.formatted || it.citation || '',
    created_at: typeof it.created_at === 'string' ? it.created_at : (it.createdAt || it.timestamp || ''),
    metadata: it.metadata || it.meta || {},
  });
  try {
    const parsed = JSON.parse(responseStr);
    const arr = toItems(parsed);
    if (arr.length > 0) return arr.map(mapItem);
    const fallback = toItems(rr?.response);
    return fallback.map(mapItem);
  } catch {
    const arr = toItems(rr?.response);
    return arr.map(mapItem);
  }
}
