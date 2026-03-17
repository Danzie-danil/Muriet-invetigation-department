import { useState } from 'react';
import Button from '../ui/Button';
import { User, FileText, Shield, Search, Microscope, Scale } from 'lucide-react';
import SAScrutinyView from './SAScrutinyView';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function CaseDetailsView({ caseData, onBack }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('bio');
  
  const isFrozen = caseData?.status === 'Forwarded to State Attorney' || caseData?.status === 'Sanctioned';

  const tabs = [
    { id: 'bio', label: t('cases.details.tabs.bio'), icon: User },
    { id: 'reporting', label: t('cases.details.tabs.reporting'), icon: FileText },
    { id: 'investigation', label: t('cases.details.tabs.investigation'), icon: Search },
    { id: 'witnesses', label: t('cases.details.tabs.witnesses'), icon: Shield },
    { id: 'forensics', label: t('cases.details.tabs.forensics'), icon: Microscope },
    { id: 'legal', label: t('cases.details.tabs.legal'), icon: Scale },
  ];

  return (
    <div className="u-stack">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="secondary" onClick={onBack}>← {t('cases.details.back')}</Button>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>{caseData?.rb_number || 'MURIET/RB/0101/2026'}</h2>
        </div>
        {isFrozen && (
          <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', padding: '6px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
             <AlertCircle size={16} /> {t('cases.details.frozen')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--gutter-m)' }}>
        {activeTab === 'bio' && (
          <Card className="u-stack">
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{t('cases.modal.sections.bioData')}</h3>
            <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('cases.modal.fields.fullName')}</label>
                <div style={{ fontWeight: 500 }}>{caseData?.suspect_full_name}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('cases.modal.fields.nida')}</label>
                <div style={{ fontWeight: 500 }}>{caseData?.suspect_national_id}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('cases.modal.fields.dob')}</label>
                <div style={{ fontWeight: 500 }}>1992-05-14</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('cases.modal.fields.occupation')}</label>
                <div style={{ fontWeight: 500 }}>Unemployed</div>
              </div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{t('cases.modal.sections.accomplice')}</h3>
            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{t('cases.details.noAccomplices')}</div>
          </Card>
        )}

        {activeTab === 'investigation' && (
          <div className="u-stack">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{t('cases.details.evidenceTitle')}</h3>
              {!isFrozen && <Button variant="outline" size="sm">+ {t('cases.details.logExhibit')}</Button>}
            </div>
            <Card padding="0">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-light)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>{t('cases.details.evidenceTable.desc')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>{t('cases.details.evidenceTable.location')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>{t('cases.details.evidenceTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontSize: '14px' }}>Homemade firearm (Gobore)</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>Suspect's residence</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                       <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{t('cases.details.evidenceVerified')}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'legal' && (
          <SAScrutinyView caseData={caseData} />
        )}

        {/* Other tabs would be implemented similarly */}
        {(activeTab === 'witnesses' || activeTab === 'reporting' || activeTab === 'forensics') && (
           <Card style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{t('cases.details.loading')}</div>
              <div className="spinner"></div>
           </Card>
        )}
      </div>
    </div>
  );
}
