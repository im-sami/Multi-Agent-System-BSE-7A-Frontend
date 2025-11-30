import React, { useEffect, useMemo, useState } from 'react';
import { geminiExtractMetadata } from '../api/gemini';
import { submitCitation } from '../api/citation';
import { AgentOutput, AgentSpecificData, CitationStyle, SourceType } from '../types';

type FormState = {
  style: CitationStyle;
  source_type: SourceType;
  includeDOI: boolean;
  llmParse: boolean;
  styleSelection: 'auto' | 'manual';
  sourceSelection: 'auto' | 'manual';
  doiSelection: 'auto' | 'manual';
  raw_text: string;
  metadata: {
    title: string;
    author: string;
    year: string;
    journal: string;
    publisher: string;
    volume: string;
    issue: string;
    pages: string;
    doi: string;
    url: string;
    isbn: string;
  };
  metadataSelection: {
    title: 'auto' | 'manual';
    author: 'auto' | 'manual';
    year: 'auto' | 'manual';
    journal: 'auto' | 'manual';
    publisher: 'auto' | 'manual';
    volume: 'auto' | 'manual';
    issue: 'auto' | 'manual';
    pages: 'auto' | 'manual';
    doi: 'auto' | 'manual';
    url: 'auto' | 'manual';
    isbn: 'auto' | 'manual';
  };
  llmRevertBuffer?: Partial<FormState['metadata']>;
};

export function CitationForm() {
  const [form, setForm] = useState<FormState>({
    style: 'None',
    source_type: 'None',
    includeDOI: false,
    llmParse: true,
    styleSelection: 'auto',
    sourceSelection: 'auto',
    doiSelection: 'auto',
    raw_text: '',
    metadata: {
      title: '', author: '', year: '', journal: '', publisher: '',
      volume: '', issue: '', pages: '', doi: '', url: '', isbn: '',
    },
    metadataSelection: {
      title: 'auto',
      author: 'auto',
      year: 'auto',
      journal: 'auto',
      publisher: 'auto',
      volume: 'auto',
      issue: 'auto',
      pages: 'auto',
      doi: 'auto',
      url: 'auto',
      isbn: 'auto',
    },
    llmRevertBuffer: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentOutput | null>(null);
  const metadataDisabled = useMemo(() => !!(form.raw_text && form.raw_text.trim().length > 0), [form.raw_text]);
  const [examples, setExamples] = useState<{ text: string; type: SourceType | null; style: CitationStyle | null }[]>([]);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [useGemini, setUseGemini] = useState(true);

  const canSubmit = useMemo(() => {
    return !!(form.raw_text || form.metadata.title || form.metadata.author);
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateMeta<K extends keyof FormState['metadata']>(key: K, value: FormState['metadata'][K]) {
    setForm(prev => ({ 
      ...prev, 
      metadata: { ...prev.metadata, [key]: value },
      metadataSelection: { ...prev.metadataSelection, [key]: 'manual' }
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const payload: any = {
        raw_text: form.raw_text || undefined,
        metadata: { ...form.metadata },
      };
      if (form.llmParse) {
        payload.llm_parse = true;
      }
      if (form.style && form.style !== 'None') payload.style = form.style;
      if (form.source_type && form.source_type !== 'None') payload.source_type = form.source_type;

      const agentData: AgentSpecificData = {
        intent: 'generate_citation',
        payload,
      };
      const output = await submitCitation(agentData, form.includeDOI);
      // If query mode, auto-fill the form metadata from parsed output
      const pm = output?.result?.parsed_metadata;
      const stUsed = (output?.result as any)?.source_type_used as SourceType | undefined;
      if (pm) {
        setForm(prev => ({
          ...prev,
          metadata: {
            title: prev.metadataSelection.title === 'auto' && pm.title ? pm.title : prev.metadata.title,
            author: prev.metadataSelection.author === 'auto' && pm.author ? pm.author : prev.metadata.author,
            year: prev.metadataSelection.year === 'auto' && (pm as any).year ? (pm as any).year : prev.metadata.year,
            journal: prev.metadataSelection.journal === 'auto' && (pm as any).journal ? (pm as any).journal : prev.metadata.journal,
            publisher: prev.metadataSelection.publisher === 'auto' && (pm as any).publisher ? (pm as any).publisher : prev.metadata.publisher,
            volume: prev.metadataSelection.volume === 'auto' && (pm as any).volume ? (pm as any).volume : prev.metadata.volume,
            issue: prev.metadataSelection.issue === 'auto' && (pm as any).issue ? (pm as any).issue : prev.metadata.issue,
            pages: prev.metadataSelection.pages === 'auto' && (pm as any).pages ? (pm as any).pages : prev.metadata.pages,
            doi: prev.metadataSelection.doi === 'auto' && (pm as any).doi ? (pm as any).doi : prev.metadata.doi,
            url: prev.metadataSelection.url === 'auto' && (pm as any).url ? (pm as any).url : prev.metadata.url,
            isbn: prev.metadataSelection.isbn === 'auto' && (pm as any).isbn ? (pm as any).isbn : prev.metadata.isbn,
          }
        }));
      }
      if (stUsed) {
        setForm(prev => ({
          ...prev,
          source_type: prev.sourceSelection === 'auto' ? stUsed : prev.source_type,
        }));
      }
      if (pm) {
        const doiStr = typeof pm?.doi === 'string' ? pm.doi.trim() : '';
        setForm(prev => ({
          ...prev,
          includeDOI: prev.doiSelection === 'auto' ? (doiStr.length > 0) : prev.includeDOI,
        }));
      }
      setResult(output);
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cm_saved_citation'));
        }
      } catch {}
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Helpers to infer style/source and apply query text
  function inferStyleAndType(text: string) {
    const lower = text.toLowerCase();
    const styleMap: Record<string, CitationStyle> = {
      'apa': 'APA', 'mla': 'MLA', 'chicago': 'Chicago', 'harvard': 'Harvard', 'ieee': 'IEEE'
    };
    let detectedStyle: CitationStyle | null = null;
    for (const key of Object.keys(styleMap)) {
      if (lower.includes(key)) { detectedStyle = styleMap[key]; break; }
    }
    const hasDOI = /10\.[\d]{4,9}\/\S+/i.test(text) || /doi\.org\//i.test(text);
    const hasISBN = /\bisbn(?:-1[03])?\b\s*[:#]?\s*[0-9xX\- ]{10,17}/i.test(text);
    const hasArxiv = /arxiv:\d{4}\.\d{4,5}/i.test(text) || /arxiv\.org\/abs\//i.test(text);
    const hasURL = /https?:\/\//i.test(text);
    let inferred: SourceType | null = null;
    if (hasISBN) inferred = 'book';
    else if (hasDOI || hasArxiv) inferred = 'article';
    else if (hasURL) inferred = 'web';
    else if (/(journal|volume|issue|pages)/i.test(text)) inferred = 'article';
    else if (/(publisher|edition)/i.test(text)) inferred = 'book';
    return { detectedStyle, inferred, hasDOI };
  }

  function applyQueryText(text: string) {
    update('raw_text', text);
    const { detectedStyle, inferred, hasDOI } = inferStyleAndType(text);
    setForm(prev => ({
      ...prev,
      style: prev.styleSelection === 'auto' ? (detectedStyle || (text.trim() ? 'None' : prev.style)) : prev.style,
      source_type: prev.sourceSelection === 'auto' ? (inferred || (text.trim() ? 'None' : prev.source_type)) : prev.source_type,
      includeDOI: prev.doiSelection === 'auto' ? !!hasDOI : prev.includeDOI,
    }));

    const titleMatch = text.match(/"([^"]+)"|'([^']+)'/);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
    const authorMatch = text.match(/by\s+([^(),.;]+?)(?=\s*\(|,|published|volume|issue|pages|doi|url|$)/i);
    let author = authorMatch ? authorMatch[1].trim() : '';
    if (author) {
      author = author.replace(/\sand\s/gi, '; ').replace(/\s*;\s*/g, '; ').replace(/\s*,\s*/g, '; ');
    }
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : '';
    let journal = '';
    const pubInMatch = text.match(/published in\s+([^,.]+)(?=,|\.|volume|issue|pages)/i);
    if (pubInMatch) journal = pubInMatch[1].trim();
    const journalOfMatch = text.match(/(Journal of [^,.]+|[A-Z][A-Za-z0-9 &-]+ Journal)/);
    if (!journal && journalOfMatch) journal = journalOfMatch[1].trim();
    let publisher = '';
    const pubByMatch = text.match(/published by\s+([^,.]+)(?=,|\.|\)|$)/i);
    if (pubByMatch) publisher = pubByMatch[1].trim();
    const publisherLabelMatch = text.match(/publisher\s*:\s*([^,.]+)(?=,|\.|\)|$)/i);
    if (!publisher && publisherLabelMatch) publisher = publisherLabelMatch[1].trim();
    const pressMatch = text.match(/\b([A-Za-z][A-Za-z &]+ Press|[A-Za-z][A-Za-z &]+ Publishing|[A-Za-z][A-Za-z &]+ Publishers|[A-Za-z][A-Za-z &]+ Ltd\.)\b/);
    if (!publisher && pressMatch) publisher = pressMatch[0].trim();
    const volumeMatch = text.match(/(?:volume|vol\.)\s*(\d+)/i);
    const volume = volumeMatch ? volumeMatch[1] : '';
    const issueMatch = text.match(/(?:issue|no\.)\s*(\d+)/i);
    const issue = issueMatch ? issueMatch[1] : '';
    const pagesMatch = text.match(/(?:pages|pp\.)\s*([0-9]+(?:[\u2013-][0-9]+)?)/i);
    const pages = pagesMatch ? pagesMatch[1] : '';
    const doiMatch = text.match(/(10\.[0-9]{4,9}\/\S+)/i) || text.match(/doi\.org\/([^\s]+)/i);
    const doi = doiMatch ? (doiMatch[1] || '').replace(/^https?:\/\/doi\.org\//i, '').trim() : '';
    const urlMatch = text.match(/https?:\/\/\S+/i);
    const url = urlMatch ? urlMatch[0] : '';
    const isbnMatch = text.match(/\b(?:isbn(?:-1[03])?)\b\s*[:#]?\s*([0-9xX -]{10,17})/i);
    const isbn = isbnMatch ? (isbnMatch[1] || '').replace(/\s+/g, '').trim() : '';

    setForm(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title: prev.metadataSelection.title === 'auto' ? title : prev.metadata.title,
        author: prev.metadataSelection.author === 'auto' ? author : prev.metadata.author,
        year: prev.metadataSelection.year === 'auto' ? year : prev.metadata.year,
        journal: prev.metadataSelection.journal === 'auto' ? journal : prev.metadata.journal,
        publisher: prev.metadataSelection.publisher === 'auto' ? publisher : prev.metadata.publisher,
        volume: prev.metadataSelection.volume === 'auto' ? volume : prev.metadata.volume,
        issue: prev.metadataSelection.issue === 'auto' ? issue : prev.metadata.issue,
        pages: prev.metadataSelection.pages === 'auto' ? pages : prev.metadata.pages,
        doi: prev.metadataSelection.doi === 'auto' ? doi : prev.metadata.doi,
        url: prev.metadataSelection.url === 'auto' ? url : prev.metadata.url,
        isbn: prev.metadataSelection.isbn === 'auto' ? isbn : prev.metadata.isbn,
      }
    }));
    if (!text.trim()) {
      setForm(prev => ({ ...prev, style: 'None', source_type: 'None', includeDOI: false, styleSelection: 'auto', sourceSelection: 'auto', doiSelection: 'auto' }));
    }
  }

  useEffect(() => {
    const text = form.raw_text?.trim() || '';
    if (!useGemini || !text) return;
    const t = setTimeout(async () => {
      try {
        const meta = await geminiExtractMetadata(text);
        if (meta && typeof meta === 'object') {
          setForm(prev => ({
            ...prev,
            metadata: {
              title: prev.metadataSelection.title === 'auto' && meta.title ? String(meta.title) : prev.metadata.title,
              author: prev.metadataSelection.author === 'auto' && meta.author ? String(meta.author) : prev.metadata.author,
              year: prev.metadataSelection.year === 'auto' && meta.year ? String(meta.year) : prev.metadata.year,
              journal: prev.metadataSelection.journal === 'auto' && meta.journal ? String(meta.journal) : prev.metadata.journal,
              publisher: prev.metadataSelection.publisher === 'auto' && meta.publisher ? String(meta.publisher) : prev.metadata.publisher,
              volume: prev.metadataSelection.volume === 'auto' && meta.volume ? String(meta.volume) : prev.metadata.volume,
              issue: prev.metadataSelection.issue === 'auto' && meta.issue ? String(meta.issue) : prev.metadata.issue,
              pages: prev.metadataSelection.pages === 'auto' && meta.pages ? String(meta.pages) : prev.metadata.pages,
              doi: prev.metadataSelection.doi === 'auto' && meta.doi ? String(meta.doi) : prev.metadata.doi,
              url: prev.metadataSelection.url === 'auto' && meta.url ? String(meta.url) : prev.metadata.url,
              isbn: prev.metadataSelection.isbn === 'auto' && meta.isbn ? String(meta.isbn) : prev.metadata.isbn,
            },
            style: prev.styleSelection === 'auto' && meta.citation_style ? (meta.citation_style as CitationStyle) : prev.style,
            source_type: prev.sourceSelection === 'auto' && meta.source_type ? (meta.source_type as SourceType) : prev.source_type,
            includeDOI: prev.doiSelection === 'auto' ? !!(meta.doi && String(meta.doi).trim().length > 0) : prev.includeDOI,
          }));
        }
      } catch (_) { /* ignore transient errors */ }
    }, 450);
    return () => clearTimeout(t);
  }, [form.raw_text, useGemini]);

  useEffect(() => {
    async function loadExamples() {
      try {
        const res = await fetch('/citation-examples.txt');
        const txt = await res.text();
        const rawLines = txt.split(/\r?\n/);
        const blocks: string[][] = [];
        let buffer: string[] = [];
        for (const ln of rawLines) {
          const trimmed = ln.trim();
          if (trimmed.length === 0) {
            if (buffer.length > 0) {
              blocks.push(buffer);
              buffer = [];
            }
          } else {
            buffer.push(trimmed);
          }
        }
        if (buffer.length > 0) blocks.push(buffer);

        const exampleTexts: string[] = [];
        for (const blk of blocks) {
          const createLines = blk.filter(l => /^Create\s+(?:an|a)\b/i.test(l));
          if (createLines.length > 0) {
            for (const cl of createLines) exampleTexts.push(cl);
          } else {
            const para = blk.join(' ').trim();
            if (para.length > 0) exampleTexts.push(para);
          }
        }

        const toType = (t: string): SourceType | null => {
          const lower = t.toLowerCase();
          if (lower.includes('article')) return 'article';
          if (lower.includes('book')) return 'book';
          if (lower.includes('web') || lower.includes('website')) return 'web';
          return null;
        };
        const toStyle = (t: string): CitationStyle | null => {
          const lower = t.toLowerCase();
          if (lower.includes('apa')) return 'APA';
          if (lower.includes('mla')) return 'MLA';
          if (lower.includes('chicago')) return 'Chicago';
          if (lower.includes('harvard')) return 'Harvard';
          if (lower.includes('ieee')) return 'IEEE';
          return null;
        };
        const exs = exampleTexts.map(line => ({ text: line.replace(/^`|`$/g, ''), type: toType(line) || 'None', style: toStyle(line) || 'None' }));
        setExamples(exs);
        setCurrentExampleIndex(0);
      } catch (_) {
      }
    }
    loadExamples();
  }, []);

  // Helpers for Gemini suggestions/errors apply and revert
  function normalizeFieldName(f?: string | null): keyof FormState['metadata'] | undefined {
    const m = String(f || '').toLowerCase();
    if (!m) return undefined;
    if (m === 'authors') return 'author';
    return ['title','author','year','journal','publisher','volume','issue','pages','doi','url','isbn'].find(k => k === m) as keyof FormState['metadata'] | undefined;
  }

  function inferFieldFromText(text: string): keyof FormState['metadata'] | undefined {
    const t = text.toLowerCase();
    const pairs: [keyof FormState['metadata'], RegExp][] = [
      ['title', /(title|case|capital)/],
      ['author', /(author|authors|name)/],
      ['year', /(year|date|\b(19|20)\d{2}\b)/],
      ['journal', /(journal|periodical)/],
      ['publisher', /(publisher|press)/],
      ['volume', /(volume|vol\.)/],
      ['issue', /(issue|no\.)/],
      ['pages', /(pages|pp\.)/],
      ['doi', /(doi|10\.|doi\.org)/],
      ['url', /(url|https?:)/],
      ['isbn', /(isbn)/],
    ];
    for (const [k, rx] of pairs) { if (rx.test(t)) return k; }
    return undefined;
  }

  function toStringValue(v: any): string {
    if (Array.isArray(v)) return v.join('; ');
    if (v === undefined || v === null) return '';
    return String(v);
  }

  function getFieldString(field: keyof FormState['metadata'] | undefined, obj: any): string {
    if (!field || !obj) return '';
    if (field === 'author') {
      if (Array.isArray(obj?.authors)) return obj.authors.join('; ');
      return toStringValue(obj?.author);
    }
    return toStringValue(obj?.[field]);
  }

  function pickLLMValue(field?: keyof FormState['metadata']): string {
    if (!field) return '';
    const pm = (result?.result?.parsed_metadata as any) || {};
    const llmChanges = (result?.result?.llm_applied_changes || []) as any[];
    const change = llmChanges.find(c => normalizeFieldName(c.field) === field);
    let afterVal: any = undefined;
    if (change) {
      afterVal = change.after;
    } else {
      if (field === 'author') {
        afterVal = Array.isArray(pm?.authors) ? pm.authors.join('; ') : pm?.author;
      } else {
        afterVal = pm?.[field];
      }
    }
    return toStringValue(afterVal).trim();
  }

  function applyFixForField(field?: keyof FormState['metadata']): void {
    if (!field) return;
    let value = pickLLMValue(field);
    if (!value && field === 'doi') {
      const pm = (result?.result?.parsed_metadata as any) || {};
      const pre = (result?.result?.pre_llm_metadata as any) || {};
      const raw = String(pre?.doi ?? pm?.doi ?? form.metadata.doi ?? '').trim();
      if (raw) {
        value = raw.startsWith('http') ? raw : `https://doi.org/${raw.replace(/^https?:\/\/doi\.org\//, '')}`;
      }
    }
    if (!value) return; 
    setForm(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
      metadataSelection: { ...prev.metadataSelection, [field]: 'manual' },
      llmRevertBuffer: { ...prev.llmRevertBuffer, [field]: prev.metadata[field] }
    }));
  }


  function revertFixForField(field?: keyof FormState['metadata']): void {
    if (!field) return;
    const pre = (result?.result?.pre_llm_metadata as any) || {};
    setForm(prev => {
      let buffered = '';
      try { buffered = toStringValue(prev.llmRevertBuffer?.[field]); } catch {}
      let value = buffered;
      if (!value) {
        if (field === 'author') {
          value = Array.isArray(pre?.authors) ? pre.authors.join('; ') : toStringValue(pre?.author);
        } else {
          value = toStringValue(pre?.[field]);
        }
      }
      if (!value) return prev;
      const nextBuffer = { ...(prev.llmRevertBuffer || {}) } as any;
      try { delete nextBuffer[field as any]; } catch {}
      return {
        ...prev,
        metadata: { ...prev.metadata, [field]: value },
        metadataSelection: { ...prev.metadataSelection, [field]: value.trim() ? 'manual' : 'auto' },
        llmRevertBuffer: nextBuffer,
      };
    });
  }

  return (
    <div className="cm-wrapper">
      <form className="cm-form" onSubmit={onSubmit}>
        <div className="cm-form-header">
          <h2 className="cm-form-title">Generate Citation</h2>
          <p className="cm-form-subtitle">Create perfectly formatted academic citations</p>
        </div>

        

        <div className="cm-input-group">
          <label className="cm-label">Query</label>
          <div className="cm-query-row">
            <textarea 
              className="cm-textarea cm-query-text"
              rows={3} 
              value={form.raw_text} 
              onChange={e => {
                const text = e.target.value;
                applyQueryText(text);
              }} 
              placeholder="Type a natural-language request, e.g., 'Create an APA citation for this article titled ... by ... (2021)'"
              aria-label="Citation query input"
            />
            <div className="cm-query-tools">
              <button 
                type="button" 
                className="cm-btn cm-btn-secondary" 
                aria-label="Load example into query"
                title="Load example into query and auto-fill metadata"
                disabled={examples.length === 0}
                onClick={() => {
                  const ex = examples[currentExampleIndex];
                  if (ex) applyQueryText(ex.text);
                }}
              >
                <span className="cm-btn-icon">✨</span>
                Load Example {examples.length > 0 ? `(${currentExampleIndex + 1}/${examples.length})` : ''}
              </button>
              <button 
                type="button" 
                className="cm-btn cm-btn-secondary" 
                aria-label="Load next example"
                title="Cycle to next example and auto-fill metadata"
                disabled={examples.length === 0}
                onClick={() => {
                  if (examples.length > 0) {
                    const next = (currentExampleIndex + 1) % examples.length;
                    setCurrentExampleIndex(next);
                    const ex = examples[next];
                    if (ex) applyQueryText(ex.text);
                  }
                }}
              >
                <span className="cm-btn-icon">➡️</span>
                Next Example
              </button>
              <button 
                type="button" 
                className="cm-btn cm-btn-secondary" 
                aria-label="Clear form"
                title="Clear query, metadata, and results"
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    style: 'None',
                    source_type: 'None',
                    includeDOI: false,
                    styleSelection: 'auto',
                    sourceSelection: 'auto',
                    doiSelection: 'auto',
                    raw_text: '',
                    metadata: {
                      title: '', author: '', year: '', journal: '', publisher: '',
                      volume: '', issue: '', pages: '', doi: '', url: '', isbn: '',
                    },
                    metadataSelection: {
                      title: 'auto', author: 'auto', year: 'auto', journal: 'auto', publisher: 'auto',
                      volume: 'auto', issue: 'auto', pages: 'auto', doi: 'auto', url: 'auto', isbn: 'auto',
                    },
                  }));
                  setResult(null);
                  setError(null);
                }}
                style={{ marginRight: '16px' }}
              >
              <span className="cm-btn-icon">🧹</span>
              Clear
              </button>
              <label className="cm-checkbox-wrapper" style={{ marginLeft: '8px' }}>
                <input
                  type="checkbox"
                  className="cm-checkbox"
                  checked={form.llmParse}
                  onChange={e => {
                    const checked = e.target.checked;
                    update('llmParse', checked);
                    setUseGemini(checked);
                  }}
                />
                <span className="cm-checkbox-label">LLM Assistant</span>
              </label>
              <button
                type="button"
                className="cm-btn cm-btn-secondary"
                aria-label="Fill metadata with Gemini"
                title="Fill metadata with Gemini"
                onClick={async () => {
                  const text = form.raw_text?.trim() || '';
                  if (!text) return;
                  try {
                    const meta = await geminiExtractMetadata(text);
                    if (meta && typeof meta === 'object') {
                      setForm(prev => ({
                        ...prev,
                        metadata: {
                          title: prev.metadataSelection.title === 'auto' && meta.title ? String(meta.title) : prev.metadata.title,
                          author: prev.metadataSelection.author === 'auto' && meta.author ? String(meta.author) : prev.metadata.author,
                          year: prev.metadataSelection.year === 'auto' && meta.year ? String(meta.year) : prev.metadata.year,
                          journal: prev.metadataSelection.journal === 'auto' && meta.journal ? String(meta.journal) : prev.metadata.journal,
                          publisher: prev.metadataSelection.publisher === 'auto' && meta.publisher ? String(meta.publisher) : prev.metadata.publisher,
                          volume: prev.metadataSelection.volume === 'auto' && meta.volume ? String(meta.volume) : prev.metadata.volume,
                          issue: prev.metadataSelection.issue === 'auto' && meta.issue ? String(meta.issue) : prev.metadata.issue,
                          pages: prev.metadataSelection.pages === 'auto' && meta.pages ? String(meta.pages) : prev.metadata.pages,
                          doi: prev.metadataSelection.doi === 'auto' && meta.doi ? String(meta.doi) : prev.metadata.doi,
                          url: prev.metadataSelection.url === 'auto' && meta.url ? String(meta.url) : prev.metadata.url,
                          isbn: prev.metadataSelection.isbn === 'auto' && meta.isbn ? String(meta.isbn) : prev.metadata.isbn,
                        },
                        style: prev.styleSelection === 'auto' && meta.citation_style ? (meta.citation_style as CitationStyle) : prev.style,
                        source_type: prev.sourceSelection === 'auto' && meta.source_type ? (meta.source_type as SourceType) : prev.source_type,
                        includeDOI: prev.doiSelection === 'auto' ? !!(meta.doi && String(meta.doi).trim().length > 0) : prev.includeDOI,
                      }));
                    }
                  } catch (_) { /* ignore */ }
                }}
                style={{ marginLeft: '16px' }}
              >
                <span className="cm-btn-icon">🔷</span>
              </button>
            </div>
          </div>
          <p className="cm-helper-text">Entering a query auto-detects citation style and source type, and fills metadata when possible.</p>
        </div>

        <div className="cm-control-row">
          <div className="cm-select-group">
            <label className="cm-label">Citation Style</label>
            <select 
              className="cm-select" 
              value={form.style} 
              onChange={e => {
                const val = e.target.value as CitationStyle;
                setForm(prev => ({
                  ...prev,
                  style: val,
                  styleSelection: val === 'None' ? 'auto' : 'manual',
                }));
              }}
            >
              <option value="None">None (auto)</option>
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
              <option value="Chicago">Chicago</option>
              <option value="Harvard">Harvard</option>
              <option value="IEEE">IEEE</option>
            </select>
          </div>

          <div className="cm-select-group">
            <label className="cm-label">Source Type</label>
            <select 
              className="cm-select" 
              value={form.source_type} 
              onChange={e => {
                const val = e.target.value as SourceType;
                setForm(prev => ({
                  ...prev,
                  source_type: val,
                  sourceSelection: val === 'None' ? 'auto' : 'manual',
                }));
              }}
            >
              <option value="None">None (auto)</option>
              <option value="article">Article</option>
              <option value="book">Book</option>
              <option value="web">Web</option>
            </select>
          </div>

          <label className="cm-checkbox-wrapper">
            <input 
              type="checkbox" 
              className="cm-checkbox"
              checked={form.includeDOI} 
              onChange={e => setForm(prev => ({ ...prev, includeDOI: e.target.checked, doiSelection: 'manual' }))} 
            />
            <span className="cm-checkbox-label">Include DOI</span>
          </label>
        </div>

        <div className="cm-fieldset">
          <div className="cm-fieldset-header">
            <span className="cm-fieldset-icon">📋</span>
            <span className="cm-fieldset-title">Auto-Filled Metadata</span>
            <span className="cm-fieldset-badge">{metadataDisabled ? 'Filled from Query' : 'Optional'}</span>
          </div>
          
          <div className="cm-metadata-grid">
            <div className="cm-input-group">
              <label className="cm-label">Title</label>
              <input 
                className="cm-input"
                value={form.metadata.title} 
                onChange={e => updateMeta('title', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, title: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Author</label>
              <input 
                className="cm-input"
                value={form.metadata.author} 
                onChange={e => updateMeta('author', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, author: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Year</label>
              <input 
                className="cm-input"
                value={form.metadata.year} 
                onChange={e => updateMeta('year', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, year: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Journal</label>
              <input 
                className="cm-input"
                value={form.metadata.journal} 
                onChange={e => updateMeta('journal', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, journal: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Publisher</label>
              <input 
                className="cm-input"
                value={form.metadata.publisher} 
                onChange={e => updateMeta('publisher', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, publisher: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Volume</label>
              <input 
                className="cm-input"
                value={form.metadata.volume} 
                onChange={e => updateMeta('volume', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, volume: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Issue</label>
              <input 
                className="cm-input"
                value={form.metadata.issue} 
                onChange={e => updateMeta('issue', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, issue: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">Pages</label>
              <input 
                className="cm-input"
                value={form.metadata.pages} 
                onChange={e => updateMeta('pages', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, pages: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">DOI</label>
              <input 
                className="cm-input"
                value={form.metadata.doi} 
                onChange={e => updateMeta('doi', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, doi: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>
            <div className="cm-input-group">
              <label className="cm-label">URL</label>
              <input 
                className="cm-input"
                value={form.metadata.url} 
                onChange={e => updateMeta('url', e.target.value)} 
                onBlur={e => {
                  const empty = !e.target.value.trim();
                  setForm(prev => ({
                    ...prev,
                    metadataSelection: { ...prev.metadataSelection, url: empty ? 'auto' : 'manual' }
                  }));
                }}
              />
            </div>

            {form.source_type === 'book' && ((form.metadata.isbn && form.metadata.isbn.trim().length > 0) || /\bisbn\b/i.test(form.raw_text)) && (
              <div className="cm-input-group">
                <label className="cm-label">ISBN</label>
                <input 
                  className="cm-input"
                  value={form.metadata.isbn} 
                  onChange={e => updateMeta('isbn', e.target.value)} 
                  onBlur={e => {
                    const empty = !e.target.value.trim();
                    setForm(prev => ({
                      ...prev,
                      metadataSelection: { ...prev.metadataSelection, isbn: empty ? 'auto' : 'manual' }
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="cm-actions">
          <button 
            type="submit" 
            className="cm-btn cm-btn-primary" 
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <>
                <span className="cm-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="cm-btn-icon">🚀</span>
                Generate Citation
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="cm-alert cm-alert-error">
            <span className="cm-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </form>

      {result && (
        <div className="cm-result-panel">
          <div className="cm-result-header">
            <h3 className="cm-result-title">Generated Citation</h3>
            <div className="cm-result-badge">
              {result?.result?.style_used || (form.style !== 'None' ? form.style : 'Auto')}
            </div>
            {/* Global Apply/Revert controls removed */}
          </div>

          <div className="cm-citation-output">
            <div className="cm-citation-label">Formatted Citation</div>
            <div className="cm-citation-text">
              {result?.result?.formatted_citation || 'No formatted citation returned.'}
            </div>
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="cm-btn cm-btn-secondary"
                onClick={() => {
                  try {
                    const pm: any = (result?.result?.parsed_metadata as any) || {};
                    const meta = {
                      title: pm.title ?? (typeof form.metadata.title === 'string' ? form.metadata.title : ''),
                      author: pm.author ?? (typeof form.metadata.author === 'string' ? form.metadata.author : ''),
                      year: pm.year ?? (typeof form.metadata.year === 'string' ? form.metadata.year : ''),
                      journal: pm.journal ?? (typeof form.metadata.journal === 'string' ? form.metadata.journal : ''),
                      publisher: pm.publisher ?? (typeof form.metadata.publisher === 'string' ? form.metadata.publisher : ''),
                      volume: pm.volume ?? (typeof form.metadata.volume === 'string' ? form.metadata.volume : ''),
                      issue: pm.issue ?? (typeof form.metadata.issue === 'string' ? form.metadata.issue : ''),
                      pages: pm.pages ?? (typeof form.metadata.pages === 'string' ? form.metadata.pages : ''),
                      doi: pm.doi ?? (typeof form.metadata.doi === 'string' ? form.metadata.doi : ''),
                      url: pm.url ?? (typeof form.metadata.url === 'string' ? form.metadata.url : ''),
                      isbn: pm.isbn ?? (typeof (form as any).metadata?.isbn === 'string' ? (form as any).metadata?.isbn : ''),
                      formatted: result?.result?.formatted_citation || '',
                      citation_style: result?.result?.style_used || (form.style !== 'None' ? form.style : ''),
                    };
                    if (typeof window !== 'undefined') {
                      const ev = new CustomEvent('cm_bibliography_add', { detail: meta });
                      window.dispatchEvent(ev);
                    }
                  } catch (_) {}
                }}
                title="Add this citation to the Bibliography list"
              >
                <span className="cm-btn-icon">📚</span>
                Add to Bibliography
              </button>
            </div>
          </div>

          <div className="cm-result-meta">
            <div className="cm-meta-item">
              <span className="cm-meta-label">Confidence</span>
              <span className="cm-meta-value">
                <span className="cm-confidence-bar">
                  <span 
                    className="cm-confidence-fill" 
                    style={{ width: `${Math.round(((result?.result?.confidence ?? 0) * 100))}%` }}
                  ></span>
                </span>
                {result?.result?.confidence ?? ''}
              </span>
            </div>
            
            {result?.result?.errors_detected?.length > 0 && (
              <div className="cm-meta-item cm-meta-errors">
                <span className="cm-meta-label">⚠️ Errors Detected</span>
                <ul className="cm-list cm-list-errors" style={{ margin: 0, paddingLeft: 0, listStyleType: 'none' }}>
                  {(result?.result?.errors_detected || []).map((err, idx) => (
                    <li key={`err-${idx}`} className="cm-list-item">
                      <span className="cm-inline-icon cm-error-icon" title="Error" aria-label="Error" style={{ color: '#d93025', marginRight: '6px' }}>❌</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result?.result?.suggestions?.length > 0 && (
              <div className="cm-meta-item cm-meta-suggestions">
                <span className="cm-meta-label">💡 Suggestions</span>
                <ul className="cm-list cm-list-suggestions" style={{ margin: 0, paddingLeft: 0, listStyleType: 'none' }}>
                  {(result?.result?.suggestions || []).map((sugg, idx) => {
                    const isLLM = !!(result?.result?.suggestions_llm || []).includes(sugg);
                    return (
                      <li key={`sugg-${idx}`} className="cm-list-item">
                        {isLLM && (
                          <span className="cm-inline-icon" title="Gemini suggestion" aria-label="Gemini suggestion" style={{ marginRight: '6px' }}>🔷</span>
                        )}
                        <span>{sugg}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <details className="cm-details">
            <summary className="cm-details-summary">View Raw JSON Output</summary>
            <pre className="cm-json-output">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
 
