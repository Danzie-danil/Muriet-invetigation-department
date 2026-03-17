import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Gavel, Calendar, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export default function CourtAssessment() {
  const { t, lang } = useLanguage();
  const [courtCases, setCourtCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const retryTimer = useRef(null);

  const fetchCourtCases = useCallback(async (isBackground = false) => {
    // Only show loading spinner on the very first fetch or when we have no data
    const shouldShowSpinner = !isBackground && courtCases.length === 0;
    
    if (shouldShowSpinner) setIsLoading(true);
    if (!isBackground) setFetchError(null);
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    try {
      const { data, error } = await withTimeout(
        supabase.from('court_assessment').select('*, cases(rb_number, suspect_full_name)').order('created_at', { ascending: false }),
        8000
      );
      if (error) throw error;
      setCourtCases(data || []);
      if (!isBackground) setFetchError(null);
    } catch (err) {
      console.error('Error fetching court cases:', err);
      if (!isBackground) {
        setFetchError(err.message || 'Connection failed. Retrying...');
        retryTimer.current = setTimeout(() => fetchCourtCases(false), 5000);
      }
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [courtCases.length]); // Re-memoize if data length changes to update spinner logic correctly

  useEffect(() => {
    fetchCourtCases(false);
    const channel = supabase
      .channel('court-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_assessment' }, () => { fetchCourtCases(true); })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchCourtCases]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCase) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('court_assessment')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedCase.id);
      if (error) throw error;
      setNewNote('');
      await fetchCourtCases();
    } catch (err) {
      console.error('Error updating court case:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('court.title')}</h1>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>{t('court.subtitle')}</p>
      
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{t('court.table.caseId')} / {t('court.table.suspect')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>CRM / {t('court.table.court')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{t('court.table.nextDate')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{t('court.table.status')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{t('court.table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && courtCases.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
              )}
              {!isLoading && fetchError && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '8px' }}>{fetchError}</div>
                  <button onClick={fetchCourtCases} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                </td></tr>
              )}
              {!isLoading && courtCases.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('court.proceedings.noCases')}
                </td></tr>
              )}
              {courtCases.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{c.cases?.rb_number || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.cases?.suspect_full_name || '—'}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    <div style={{ fontWeight: 500 }}>{c.case_number_court || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.court_name}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {c.next_hearing_date || 'TBD'}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${c.is_closed ? 'badge-green' : 'badge-blue'}`}>
                      {c.current_stage || (c.is_closed ? 'Concluded' : 'Active')}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedCase(c); setIsLogModalOpen(true); }}>
                      {t('court.proceedings.title')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isLogModalOpen} 
        onClose={() => { setIsLogModalOpen(false); setSelectedCase(null); }} 
        title={`${t('court.proceedings.title')} — ${selectedCase?.cases?.rb_number || ''}`}
        primaryLabel={isSaving ? '...' : t('court.proceedings.addBtn')}
        primaryAction={handleAddNote}
      >
        <div className="u-stack">
          <div style={{ padding: '12px', background: 'var(--bg-surface-active)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('court.proceedings.courtLabel')} <strong>{selectedCase?.court_name}</strong> | {t('court.proceedings.stageLabel')} <strong>{selectedCase?.current_stage || 'N/A'}</strong>
          </div>
          {selectedCase?.verdict && (
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#166534', fontWeight: 600 }}>
              {t('court.proceedings.verdictLabel')} {selectedCase.verdict}
              {selectedCase.sentence_details && ` — ${selectedCase.sentence_details}`}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
              {t('court.proceedings.addNote')}
            </label>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={t('court.proceedings.notePlaceholder')}
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
