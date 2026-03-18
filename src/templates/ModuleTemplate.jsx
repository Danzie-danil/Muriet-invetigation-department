import React, { useEffect } from 'react';
import Card from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { useStaleRefresh } from '../hooks/useStaleRefresh';

/**
 * STANDARD MODULE TEMPLATE
 * Use this as a reference for all new modules to ensure:
 * 1. Data doesn't disappear on tab refocus (Stale-While-Revalidate).
 * 2. Real-time updates happen silently in the background.
 * 3. Auto-retry on connection failure is handled.
 */
export default function ModuleTemplate() {
  const { t } = useLanguage();

  // 1. Define the fetching logic in a function
  const fetchMyData = async () => {
    const { data, error } = await supabase
      .from('YOUR_TABLE_NAME')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  };

  // 2. Use the useStaleRefresh hook
  const { 
    data: items, 
    isLoading, 
    error, 
    refresh, 
    backgroundRefresh 
  } = useStaleRefresh(fetchMyData);

  // 3. Setup Real-time Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('my-module-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'YOUR_TABLE_NAME' }, 
        () => backgroundRefresh() // Use backgroundRefresh for silent updates
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [backgroundRefresh]);

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">Module Title</h1>
        </div>
      </div>

      <Card padding="0">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Column 1</th>
              <th style={thStyle}>Column 2</th>
            </tr>
          </thead>
          <tbody>
            {/* 4. Only show loading spinner if data is empty */}
            {isLoading && items.length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: '32px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>{t('common.loading')}</p>
                </td>
              </tr>
            )}

            {/* 5. Handle Errors */}
            {!isLoading && error && (
              <tr>
                <td colSpan={2} style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600 }}>{error}</div>
                  <button onClick={refresh} className="btn-retry">Retry</button>
                </td>
              </tr>
            )}

            {/* 6. Display Data */}
            {!isLoading && items.length === 0 && !error && (
              <tr>
                <td colSpan={2} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No data found.
                </td>
              </tr>
            )}

            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={tdStyle}>{item.column1}</td>
                <td style={tdStyle}>{item.column2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '16px',
  fontSize: '14px'
};
