// Upload a PDF to Supervisor for citation extraction. When `save` is true,
// forwards `save_all` and `user_id` to persist all extracted references.
const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;

function getAuthHeader(): Record<string, string> {
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (!token) {
    throw new Error('Authentication required. Please log in to use PDF extraction.');
  }
  return { Authorization: `Bearer ${token}` };
}

export async function uploadPdfForReferences(
  file: File,
  opts: { style?: string | null; includeDOI?: boolean; llmParse?: boolean; timeoutMs?: number; save?: boolean; userId?: string | null } = {}
): Promise<any> {
  const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;
  if (!SUP_URL) {
    throw new Error('Supervisor URL not configured. Set REACT_APP_SUPERVISOR_URL in .env');
  }
  // Default to style-less extraction; include DOI and use AI parsing by default
  const style = (opts.style === undefined || opts.style === null || opts.style === 'None') ? 'None' : opts.style;
  const includeDOI = (opts.includeDOI ?? true) ? 'true' : 'false';
  const llmParse = (opts.llmParse ?? true) ? 'true' : 'false';
  const timeoutMs = opts.timeoutMs ?? 90000; // 90s default timeout

  const fd = new FormData();
  fd.append('file', file);

  // Removed GROBID integration: always use backend agent pipeline

  const saveFlag = opts.save === true ? '&save=true' : '';
  const saveAllFlag = opts.save === true ? '&save_all=true' : '';
  const userIdParam = (opts.save && opts.userId) ? `&user_id=${encodeURIComponent(String(opts.userId))}` : '';
  const url = `${SUP_URL}/api/supervisor/citation/upload-pdf?style=${encodeURIComponent(style)}&includeDOI=${includeDOI}&llm_parse=${llmParse}${saveFlag}${saveAllFlag}${userIdParam}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: fd,
      headers: getAuthHeader(),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`PDF extraction timed out after ${Math.round(timeoutMs / 1000)}s. Try a smaller PDF or retry.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
  try { return JSON.parse(outputStr); } catch { return outputStr; }
}
