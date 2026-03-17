import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../components/ui/Card';
import { ShieldAlert, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export default function AuditLogView() {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const retryTimer = useRef(null);

  const fetchLogs = useCallback(async (isBackground = false) => {
    // Only show loading spinner on the very first fetch or when we have no data
    const shouldShowSpinner = !isBackground && logs.length === 0;
    
    if (shouldShowSpinner) setIsLoading(true);
    if (!isBackground) setFetchError(null);
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    try {
      const { data, error } = await withTimeout(
        supabase.from('system_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(100),
        8000
      );
      if (error) throw error;
      setLogs(data || []);
      if (!isBackground) setFetchError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      if (!isBackground) {
        setFetchError(err.message || 'Connection failed. Retrying...');
        retryTimer.current = setTimeout(() => fetchLogs(false), 5000);
      }
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [logs.length]); // Re-memoize if data length changes to update spinner logic correctly

  useEffect(() => {
    fetchLogs(false);
    const channel = supabase
      .channel('auditlogs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs' }, () => { fetchLogs(true); })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchLogs]);

  const getBadgeStyle = (action) => {
    if (action?.includes('CREATE') || action?.includes('INSERT')) return { background: '#dcfce7', color: '#166534' };
    if (action?.includes('UPDATE') || action?.includes('STATUS')) return { background: '#dbe1ff', color: 'var(--primary-color)' };
    if (action?.includes('DELETE')) return { background: '#fef2f2', color: '#c62828' };
    return { background: '#f3f4f6', color: 'var(--text-muted)' };
  };

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('audit.title')}</h1>
        </div>
        <div style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
          <ShieldAlert size={18} /> {t('audit.accountability')}
        </div>
      </div>
      
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)' }}>{t('audit.table.timestamp')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)' }}>{t('audit.table.actor')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)' }}>{t('audit.table.action')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)' }}>{t('audit.table.details')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
              )}
              {!isLoading && fetchError && (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '8px' }}>{fetchError}</div>
                  <button onClick={fetchLogs} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                </td></tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('audit.noLogs')}
                </td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{log.profiles?.full_name || log.user_id?.substring(0, 8) + '...'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, ...getBadgeStyle(log.action) }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 500 }}>{log.table_name} {log.record_id ? `— ${log.record_id.substring(0, 8)}...` : ''}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {log.details ? JSON.stringify(log.details).substring(0, 60) + '...' : '—'}
                    </div>
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
