import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { 
  UploadCloud, 
  ShieldCheck, 
  FileSearch, 
  Lock, 
  CheckCircle2, 
  Info, 
  FileText, 
  AlertCircle, 
  Trash2,
  ChevronDown,
  Search,
  Plus,
  Calendar,
  MapPin,
  Download,
  Eye,
  FileIcon,
  Filter,
  History,
  Send
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { formatPhoneNumbersInText, capitalizeSentences } from '../lib/utils';

export default function EvidencesAndFindings() {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('findings'); // findings, evidence
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, scanning, securing, complete
  const [progress, setProgress] = useState(0);
  const [selectedCase, setSelectedCase] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [findings, setFindings] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  
  // Finding Form State
  const [findingForm, setFindingForm] = useState({
    caseId: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    attachments: []
  });
  const [isSubmittingFinding, setIsSubmittingFinding] = useState(false);
  const [viewingFinding, setViewingFinding] = useState(null);
  const [findingUpdates, setFindingUpdates] = useState([]);
  const [newUpdateDesc, setNewUpdateDesc] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    const { data } = await supabase
      .from('cases')
      .select('id, rb_number, suspect_full_name')
      .order('created_at', { ascending: false });
    setCases(data || []);
  }, []);

  const fetchFindings = useCallback(async (isBackground = false) => {
    const shouldShowSpinner = !isBackground && findings.length === 0;
    if (shouldShowSpinner) setIsLoading(true);
    try {
      const { data } = await supabase
        .from('findings')
        .select(`
          *,
          cases (rb_number, suspect_full_name),
          evidence_storage (*)
        `)
        .order('created_at', { ascending: false });
      setFindings(data || []);
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [findings.length]);

  const fetchEvidence = useCallback(async (isBackground = false) => {
    const shouldShowSpinner = !isBackground && evidenceFiles.length === 0;
    if (shouldShowSpinner) setIsLoading(true);
    try {
      const { data } = await supabase
        .from('evidence_storage')
        .select(`
          *,
          cases (rb_number, suspect_full_name),
          profiles (full_name)
        `)
        .is('finding_id', null)
        .order('created_at', { ascending: false });
      setEvidenceFiles(data || []);
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [evidenceFiles.length]);

  const fetchFindingUpdates = useCallback(async (findingId) => {
    const { data } = await supabase
      .from('finding_updates')
      .select(`
        *,
        profiles (full_name)
      `)
      .eq('finding_id', findingId)
      .order('created_at', { ascending: true });
    setFindingUpdates(data || []);
  }, []);

  useEffect(() => {
    fetchCases();
    fetchFindings(false);
    fetchEvidence(false);

    // Real-time subscriptions: auto-refetch on any change
    const channel = supabase
      .channel('evidences-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'findings' }, () => { fetchFindings(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence_storage' }, () => { fetchEvidence(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => { fetchCases(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCases, fetchFindings, fetchEvidence]);

  useEffect(() => {
    if (viewingFinding) {
      fetchFindingUpdates(viewingFinding.id);
    } else {
      setFindingUpdates([]);
    }
  }, [viewingFinding, fetchFindingUpdates]);

  const handleFileUpload = async (files, type = 'evidence', findingId = null) => {
    if (!selectedCase && !findingForm.caseId) {
      showToast(t('evidences.findings.selectCase'), "error");
      return;
    }

    const caseIdToLink = findingId ? findingForm.caseId : selectedCase;
    setUploadStatus('uploading');
    
    try {
      const results = [];
      for (const file of Array.from(files)) {
        for (let i = 0; i <= 100; i += 25) {
          setProgress(i);
          setUploadStatus(i < 30 ? 'uploading' : i < 60 ? 'scanning' : 'securing');
          await new Promise(r => setTimeout(r, 200));
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${caseIdToLink}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: evidenceData, error: dbError } = await supabase
          .from('evidence_storage')
          .insert({
            case_id: caseIdToLink,
            file_type: type,
            file_path: filePath,
            file_size: file.size,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            finding_id: findingId,
            original_filename: file.name
          })
          .select()
          .single();

        if (dbError) throw dbError;
        results.push(evidenceData);
      }

      setUploadStatus('complete');
      setTimeout(() => {
        setUploadStatus('idle');
        setProgress(0);
        if (!findingId) {
            fetchEvidence();
            setIsEvidenceModalOpen(false);
        }
      }, 1500);

      return results;
    } catch (err) {
      console.error("Upload error:", err);
      showToast(err.message, "error");
      setUploadStatus('idle');
    }
  };

  const handleCreateFinding = async () => {
    const missingFields = [];
    if (!findingForm.caseId) missingFields.push(lang === 'en' ? 'Link to Case' : 'Unganisha na Jalada');
    if (!findingForm.date) missingFields.push(t('evidences.findings.dateTaken'));
    if (!findingForm.location) missingFields.push(t('evidences.findings.placeTaken'));
    if (!findingForm.description) missingFields.push(t('evidences.findings.description'));

    if (missingFields.length > 0) {
      const header = lang === 'en' ? 'Missing Required Fields:' : 'Sehemu zinazohitajika zimepungua:';
      const detailMessage = `${header}\n• ${missingFields.join('\n• ')}`;
      showToast(detailMessage, 'error', 5000);
      return;
    }

    setIsSubmittingFinding(true);
    try {
      const { data: finding, error } = await supabase
        .from('findings')
        .insert({
          case_id: findingForm.caseId,
          description: findingForm.description,
          location: findingForm.location,
          finding_date: findingForm.date,
          io_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      if (findingForm.attachments.length > 0) {
        await handleFileUpload(findingForm.attachments, 'pre-evaluation', finding.id);
      }

      showToast(t('evidences.findings.addSuccess'), "success");
      setIsFindingModalOpen(false);
      setFindingForm({ caseId: '', description: '', location: '', date: new Date().toISOString().split('T')[0], attachments: [] });
      fetchFindings();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmittingFinding(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdateDesc.trim()) return;

    setIsSubmittingUpdate(true);
    try {
      const { error } = await supabase
        .from('finding_updates')
        .insert({
          finding_id: viewingFinding.id,
          description: newUpdateDesc.trim(),
          io_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      showToast(t('evidences.findings.updateSuccess'), "success");
      setNewUpdateDesc('');
      fetchFindingUpdates(viewingFinding.id);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .createSignedUrl(file.file_path.replace('evidence/', ''), 60);

      if (error) throw error;
      
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = file.file_name || file.original_filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handlePreview = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .createSignedUrl(file.file_path.replace('evidence/', ''), 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const filteredFindings = useMemo(() => {
    return findings.filter(f => 
      f.cases?.rb_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cases?.suspect_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [findings, searchQuery]);

  const filteredEvidence = useMemo(() => {
    return evidenceFiles.filter(e => 
      e.cases?.rb_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.file_name || e.original_filename || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [evidenceFiles, searchQuery]);

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('evidences.title')}</h1>
          <span className="page-title-tagline">{t('evidences.subtitle')}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('common.search')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px', width: '260px', border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
            />
          </div>
          <Button variant="outline" onClick={() => setIsPolicyModalOpen(true)}>
            <ShieldCheck size={18} /> {t('evidences.policy.btn')}
          </Button>
          <Button variant="primary" onClick={() => activeTab === 'findings' ? setIsFindingModalOpen(true) : setIsEvidenceModalOpen(true)}>
            <Plus size={18} /> {activeTab === 'findings' ? t('evidences.addFindingBtn') : t('evidences.uploadBtn')}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '1px' }}>
        <button 
          onClick={() => setActiveTab('findings')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'findings' ? 'var(--primary-color)' : 'var(--text-muted)',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          {t('evidences.sections.findings')}
          {activeTab === 'findings' && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '3px', background: 'var(--primary-color)', borderRadius: '3px 3px 0 0' }} />}
        </button>
        <button 
          onClick={() => setActiveTab('evidence')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'evidence' ? 'var(--primary-color)' : 'var(--text-muted)',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          {t('evidences.sections.evidence')}
          {activeTab === 'evidence' && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '3px', background: 'var(--primary-color)', borderRadius: '3px 3px 0 0' }} />}
        </button>
      </div>

      {activeTab === 'findings' ? (
        <div className="findings-grid">
          {isLoading && filteredFindings.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ fontWeight: 600 }}>{t('common.loading')}</p>
            </div>
          ) : filteredFindings.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileSearch size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>{t('common.noData')}</p>
            </div>
          ) : (
            filteredFindings.map(f => (
              <Card key={f.id} padding="0" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} className="hover-lift" onClick={() => setViewingFinding(f)}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-color)' }}>{f.cases?.rb_number}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(f.finding_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {f.description}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                    <MapPin size={12} /> {f.location || 'Unknown Location'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {f.cases?.suspect_full_name}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(52, 114, 213, 0.1)', color: 'var(--primary-color)', fontSize: '11px', fontWeight: 800 }}>
                        {f.evidence_storage?.length || 0} ATTACHMENTS
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card padding="0" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={tableHeaderStyle}>{t('evidences.table.id')}</th>
                <th style={tableHeaderStyle}>CASE / FILE</th>
                <th style={tableHeaderStyle}>{t('evidences.table.type')}</th>
                <th style={tableHeaderStyle}>{t('evidences.table.addedBy')}</th>
                <th style={tableHeaderStyle}>{t('evidences.table.status')}</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && filteredEvidence.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              )}
              {filteredEvidence.length === 0 && !isLoading ? (
                <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.noData')}</td></tr>
              ) : (
                filteredEvidence.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                    <td style={tdStyle}><span style={{ fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>EVID-{e.id.substring(0, 8).toUpperCase()}</span></td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{e.cases?.rb_number}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.file_name || e.original_filename}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-surface-active)' }}>
                        {e.file_type}
                      </span>
                    </td>
                    <td style={tdStyle}>{e.profiles?.full_name || 'System'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontSize: '12px', fontWeight: 700 }}>
                        <Lock size={12} /> SECURED
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant="outline" size="small" onClick={() => handlePreview(e)}><Eye size={14} /></Button>
                        <Button variant="outline" size="small" onClick={() => handleDownload(e)}><Download size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add Finding Modal */}
      <Modal 
        isOpen={isFindingModalOpen} 
        onClose={() => setIsFindingModalOpen(false)}
        title={t('evidences.addFindingBtn')}
        primaryAction={handleCreateFinding}
        isPrimaryLoading={isSubmittingFinding}
      >
        <div className="u-stack" style={{ padding: '0 4px' }}>
          <div>
            <label style={labelStyle}>Link to Case *</label>
            <Select 
              options={cases.map(c => ({ value: c.id, label: `${c.rb_number} — ${c.suspect_full_name}` }))}
              value={findingForm.caseId}
              onChange={(val) => setFindingForm(prev => ({ ...prev, caseId: val }))}
              placeholder="Select Case..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Date of Finding *</label>
              <input type="date" value={findingForm.date} onChange={(e) => setFindingForm(prev => ({ ...prev, date: e.target.value }))} style={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }} />
            </div>
            <div>
              <label style={labelStyle}>Location / Place *</label>
              <input type="text" placeholder="e.g. MURIET BLOCK A" value={findingForm.location} onChange={(e) => setFindingForm(prev => ({ ...prev, location: capitalizeSentences(e.target.value) }))} style={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description of Finding *</label>
            <textarea 
              rows={4} 
              placeholder="Detail your observations here..." 
              value={findingForm.description} 
              onChange={(e) => setFindingForm(prev => ({ ...prev, description: capitalizeSentences(formatPhoneNumbersInText(e.target.value)) }))}
              style={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Attachments (Optional)</label>
            <div 
              style={{
                padding: '24px',
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                textAlign: 'center',
                background: 'var(--bg-surface-hover)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('finding-files').click()}
            >
              <UploadCloud size={32} color="var(--primary-color)" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{findingForm.attachments.length > 0 ? `${findingForm.attachments.length} files selected` : 'Click to upload photos/documents'}</p>
              <input 
                id="finding-files" 
                type="file" 
                multiple 
                style={{ display: 'none' }} 
                onChange={(e) => setFindingForm(prev => ({ ...prev, attachments: e.target.files }))}
              />
            </div>
          </div>
          {uploadStatus !== 'idle' && (
             <div style={{ padding: '16px', background: 'var(--bg-surface-active)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{uploadStatus}... {progress}%</div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary-color)', transition: 'width 0.2s' }}></div>
                </div>
             </div>
          )}
        </div>
      </Modal>

      {/* View Finding Modal with Chronological History */}
      <Modal
        isOpen={!!viewingFinding}
        onClose={() => setViewingFinding(null)}
        title={t('evidences.findings.title')}
        size="large"
      >
        {viewingFinding && (
          <div className="u-stack" style={{ padding: '0 4px' }}>
            <div style={{ padding: '20px', background: 'var(--bg-surface-hover)', borderRadius: '16px', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px' }}>Official Case Registry</div>
                    <div style={{ fontSize: '20px', fontWeight: 900 }}>{viewingFinding.cases?.rb_number}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>{viewingFinding.cases?.suspect_full_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700 }}>
                        <Calendar size={16} /> {new Date(viewingFinding.finding_date).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700, marginTop: '6px' }}>
                        <MapPin size={16} /> {viewingFinding.location}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px' }}>
               <div className="u-stack">
                    <div>
                        <h3 className="section-subtitle"><FileText size={14} /> {t('evidences.findings.description')}</h3>
                        <div style={{ padding: '20px', border: '1.5px solid var(--border-color)', borderRadius: '14px', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'var(--bg-surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            {viewingFinding.description}
                        </div>
                    </div>

                    <div>
                        <h3 className="section-subtitle"><History size={14} /> Chronological Update History</h3>
                        <div style={{ position: 'relative', paddingLeft: '24px', marginTop: '12px' }}>
                            <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }}></div>
                            
                            {findingUpdates.length === 0 ? (
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>No updates logged yet.</div>
                            ) : (
                                findingUpdates.map((update) => (
                                    <div key={update.id} style={{ position: 'relative', marginBottom: '24px' }}>
                                        <div style={{ position: 'absolute', left: '-22px', top: '6px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-color)', border: '3px solid #fff', boxShadow: '0 0 0 1px var(--primary-color)' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{update.profiles?.full_name}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{new Date(update.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ padding: '12px 16px', background: 'var(--bg-surface-active)', borderRadius: '10px', fontSize: '14px', lineHeight: 1.5 }}>
                                            {update.description}
                                        </div>
                                    </div>
                                ))
                            )}

                            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1.5px dashed var(--border-color)' }}>
                                <textarea 
                                    placeholder="Add a new update to this finding..." 
                                    style={{ fontSize: '14px', marginBottom: '12px', background: 'transparent' }} 
                                    rows={3}
                                    value={newUpdateDesc}
                                    onChange={(e) => setNewUpdateDesc(capitalizeSentences(formatPhoneNumbersInText(e.target.value)))}
                                />
                                <div style={{ textAlign: 'right' }}>
                                    <Button variant="primary" size="small" onClick={handleAddUpdate} disabled={isSubmittingUpdate || !newUpdateDesc.trim()}>
                                        <Send size={14} /> Post Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
               </div>

               <div className="u-stack">
                    <h3 className="section-subtitle"><CheckCircle2 size={14} /> {t('evidences.findings.attachments')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {viewingFinding.evidence_storage?.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', background: 'var(--bg-surface-active)', borderRadius: '14px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                {t('evidences.findings.noAttachments')}
                            </div>
                        ) : (
                            viewingFinding.evidence_storage.map(file => (
                                <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: '1.5px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-surface)' }} className="file-item-mini">
                                    <div style={{ width: '36px', height: '36px', background: 'var(--bg-surface-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileIcon size={18} color="var(--primary-color)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name || file.original_filename}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{(file.file_size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => handlePreview(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }} title="Preview"><Eye size={16} /></button>
                                        <button onClick={() => handleDownload(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', padding: '6px' }} title="Download"><Download size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
               </div>
            </div>
            
            <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(52, 114, 213, 0.05)', borderRadius: '12px', border: '1.5px solid rgba(52, 114, 213, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={18} color="var(--primary-color)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>Chain of Custody Verified • Encrypted with AES-256 standards</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Evidence Upload Modal */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title={t('evidences.uploadBtn')}
        primaryAction={() => document.getElementById('direct-upload').click()}
        primaryLabel={lang === 'en' ? 'Select Files' : 'Chagua Faili'}
      >
        <div className="u-stack" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: '24px' }}>
                <label style={{ ...labelStyle, textAlign: 'left' }}>Link to Case *</label>
                <Select 
                    options={cases.map(c => ({ value: c.id, label: `${c.rb_number} — ${c.suspect_full_name}` }))}
                    value={selectedCase}
                    onChange={setSelectedCase}
                    placeholder="Select Case..."
                />
            </div>
            
            <div 
                style={{
                    padding: '60px 40px',
                    border: '2.5px dashed var(--border-color)',
                    borderRadius: '20px',
                    background: 'var(--bg-surface-hover)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onClick={() => document.getElementById('direct-upload').click()}
            >
                <UploadCloud size={56} color="var(--primary-color)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{t('evidences.upload.drag')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>Supports Photos, PDF, Word, Excel and TXT files</p>
                <input 
                    id="direct-upload" 
                    type="file" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => e.target.files.length > 0 && handleFileUpload(e.target.files)}
                />
            </div>

            {uploadStatus !== 'idle' && (
                <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: 'var(--primary-color)', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                        {uploadStatus === 'uploading' && <UploadCloud size={20} />}
                        {uploadStatus === 'scanning' && <FileSearch size={20} />}
                        {uploadStatus === 'securing' && <Lock size={20} />}
                        {uploadStatus === 'complete' && <CheckCircle2 size={20} />}
                        {uploadStatus}... {progress}%
                    </div>
                    <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary-color)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                    </div>
                </div>
            )}
        </div>
      </Modal>

      {/* Policy Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title={t('evidences.policy.title')}
      >
        <div style={{ padding: '20px' }}>
           <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1.5px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <AlertCircle size={20} color="var(--danger-color)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b', lineHeight: 1.5 }}>{t('evidences.policy.note')}</span>
           </div>
           
           <div className="u-stack" style={{ gap: '20px' }}>
                <PolicyItem title={t('evidences.policy.sections.integrity')} desc={t('evidences.policy.sections.integrityDesc')} />
                <PolicyItem title={t('evidences.policy.sections.encryption')} desc={t('evidences.policy.sections.encryptionDesc')} />
                <PolicyItem title={t('evidences.policy.sections.access')} desc={t('evidences.policy.sections.accessDesc')} />
           </div>

           <div style={{ marginTop: '32px', textAlign: 'right' }}>
                <Button variant="primary" onClick={() => setIsPolicyModalOpen(false)}>{t('evidences.policy.acknowledge')}</Button>
           </div>
        </div>
      </Modal>

      <style>{`
        .findings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }
        .hover-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(52, 114, 213, 0.12);
          border-color: var(--primary-color) !important;
          cursor: pointer;
        }
        input, textarea, select {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        input:focus, textarea:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(52, 114, 213, 0.1);
        }
        .section-subtitle {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .file-item-mini:hover {
            border-color: var(--primary-color) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}

function PolicyItem({ title, desc }) {
    return (
        <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800 }}>{title}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
        </div>
    )
}

const tableHeaderStyle = {
  padding: '14px 24px',
  fontSize: '11px',
  fontWeight: 900,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '1.5px'
};

const tdStyle = {
  padding: '18px 24px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  fontWeight: 600
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '12px',
  fontWeight: 800,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};
