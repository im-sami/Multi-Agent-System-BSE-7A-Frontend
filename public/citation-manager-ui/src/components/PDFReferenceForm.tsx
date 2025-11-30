import React, { useEffect, useRef, useState } from 'react';
import { uploadPdfForReferences } from '../api/pdf';
import { me } from '../api/auth';

type ExtractResult = {
  status: string;
  result: {
    formatted_bibliography?: string;
    items?: any[];
    items_formatted?: string[];
    items_validation?: Array<{ errors: string[]; suggestions: string[]; confidence: number; live_checks?: any }>;
    count?: number;
    style_used?: string;
    include_doi?: boolean;
    llm_parse?: boolean;
    raw_references_text?: string;
  };
  meta?: any;
};

export function PDFReferenceForm() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<ExtractResult | null>(null);
  const [style, setStyle] = useState<string>('APA');
  const [aiParse, setAiParse] = useState<boolean>(true);
  const [doiFetch, setDoiFetch] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const info = await me();
        const id = info?.user?.id || info?.id || null;
        if (id) setUserId(String(id));
      } catch (_) {
      }
    })();
  }, []);

  function splitRawReferences(text?: string): string[] {
    if (!text) return [];
    const src = String(text).replace(/\r/g, '');
    const cleaned = src
      .replace(/(^|\n)\s*(references|bibliography)\s*\n/gi, '\n');

    const blockRegex = /(^\s*(?:\[\d+\]|\d+\.)\s+[\s\S]*?)(?=^\s*(?:\[\d+\]|\d+\.)\s+|\Z)/gm;
    const blocks = cleaned.match(blockRegex);
    if (blocks && blocks.length > 0) {
      return blocks.map(b => b.replace(/^\s*(\[\d+\]|\d+\.)\s*/, '').trim()).filter(Boolean);
    }

    const lines = cleaned.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
    const entries: string[] = [];
    let buf = '';
    const endsEntry = (s: string) => /[\.!?\)]$/m.test(s) || /doi\s*[:=]\s*/i.test(s) || /https?:\/\//i.test(s);
    for (const l of lines) {
      if (!buf) {
        buf = l;
      } else {
        const incomplete = !endsEntry(buf) || /[,;:\-]$/.test(buf);
        if (incomplete) {
          buf = `${buf} ${l}`.replace(/\s{2,}/g, ' ').trim();
        } else {
          entries.push(buf.trim());
          buf = l;
        }
      }
    }
    if (buf.trim()) entries.push(buf.trim());
    if (entries.length <= 2 && entries[0] && /;\s+/.test(entries[0])) {
      const semi = entries[0].split(/;\s+(?=[A-Z][a-z]+|\d{4}\b|https?:\/\/|doi\s*[:=])/).map(s => s.trim()).filter(Boolean);
      if (semi.length > 2) return semi;
    }

    return entries;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOutput(null);
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    try {
      setLoading(true);
      const res = await uploadPdfForReferences(file, {
        style: style || 'APA',
        includeDOI: doiFetch,
        llmParse: aiParse,
        timeoutMs: 180000, 
        save: true, 
        userId: userId || undefined,
      });
      setOutput(res as ExtractResult);
      try { window.dispatchEvent(new Event('cm_saved_citation')); } catch {}
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(idx: number) {
    const it = output?.result?.items?.[idx];
    if (!it) return;
    try {
      const rawLines = splitRawReferences(output?.result?.raw_references_text);
      const formatted = rawLines[idx] || output?.result?.items_formatted?.[idx] || '';
      const detail = { ...it, formatted, citation_style: 'Raw', raw_source_line: rawLines[idx] || '' };
      const ev = new CustomEvent('cm_bibliography_add', { detail });
      window.dispatchEvent(ev);
    } catch (err) {
      console.error('Add to Bibliography failed', err);
    }
  }

  async function saveAllItems() {
    const items = output?.result?.items || [];
    const formattedAll = output?.result?.items_formatted || [];
    const rawLines = splitRawReferences(output?.result?.raw_references_text);
    try {
      items.forEach((it: any, idx: number) => {
        const formatted = rawLines[idx] || formattedAll?.[idx] || '';
        const detail = { ...it, formatted, citation_style: 'Raw', raw_source_line: rawLines[idx] || '' };
        const ev = new CustomEvent('cm_bibliography_add', { detail });
        window.dispatchEvent(ev);
      });
    } catch (err) {
      console.error('Bulk add to Bibliography failed', err);
    }
  }

  function clearAll() {
    setFile(null);
    setOutput(null);
    setError(null);
    setStyle('APA');
    setAiParse(true);
    setDoiFetch(true);
    try {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {}
    try {
      if (typeof window !== 'undefined') {
        const ev = new CustomEvent('cm_bibliography_clear');
        window.dispatchEvent(ev);
      }
    } catch {}
  }
  return (
    <div className="cm-form" style={{ marginTop: 24, marginBottom: 24 }}>
      <h3 className="cm-result-title">PDF Reference Extraction</h3>
      <form onSubmit={onSubmit}>
        <div className="cm-input-group" style={{ marginBottom: 12 }}>
          <label className="cm-label">PDF File</label>
          <input ref={fileInputRef} className="cm-input" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="cm-row" style={{ gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div className="cm-select-group">
            <label className="cm-label">Style</label>
            <select className="cm-select" value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
              <option value="Chicago">Chicago</option>
              <option value="Harvard">Harvard</option>
              <option value="IEEE">IEEE</option>
              <option value="None">None</option>
            </select>
          </div>
          <label className="cm-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={aiParse} onChange={(e) => setAiParse(e.target.checked)} />
            AI Normalize
          </label>
          <label className="cm-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={doiFetch} onChange={(e) => setDoiFetch(e.target.checked)} />
            Metadata Lookup (DOI/URL)
          </label>
        </div>
        <div className="cm-row" style={{ marginTop: 12 }}>
          <button type="submit" className="cm-btn cm-btn-primary" disabled={loading}>{loading ? 'Extracting…' : 'Extract References'}</button>
          <button type="button" className="cm-btn cm-btn-secondary" onClick={clearAll} style={{ marginLeft: 12 }}>
            <span className="cm-btn-icon">🗑️</span>
            Clear All
          </button>
        </div>
        <p className="cm-helper-text" style={{ marginTop: 8 }}>
        </p>
        {error && <div className="cm-alert cm-alert-error" style={{ marginTop: 8 }}><span className="cm-alert-icon">⚠️</span><span>{error}</span></div>}
      </form>

      {output && (
        <>
          {output.result?.items && output.result.items.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <h3 className="cm-result-title" style={{ margin: 0 }}>Extracted References ({output.result.count})</h3>
                <button type="button" className="cm-btn cm-btn-secondary" onClick={saveAllItems}>
                  <span className="cm-btn-icon">➕</span>
                  Add All to Bibliography
                </button>
              </div>
              <ul className="cm-list" style={{ marginTop: 8 }}>
                {output.result.items.map((it: any, idx: number) => (
                  <li key={idx} className="cm-list-item" style={{ marginBottom: 12 }}>
                    {(() => {
                      const rawLines = splitRawReferences(output?.result?.raw_references_text);
                      const displayLine = rawLines[idx] || output.result.items_formatted?.[idx] || `${(it.title || 'Untitled')}${it.year ? ` (${it.year})` : ''}${it.journal ? ` — ${it.journal}` : ''}${it.doi ? ` • DOI: ${it.doi}` : ''}`;
                      return (
                        <div className="cm-helper-text" style={{ marginTop: 0 }}>{displayLine}</div>
                      );
                    })()}
                    <div style={{ marginTop: 6 }}>
                      <button type="button" className="cm-btn cm-btn-secondary" onClick={() => saveItem(idx)}>
                        <span className="cm-btn-icon">➕</span>
                        Add to Bibliography
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
