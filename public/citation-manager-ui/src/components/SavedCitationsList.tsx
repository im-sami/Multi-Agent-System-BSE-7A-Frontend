import React, { useEffect, useMemo, useState } from 'react';
import { ltmRetrieve, SavedCitation } from '../api/ltm';

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SavedCitationsList() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [style, setStyle] = useState<string>('');
  const [items, setItems] = useState<SavedCitation[] | any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const styleLabel = useMemo(() => style || 'Any', [style]);

  const visibleItems = useMemo(() => {
    const base: SavedCitation[] = Array.isArray(items) ? items : [];
    const q = (debouncedQuery || '').trim().toLowerCase();
    const s = (style || '').trim();
    return base.filter((it) => {
      if (s && String(it.style || '').trim() !== s) return false;
      if (!q) return true;
      const hay = [
        it.raw_text || '',
        it.formatted || '',
        (it.metadata?.title ? String(it.metadata.title) : ''),
        JSON.stringify(it.metadata || {}),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, debouncedQuery, style]);

  useEffect(() => {
    let mounted = true;
    async function fetchSaved() {
      setLoading(true);
      setError(null);
      try {
        const token = (typeof window !== 'undefined' ? window.localStorage?.getItem('api_token') : '') || '';
        if (!token) {
          if (mounted) {
            setItems([]);
          }
          return;
        }
        const res = await ltmRetrieve({
          query: debouncedQuery || undefined,
          style: style || undefined,
          limit: 50,
        });
        if (mounted) setItems(Array.isArray(res) ? res : []);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load saved citations');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSaved();
    return () => { mounted = false; };
  }, [debouncedQuery, style, refreshTick]);

  useEffect(() => {
    const onSaved = () => setRefreshTick(t => t + 1);
    const onAuth = () => {
      setItems([]); 
      setRefreshTick(t => t + 1);
    };
    window.addEventListener('cm_saved_citation', onSaved as any);
    window.addEventListener('cm_auth_changed', onAuth as any);
    return () => {
      window.removeEventListener('cm_saved_citation', onSaved as any);
      window.removeEventListener('cm_auth_changed', onAuth as any);
    };
  }, []);

  return (
    <div className="cm-saved-wrapper" style={{ marginTop: '24px' }}>
      <div className="cm-form-header">
        <h2 className="cm-form-title">Saved Citations</h2>
        <p className="cm-form-subtitle">Search your previously generated citations</p>
      </div>
      <div className="cm-input-group">
        <label className="cm-label">Search</label>
        <div className="cm-query-row">
          <input
            type="text"
            className="cm-input"
            placeholder="Type to search by text or metadata"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Saved citations search input"
          />
          <div className="cm-query-tools">
            <select
              className="cm-select"
              value={style}
              onChange={e => setStyle(e.target.value)}
              aria-label="Filter by citation style"
            >
              <option value="">Any style</option>
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
              <option value="Chicago">Chicago</option>
              <option value="Harvard">Harvard</option>
              <option value="IEEE">IEEE</option>
            </select>
          </div>
        </div>
        <p className="cm-helper-text">Showing {visibleItems.length} result(s); Style: {styleLabel}</p>
      </div>

      {loading && <p className="cm-helper-text">Loading saved citations…</p>}
      {error && <p className="cm-error-text">{error}</p>}
      {(!loading && !error && items.length === 0 && !((typeof window !== 'undefined' ? window.localStorage?.getItem('api_token') : '') || '')) && (
        <p className="cm-helper-text">Login to see saved citations for your account.</p>
      )}

      <ul className="cm-list" style={{ marginTop: '8px' }}>
        {(Array.isArray(visibleItems) ? visibleItems : []).map(item => {
          const title = (item?.metadata?.title && String(item.metadata.title).trim())
            ? String(item.metadata.title).trim()
            : (item?.raw_text && String(item.raw_text).trim())
              ? String(item.raw_text).trim()
              : (item?.formatted ? String(item.formatted).slice(0, 120) : '(untitled)');
          const dateVal = item?.created_at || '';
          let dateStr = '';
          if (dateVal) {
            let normalized = dateVal;
            if (typeof normalized === 'string') {
              if (/T/.test(normalized) && !/Z$/.test(normalized)) {
                normalized = `${normalized}Z`;
              }
            }
            let d = new Date(normalized);
            if (isNaN(d.getTime()) && typeof normalized === 'string') {
              const tryIso = normalized.replace(' ', 'T') + (normalized.endsWith('Z') ? '' : 'Z');
              d = new Date(tryIso);
            }
            if (!isNaN(d.getTime())) {
              dateStr = d.toLocaleString();
            }
          }
          return (
            <li key={item.id} className="cm-list-item">
              <div className="cm-list-item-content">
                <div className="cm-list-item-title" style={{ fontWeight: 600 }}>
                  {title}
                </div>
                <div className="cm-list-item-subtitle">
                  <span>{item.style || 'Unknown style'}</span>
                  {dateStr && (
                    <span style={{ marginLeft: 8, color: '#666' }}>{dateStr}</span>
                  )}
                </div>
                <div className="cm-list-item-body" style={{ marginTop: 6 }}>
                  {String(item.formatted || '')}
                </div>
              </div>
            </li>
          );
        })}
        {!loading && !error && visibleItems.length === 0 && (
          <li className="cm-list-item">
            <div className="cm-list-item-content">
              <div className="cm-list-item-body">No saved citations found.</div>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
