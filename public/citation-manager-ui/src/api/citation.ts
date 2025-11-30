import { AgentSpecificData, AgentOutput } from '../types';
import { me } from './auth';

const SUP_URL = process.env.REACT_APP_SUPERVISOR_URL;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function submitCitation(agentData: AgentSpecificData, includeDOI: boolean = true): Promise<AgentOutput> {
  if (!SUP_URL) {
    throw new Error('Supervisor URL not configured. Set REACT_APP_SUPERVISOR_URL in .env');
  }

  const userQuery = agentData?.payload?.raw_text || 'Generate citation';
  const style = agentData?.payload?.style;
  const sourceType = agentData?.payload?.source_type;
  const metadata = agentData?.payload?.metadata;
  const llmParse = (agentData as any)?.payload?.llm_parse === true;
  const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('jwt') : '') || '';
  let userId: string | undefined = undefined;
  if (token) {
    try {
      const info = await me();
      userId = (info?.user?.id || info?.id) ? String(info.user?.id || info.id) : undefined;
    } catch (_) {
      userId = undefined;
    }
  }

  const agentSpecificData: Record<string, any> = {
    intent: agentData.intent,
    raw_text: userQuery,
    metadata,
    includeDOI,
    save: !!token,
    save_all: !!token,
    user_id: userId,
  };
  if (style && style !== 'None') {
    agentSpecificData['style'] = style;
    agentSpecificData['citation_style'] = style;
  }
  if (sourceType && sourceType !== 'None') {
    agentSpecificData['source_type'] = sourceType;
    agentSpecificData['citation_source_type'] = sourceType;
  }
  if (llmParse) {
    agentSpecificData['llm_parse'] = true;
  }

  const payload = {
    request: userQuery,
    agentId: 'citation_manager_agent',
    autoRoute: false,
    includeHistory: false,
    agent_specific_data: agentSpecificData,
  };

  const headers = getHeaders();

  const res = await fetch(`${SUP_URL}/api/supervisor/request-unified?use_orchestrator=true`, {
    method: 'POST',
    headers,
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
  const responseStr = rr?.response || '';
  // 1) If we have an actual agent response, prefer it
  if (rr?.status === 'AGENT_RESPONSE' && typeof responseStr === 'string' && responseStr.length > 0) {
    try {
      return JSON.parse(responseStr) as AgentOutput;
    } catch {
      // If agent returned non-JSON, wrap minimally so UI can display
      return {
        status: 'AGENT_RESPONSE',
        result: {
          formatted_citation: responseStr,
          style_used: '',
          confidence: Number(rr?.confidence || 0),
          errors_detected: [],
          suggestions: [],
          parsed_metadata: undefined,
          source_type_used: undefined as any,
        },
        meta: { agent: 'citation_manager', version: '1.0.0', timestamp: new Date().toISOString() }
      };
    }
  }
  // 2) Otherwise, use orchestrator-extracted params for autofill
  if (rr?.extracted_params && typeof rr.extracted_params === 'object') {
    const ep = rr.extracted_params as any;
    const parsed: any = {};
    const mapFields = ['title','author','year','journal','publisher','volume','issue','pages','doi','url','isbn'] as const;
    for (const f of mapFields) { if (ep[f] !== undefined) parsed[f] = String(ep[f]); }
    const out: AgentOutput = {
      status: 'EXTRACTED_PARAMS',
      result: {
        formatted_citation: '',
        style_used: String(ep.citation_style || ep.style || ''),
        confidence: Number(rr?.confidence || 0),
        errors_detected: [],
        suggestions: [],
        parsed_metadata: parsed,
        source_type_used: (ep.source_type || undefined) as any,
      },
      meta: { agent: 'citation_manager', version: '1.0.0', timestamp: new Date().toISOString() }
    };
    return out;
  }
  // 3) Fallback: parse response or return as-is
  try {
    return JSON.parse(responseStr) as AgentOutput;
  } catch {
    return rr?.response as AgentOutput;
  }
}
