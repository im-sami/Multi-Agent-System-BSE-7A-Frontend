const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function buildPrompt(input: string): string {
  return [
    'You are a citation metadata extractor.',
    'From the following text, extract a JSON object with fields:',
    '{',
    '  "title": string,' ,
    '  "author": string,',
    '  "year": string,',
    '  "journal": string,',
    '  "publisher": string,',
    '  "volume": string,',
    '  "issue": string,',
    '  "pages": string,',
    '  "doi": string,',
    '  "url": string,',
    '  "isbn": string,',
    '  "source_type": "article" | "book" | "web",',
    '  "citation_style": "APA" | "MLA" | "Chicago" | "Harvard" | "IEEE" | "None"',
    '}',
    'Return ONLY the JSON, no explanations.',
    'Text:',
    input
  ].join('\n');
}

function tryParseJson(text: string): any | null {
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const sub = text.slice(start, end + 1);
    try { return JSON.parse(sub); } catch {}
  }
  return null;
}

export async function geminiExtractMetadata(inputText: string): Promise<Record<string, any> | null> {
  if (!SUP_URL) throw new Error('Supervisor URL not configured');
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (!token) return null; 

  const prompt = buildPrompt(inputText);
  const payload = {
    request: prompt,
    agentId: 'gemini-wrapper',
    autoRoute: false,
    includeHistory: false,
    agent_specific_data: { request: prompt },
  };

  const res = await fetch(`${SUP_URL}/api/supervisor/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`Supervisor error: ${res.status} ${bodyText}`);
  let rr: any = {};
  try { rr = JSON.parse(bodyText); } catch { return null; }
  const responseStr = rr?.response || '';
  try {
    const obj = JSON.parse(responseStr);
    const txt = obj?.results?.output || obj?.output || obj?.result || responseStr;
    const parsed = typeof txt === 'string' ? tryParseJson(txt) : txt;
    return parsed || null;
  } catch {
    const parsed = tryParseJson(responseStr);
    return parsed || null;
  }
}
