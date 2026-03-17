import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { UserPlus, UserCheck, Calendar, Search, Filter, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatPhoneNumbersInText, capitalizeSentences, withTimeout } from '../lib/utils';

export default function HabitualCriminals() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedHabitualForAttendance, setSelectedHabitualForAttendance] = useState(null);
  const [attendanceNote, setAttendanceNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const retryTimer = useRef(null);
  const [habituals, setHabituals] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const fetchData = useCallback(async (isBackground = false) => {
    // Only show loading spinner on the very first fetch or when we have no data
    const shouldShowSpinner = !isBackground && habituals.length === 0;
    
    if (shouldShowSpinner) setIsLoading(true);
    if (!isBackground) setFetchError(null);
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    try {
      const [{ data: regs, error: e1 }, { data: att, error: e2 }] = await withTimeout(Promise.all([
        supabase.from('habitual_register').select('*').order('suspect_name'),
        supabase.from('habitual_attendance').select('*, profiles(full_name)').order('attendance_date', { ascending: false })
      ]), 8000);
      if (e1) throw e1;
      if (e2) throw e2;
      setHabituals(regs || []);
      setAttendance(att || []);
      if (!isBackground) setFetchError(null);
    } catch (err) {
      console.error('Error fetching habitual data:', err);
      if (!isBackground) {
        setFetchError(err.message || 'Connection failed. Retrying...');
        retryTimer.current = setTimeout(() => fetchData(false), 5000);
      }
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [habituals.length]); // Re-memoize if data length changes to update spinner logic correctly

  useEffect(() => {
    fetchData(false);
    const channel = supabase
      .channel('habituals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habitual_register' }, () => { fetchData(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habitual_attendance' }, () => { fetchData(true); })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchData]);


  const getLastAttendanceDate = (hId) => {
    const records = attendance.filter(a => a.register_id === hId).sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));
    return records.length > 0 ? records[0].attendance_date?.split('T')[0] : t('habituals.modal.never');
  };

  const [newHabitual, setNewHabitual] = useState({
    name: '',
    nida: '',
    lastCrime: '',
    phone: '',
    reportingDays: []
  });

  const handleDayToggle = (day) => {
    setNewHabitual(prev => ({
      ...prev,
      reportingDays: prev.reportingDays.includes(day)
        ? prev.reportingDays.filter(d => d !== day)
        : [...prev.reportingDays, day]
    }));
  };

  const handleNameInput = (value) => {
    const formattedValue = value.toUpperCase();
    if (/[0-9]/.test(formattedValue)) {
      setFormErrors(prev => ({ ...prev, name: lang === 'en' ? 'Only letters are allowed' : 'Herufi pekee zinaruhusiwa' }));
      const sanitized = formattedValue.replace(/[0-9]/g, '');
      setNewHabitual(prev => ({ ...prev, name: sanitized }));
    } else {
      setFormErrors(prev => ({ ...prev, name: null }));
      setNewHabitual(prev => ({ ...prev, name: formattedValue }));
    }
  };

  const handlePhoneInput = (value) => {
    // Auto-expand '0' to '+255-'
    if (value === '0') {
      setNewHabitual(prev => ({ ...prev, phone: '+255-' }));
      return;
    }

    let numbers = value.replace(/[^\d]/g, '');
    if (numbers.startsWith('255')) numbers = numbers.substring(3);
    if (numbers.startsWith('0')) numbers = numbers.substring(1);
    
    let formatted = '';
    if (numbers.length > 0) {
      formatted = '+255-';
      const groups = numbers.match(/.{1,3}/g) || [];
      formatted += groups.slice(0, 3).join('-');
    }
    setNewHabitual(prev => ({ ...prev, phone: formatted.substring(0, 16) }));
  };

  const handleNidaInput = (value) => {
    let numbers = value.replace(/\D/g, '').substring(0, 20);
    let formatted = '';
    for (let i = 0; i < numbers.length; i++) {
      if (i === 8 || i === 13 || i === 18) formatted += '-';
      formatted += numbers[i];
    }
    setNewHabitual(prev => ({ ...prev, nida: formatted }));
  };

  const handleRegister = async () => {
    const missingFields = [];
    if (!newHabitual.name) missingFields.push(t('habituals.modal.fields.name'));
    if (!newHabitual.nida) missingFields.push(t('habituals.modal.fields.nida'));
    if (!newHabitual.phone) missingFields.push(t('habituals.modal.fields.phone'));
    if (!newHabitual.lastCrime) missingFields.push(t('habituals.modal.fields.crime'));
    if (newHabitual.reportingDays.length === 0) missingFields.push(t('habituals.modal.fields.reportingDays'));

    if (missingFields.length > 0) {
      const header = lang === 'en' ? 'Missing Required Fields:' : 'Sehemu zinazohitajika zimepungua:';
      const detailMessage = `${header}\n• ${missingFields.join('\n• ')}`;
      showToast(detailMessage, 'error', 5000);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        suspect_name: newHabitual.name.toUpperCase(),
        suspect_national_id: newHabitual.nida,
        reporting_day: newHabitual.reportingDays[0] || null,
        status: 'Active',
      };
      const { error } = await supabase.from('habitual_register').insert(payload);
      if (error) throw error;
      setIsRegisterModalOpen(false);
      setNewHabitual({ name: '', nida: '', lastCrime: '', phone: '', reportingDays: [] });
      setFormErrors({});
      await fetchData();
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHabituals = useMemo(() => {
    return habituals.filter(h => {
      const matchesSearch = h.suspect_name?.toLowerCase().includes(searchQuery.toLowerCase()) || h.suspect_national_id?.includes(searchQuery);
      const matchesDay = filterDay === 'All' || h.reporting_day === filterDay;
      return matchesSearch && matchesDay;
    });
  }, [habituals, searchQuery, filterDay]);

  const handleOpenAttendanceModal = (habitual) => {
    setSelectedHabitualForAttendance(habitual);
    setAttendanceNote('');
    setIsAttendanceModalOpen(true);
  };

  const handleMarkAttendance = async () => {
    if (!selectedHabitualForAttendance || !user) return;
    setIsSubmitting(true);
    try {
      const payload = {
        register_id: selectedHabitualForAttendance.id,
        io_officer: user.id,
        remarks: attendanceNote,
        attendance_date: new Date().toISOString(),
      };
      const { error } = await supabase.from('habitual_attendance').insert(payload);
      if (error) throw error;
      setIsAttendanceModalOpen(false);
      setAttendanceNote('');
      await fetchData();
    } catch (err) {
      console.error('Attendance error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="u-stack" style={{ gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('habituals.title')}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('habituals.search')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px', width: '260px' }}
            />
          </div>
          <Button variant="primary" onClick={() => setIsRegisterModalOpen(true)}>
            <Plus size={18} /> {t('habituals.registerBtn')}
          </Button>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500, marginTop: '-16px' }}>{t('habituals.subtitle')}</p>

      <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <MetricCard icon={<UserCheck color="var(--primary-color)" />} label={t('habituals.metrics.total')} value={habituals.length} />
        <MetricCard icon={<Clock color="var(--warning-color)" />} label={t('habituals.metrics.reportingToday')} value={habituals.filter(h => h.reporting_day === daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]).length} />
        <MetricCard icon={<AlertTriangle color="var(--danger-color)" />} label={t('habituals.metrics.missed')} value="–" />
      </div>
          <Card padding="0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <h3 className="section-subtitle" style={{ marginBottom: 0 }}>{t('habituals.modal.monitored')}</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)' }}>
                <th style={thStyle}>{t('habituals.table.identity')}</th>
                <th style={thStyle}>{t('habituals.table.schedule')}</th>
                <th style={thStyle}>{t('habituals.table.lastCrime')}</th>
                <th style={thStyle}>{t('habituals.table.status')}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{t('habituals.table.attendance')}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{t('habituals.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHabituals.length === 0 && !isLoading && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('habituals.modal.noHabituals')}</td></tr>
              )}
              {isLoading && filteredHabituals.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
              )}
              {!isLoading && fetchError && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '8px' }}>{fetchError}</div>
                  <button onClick={fetchData} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                </td></tr>
              )}
              {filteredHabituals.map(h => {
                const todayRecord = attendance.find(a => a.register_id === h.id && a.attendance_date?.startsWith(new Date().toISOString().split('T')[0]));
                const isScheduledToday = h.reporting_day === daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
                
                return (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{h.suspect_name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>NIDA: {h.suspect_national_id}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{h.reporting_day || '—'}</span>
                    </td>
                    <td style={tdStyle}>{h.last_evaluated ? new Date(h.last_evaluated).toLocaleDateString() : '—'}</td>
                    <td style={tdStyle}>
                      <span className={`badge ${h.status === 'Active' ? 'badge-blue' : 'badge-green'}`}>{h.status}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {todayRecord ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontWeight: 700, fontSize: '12px', justifyContent: 'flex-end' }}>
                          <CheckCircle2 size={16} /> {t('habituals.reported')} ({todayRecord.time})
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>
                          {t('habituals.pending', 'Pending')}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <Button 
                        variant="primary" 
                        size="small" 
                        onClick={() => handleOpenAttendanceModal(h)}
                      >
                        {t('habituals.updateBtn', 'Update')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={t('habituals.registerBtn')}
        primaryAction={handleRegister}
        size="medium"
      >
        <div className="u-stack">
          <div>
            <label style={labelStyle}>{t('habituals.modal.fields.name')} *</label>
            <input type="text" placeholder="LEGAL NAME..." value={newHabitual.name} onChange={(e) => handleNameInput(e.target.value)} autoComplete="name" />
            {formErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '11px', fontWeight: 600 }}>{formErrors.name}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>{t('habituals.modal.fields.nida')}</label>
              <input type="text" placeholder="XXXXXXXX-XXXXX-XXXXX-XX" value={newHabitual.nida} onChange={(e) => handleNidaInput(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label style={labelStyle}>{t('habituals.modal.fields.phone')}</label>
              <input type="tel" placeholder="+255-XXX-XXX-XXX" value={newHabitual.phone} onChange={(e) => handlePhoneInput(e.target.value)} autoComplete="tel" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('habituals.modal.fields.crime')}</label>
            <input type="text" value={newHabitual.lastCrime} onChange={(e) => setNewHabitual({...newHabitual, lastCrime: capitalizeSentences(formatPhoneNumbersInText(e.target.value))})} autoComplete="off" />
          </div>
          
          <div>
            <label style={labelStyle}>{t('habituals.modal.fields.reportingDays')} *</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => handleDayToggle(day)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    transition: '0.2s',
                    background: newHabitual.reportingDays.includes(day) ? 'var(--primary-color)' : 'transparent',
                    color: newHabitual.reportingDays.includes(day) ? 'white' : 'var(--text-secondary)',
                    borderColor: newHabitual.reportingDays.includes(day) ? 'var(--primary-color)' : 'var(--border-color)',
                  }}
                >
                  {t(`common.days.${day.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={t('habituals.recordAttendance', 'Record Attendance')}
        primaryAction={handleMarkAttendance}
        size="small"
      >
        {selectedHabitualForAttendance && (
          <div className="u-stack">
            <div style={{ padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {selectedHabitualForAttendance.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                NIDA: {selectedHabitualForAttendance.nida}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{t('habituals.lastAttendance', 'Last Attendance')}</label>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {getLastAttendanceDate(selectedHabitualForAttendance.id)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('habituals.currentAttendance', 'Current Attendance')}</label>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={labelStyle}>{t('habituals.officerNotice', 'Officer Notice')}</label>
              <textarea 
                placeholder={t('habituals.noticePlaceholder', 'Enter any observations or notes...')}
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(capitalizeSentences(formatPhoneNumbersInText(e.target.value)))}
                autoComplete="off"
                rows={4}
                style={{ 
                  resize: 'vertical', 
                  minHeight: '100px'
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <Card padding="20px" hoverable>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        </div>
      </div>
    </Card>
  );
}

const thStyle = { padding: '16px 20px', fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '20px 20px', fontSize: '15px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' };
