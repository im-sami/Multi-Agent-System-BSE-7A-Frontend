// Generate a bibliography through Supervisor and request persistence when authenticated.
// Sends `save`, `save_all`, and `user_id` to the Citation Manager Agent.
import { me } from './auth';
const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function generateFinalBibliography(
  items: any[],
  style: string,
  removeDuplicates: boolean = true
): Promise<{ formatted_bibliography: string; count: number }> {
  if (!SUP_URL) {
    throw new Error('Supervisor URL not configured. Set REACT_APP_SUPERVISOR_URL in .env');
  }
  // Resolve authenticated user id to ensure saved citations appear in the user's list
  let userId: string | undefined = undefined;
  const tok = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (tok) {
    try {
      const info = await me();
      userId = (info?.user?.id || info?.id) ? String(info.user?.id || info.id) : undefined;
    } catch (_) {
      userId = undefined;
    }
  }

  const envelope = {
    message_id: `ui-${Date.now()}`,
    sender: 'CitationUI',
    recipient: 'CitationManagerAgent',
    type: 'task_assignment',
    task: {
      name: 'bibliography',
      parameters: {
        items: Array.isArray(items) ? items : [],
        style: (style || 'APA').toUpperCase(),
        remove_duplicates: !!removeDuplicates,
        // Ensure all generated items are persisted when authenticated
        save: !!tok,
        save_all: !!tok,
        user_id: userId,
      }
    }
  };

  const headers = getHeaders();
  const res = await fetch(`${SUP_URL}/api/supervisor/citation/bibliography`, {
    method: 'POST',
    headers,
    body: JSON.stringify(envelope),
  });
  const txt = await res.text();
  if (!res.ok) {
    try {
      const err = JSON.parse(txt);
      throw new Error(err?.detail || txt);
    } catch (_) {
      throw new Error(txt);
    }
  }
  let rr: any = {};
  try { rr = JSON.parse(txt); } catch { rr = {}; }
  const outputStr = rr?.results?.output || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(outputStr); } catch { parsed = {}; }
  const result = parsed?.result || {};
  return { formatted_bibliography: result.formatted_bibliography || '', count: result.count || 0 };
}
