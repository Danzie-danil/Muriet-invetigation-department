import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export default function CaseProgression() {
  const { t, lang } = useLanguage();
  const [progressions, setProgressions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const retryTimer = useRef(null);

  const fetchProgressions = useCallback(async (isBackground = false) => {
    // Only show loading spinner on the very first fetch or when we have no data
    const shouldShowSpinner = !isBackground && progressions.length === 0;
    
    if (shouldShowSpinner) setIsLoading(true);
    if (!isBackground) setFetchError(null);
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    try {
      const { data, error } = await withTimeout(
        supabase.from('case_progression').select('*, cases(rb_number, suspect_full_name, status)').order('created_at', { ascending: false }),
        8000
      );
      if (error) throw error;
      setProgressions(data || []);
      if (!isBackground) setFetchError(null);
    } catch (err) {
      console.error('Error fetching progressions:', err);
      if (!isBackground) {
        setFetchError(err.message || 'Connection failed. Retrying...');
        retryTimer.current = setTimeout(() => fetchProgressions(false), 5000);
      }
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [progressions.length]); // Re-memoize if data length changes to update spinner logic correctly

  useEffect(() => {
    fetchProgressions(false);
    const channel = supabase
      .channel('progression-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_progression' }, () => { fetchProgressions(true); })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchProgressions]);

  const thStyle = { padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' };
  const tdStyle = { padding: '16px', fontSize: '14px' };

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('progression.title')}</h1>
          <span className="page-title-tagline">{t('progression.subtitle')}</span>
        </div>
      </div>
      
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}>
                <th style={thStyle}>{t('progression.table.rb')}</th>
                <th style={thStyle}>{t('progression.table.crime')}</th>
                <th style={thStyle}>{t('progression.saDecision')}</th>
                <th style={thStyle}>{t('progression.table.status')}</th>
                <th style={thStyle}>{t('progression.table.lastAction')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && progressions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
              )}
              {!isLoading && fetchError && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '8px' }}>{fetchError}</div>
                  <button onClick={fetchProgressions} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                </td></tr>
              )}
              {!isLoading && progressions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('progression.noProgression')}
                </td></tr>
              )}
              {progressions.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary-color)' }}>{p.cases?.rb_number || '—'}</td>
                  <td style={tdStyle}>{p.cases?.suspect_full_name || '—'}</td>
                  <td style={tdStyle}>{p.action_by_sa || '—'}</td>
                  <td style={tdStyle}>
                    <span className={`badge ${p.cases?.status === 'Forwarded to State Attorney' ? 'badge-blue' : 'badge-green'}`}>
                      {p.cases?.status || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
