import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Upload, Image as ImageIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonImage } from '../components/ui/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export default function PhotoAlbum() {
  const { t, lang } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cases, setCases] = useState([]);
  const [isFetchingCases, setIsFetchingCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (isModalOpen && cases.length === 0) {
      const fetchAllCases = async () => {
        setIsFetchingCases(true);
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('cases')
              .select('id, rb_number, suspect_full_name')
              .order('created_at', { ascending: false }),
            8000
          );
          if (error) throw error;
          setCases(data || []);
        } catch (err) {
          console.error('Error fetching cases:', err);
          setUploadError('Failed to load cases: ' + err.message);
        } finally {
          setIsFetchingCases(false);
        }
      };
      fetchAllCases();
    }
  }, [isModalOpen, cases.length]);

  const handleUpload = async () => {
    if (!selectedCaseId) {
      setUploadError(lang === 'en' ? 'Please select a case' : 'Tafadhali chagua kesi');
      return;
    }
    if (!photoFile) {
      setUploadError(lang === 'en' ? 'Please select a photo' : 'Tafadhali chagua picha');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `${selectedCaseId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('mugshots')
        .upload(filePath, photoFile, { contentType: photoFile.type, upsert: true });

      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from('evidence_storage').insert({
        case_id: selectedCaseId,
        file_path: filePath,
        original_filename: photoFile.name,
        file_type: 'mugshot',
        file_size: photoFile.size,
        uploaded_by: user?.id || null,
      });

      if (dbErr) throw dbErr;

      // Success
      setIsModalOpen(false);
      setPhotoFile(null);
      setSelectedCaseId('');
      fetchPhotos(); // Refresh album
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchPhotos = useCallback(async (isBackground = false) => {
    // Only show loading spinner on the very first fetch or when we have no data
    const shouldShowSpinner = !isBackground && photos.length === 0;
    
    if (shouldShowSpinner) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('evidence_storage')
        .select('*, cases(rb_number, suspect_full_name)')
        .eq('file_type', 'mugshot')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate signed URLs for each mugshot
      const withUrls = await Promise.all(
        (data || []).map(async (item) => {
          const { data: urlData } = await supabase.storage
            .from('mugshots')
            .createSignedUrl(item.file_path, 3600); // 1hr expiry
          return { ...item, signedUrl: urlData?.signedUrl || null };
        })
      );

      setPhotos(withUrls);
    } catch (err) {
      console.error('Error fetching mugshots:', err);
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [photos.length]); // Re-memoize if data length changes to update spinner logic correctly

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('photos.title')}</h1>
          <span className="page-title-tagline">{t('photos.subtitle')}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> {lang === 'en' ? 'Add Photo' : 'Mugshot Mpya'}
          </Button>
        </div>
      </div>
      
      {isLoading && photos.length === 0 ? (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} padding="0">
              <SkeletonImage style={{ width: '100%', aspectRatio: '1/1', margin: 0 }} />
              <div style={{ padding: '12px 16px' }}>
                <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: '4px' }} />
              </div>
            </Card>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {t('photos.noPhotos')}
          </div>
        </Card>
      ) : (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {photos.map((photo) => (
            <Card key={photo.id} padding="0">
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: 'var(--bg-skeleton)', overflow: 'hidden', containerType: 'inline-size' }}>
                {photo.signedUrl ? (
                  <>
                    <img 
                      src={photo.signedUrl} 
                      alt={photo.cases?.suspect_full_name || 'Suspect'} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ 
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none', opacity: 0.15, transform: 'rotate(-45deg)',
                      fontSize: '8cqi', fontWeight: 900, color: 'black', whiteSpace: 'nowrap'
                    }}>
                      {t('common.confidential')}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px',
                      borderRadius: '4px', fontSize: '10px', fontWeight: 600
                    }}>
                      {new Date(photo.created_at).toISOString().split('T')[0]}
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {t('photos.unavailable')}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{photo.cases?.suspect_full_name || '—'}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{photo.cases?.rb_number || '—'}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Mugshot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUploadError('');
          setPhotoFile(null);
          setSelectedCaseId('');
        }}
        title={lang === 'en' ? 'Upload New Mugshot' : 'Pakia Mugshot Mpya'}
        primaryAction={handleUpload}
        primaryLabel={lang === 'en' ? 'Upload' : 'Pakia'}
        secondaryAction={() => setIsModalOpen(false)}
        secondaryLabel={t('common.cancel')}
        isPrimaryLoading={isUploading}
      >
        <div className="u-stack">
          {uploadError && (
            <div style={{ padding: '12px', background: 'var(--danger-color)', color: 'white', borderRadius: '8px', fontSize: '14px' }}>
              {uploadError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{lang === 'en' ? 'Select Case' : 'Chagua Kesi'} <span style={{color: 'var(--danger-color)'}}>*</span></label>
            <select 
              className="form-control"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
              disabled={isFetchingCases}
            >
              <option value="">
                {isFetchingCases 
                  ? (lang === 'en' ? 'Loading cases...' : 'Inapakia kesi...') 
                  : (lang === 'en' ? '-- Select a case --' : '-- Chagua kesi --')}
              </option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.rb_number} - {c.suspect_full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'en' ? 'Photo / Mugshot' : 'Picha / Mugshot'} <span style={{color: 'var(--danger-color)'}}>*</span></label>
            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                background: 'var(--bg-surface-hover)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {photoFile ? (
                <div>
                  <ImageIcon size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>{photoFile.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{(photoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>{lang === 'en' ? 'Click to browse folder' : 'Bonyeza kuchagua picha'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>PNG, JPG up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPhotoFile(e.target.files[0]);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
