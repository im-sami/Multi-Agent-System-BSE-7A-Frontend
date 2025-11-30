import React, { useEffect, useMemo, useState } from 'react';
import { generateFinalBibliography } from '../api/bibliography';
import { CitationStyle } from '../types';

type BibItem = any;

function formatFullCitation(it: BibItem): string {
  const parts: string[] = [];
  const author = (it?.author || it?.authors || '').toString().trim();
  const title = (it?.title || '').toString().trim();
  const year = (it?.year || '').toString().trim();
  const journal = (it?.journal || '').toString().trim();
  const publisher = (it?.publisher || '').toString().trim();
  const volume = (it?.volume || '').toString().trim();
  const issue = (it?.issue || '').toString().trim();
  const pages = (it?.pages || '').toString().trim();
  const doi = (it?.doi || '').toString().trim();
  const url = (it?.url || '').toString().trim();
  const isbn = (it?.isbn || '').toString().trim();

  if (author) parts.push(author);
  if (title) parts.push(`"${title}"`);
  if (year) parts.push(`(${year})`);
  if (journal) parts.push(journal);
  else if (publisher) parts.push(publisher);

  const volIss = [volume && `vol. ${volume}`, issue && `no. ${issue}`].filter(Boolean).join(', ');
  if (volIss) parts.push(volIss);
  if (pages) parts.push(pages);
  if (doi) parts.push(`doi:${doi}`);
  if (url) parts.push(url);
  if (isbn) parts.push(`ISBN ${isbn}`);

  return parts.filter(Boolean).join(', ');
}

export function BibliographyForm() {
  const [items, setItems] = useState<BibItem[]>([]);
  const [style, setStyle] = useState<CitationStyle>('APA');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onAdd(e: Event) {
      try {
        const ce = e as CustomEvent<any>;
        const item = ce?.detail;
        if (item && typeof item === 'object') {
          setItems(prev => [...prev, item]);
        }
      } catch (_) {}
    }
    window.addEventListener('cm_bibliography_add', onAdd as EventListener);
    return () => {
      window.removeEventListener('cm_bibliography_add', onAdd as EventListener);
    };
  }, []);

  function removeAt(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }
  function clearAll() {
    setItems([]);
    setOutput('');
    setError(null);
  }

  function downloadTextFile(filename: string, text: string) {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  }

  async function generate() {
    setError(null);
    setOutput('');
    if (!Array.isArray(items) || items.length === 0) {
      setError('No items in your Bibliography List. Add citations first.');
      return;
    }
    try {
      setLoading(true);
      const res = await generateFinalBibliography(items, style, true);
      setOutput(res.formatted_bibliography || '');
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // Removed bulk save to Saved Citations per user request

  const countLabel = useMemo(() => `${items.length} item${items.length === 1 ? '' : 's'}`, [items.length]);

  useEffect(() => {
    function handleClear() {
      clearAll();
    }
    try {
      window.addEventListener('cm_bibliography_clear', handleClear as EventListener);
    } catch {}
    return () => {
      try {
        window.removeEventListener('cm_bibliography_clear', handleClear as EventListener);
      } catch {}
    };
  }, []);

  return (
    <div className="cm-form" style={{ marginTop: 24, marginBottom: 24 }}>
      <h3 className="cm-result-title">Bibliography</h3>

      <div className="cm-row">
        <label className="cm-label">Final Style</label>
        <select className="cm-select" value={style} onChange={e => setStyle(e.target.value as CitationStyle)}>
          <option value="APA">APA</option>
          <option value="MLA">MLA</option>
          <option value="Chicago">Chicago</option>
          <option value="Harvard">Harvard</option>
          <option value="IEEE">IEEE</option>
        </select>
      </div>

      <p className="cm-helper-text">Collected: {countLabel}. Delete individual items or clear all.</p>

      <div className="cm-row">
        <button type="button" className="cm-btn cm-btn-primary" onClick={generate} disabled={loading || items.length === 0}>
          {loading ? (
            <>
              <span className="cm-spinner"></span>
              Formatting…
            </>
          ) : (
            <>
              <span className="cm-btn-icon">📖</span>
              Generate Final Bibliography
            </>
          )}
        </button>
        <button type="button" className="cm-btn cm-btn-secondary" onClick={clearAll} style={{ marginLeft: 12 }}>
          <span className="cm-btn-icon">🗑️</span>
          Clear All
        </button>
        {/* Removed: Save All to Saved Citations */}
      </div>

      {error && (
        <div className="cm-alert cm-alert-error" style={{ marginTop: 8 }}>
          <span className="cm-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <h3 className="cm-result-title" style={{ marginTop: 12 }}>Bibliography List</h3>
      <ul className="cm-list" style={{ marginTop: 8, marginBottom: 0, paddingLeft: 0, listStyleType: 'none' }}>
        {items.map((it, idx) => {
          const full = (typeof it?.formatted === 'string' && it.formatted.trim().length > 0)
            ? String(it.formatted)
            : formatFullCitation(it);
          return (
            <li key={`bib-${idx}`} className="cm-list-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{full || '(no details)'}</span>
              <button type="button" className="cm-icon-button" aria-label="Delete citation" title="Delete citation" onClick={() => removeAt(idx)}>
                🗑️
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="cm-list-item">No citations added yet.</li>
        )}
      </ul>

      {output && output.trim().length > 0 && (
        <>
          <h3 className="cm-result-title" style={{ marginTop: 12 }}>Final Bibliography ({style})</h3>
          <pre className="cm-json-output" style={{ whiteSpace: 'pre-wrap' }}>{output}</pre>
          <div className="cm-actions-center">
            <button
              type="button"
              className="cm-btn cm-btn-primary"
              onClick={() => downloadTextFile('bibliography.txt', output)}
              title="Download bibliography as a .txt file"
            >
              <span className="cm-btn-icon">⬇️</span>
              Download Bibliography
            </button>
          </div>
        </>
      )}
    </div>
  );
}
