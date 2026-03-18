import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { db, syncTable } from '../db/db';
import { 
  UploadCloud,
  CheckCircle2,
  Lock,
  ShieldCheck,
  FileSearch,
  Plus, Search, ChevronLeft, ChevronRight, Save, Trash2, X, User, Phone, MapPin, Briefcase, FileText, Image as ImageIcon, RotateCw, Cloud, CloudUpload, History, Camera, Calendar } from 'lucide-react';
import CaseDetailsView from '../components/cases/CaseDetailsView';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { formatPhoneNumbersInText, capitalizeSentences, withTimeout, compressImage } from '../lib/utils';
export default function CasesModule() {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [suspectPhoto, setSuspectPhoto] = useState(null);       // { file, preview }
  const itemsPerPage = 8;

  // Form State based on police amendment text.txt
  const createAccompliceObject = () => ({
    fullName: '',
    phone: '',
    countryOfBirth: 'TANZANIA',
    cityOfBirth: '',
    streetOfBirth: '',
    countryOfResidence: 'TANZANIA',
    cityOfResidence: '',
    streetOfResidence: '',
    occupation: '',
    nida: ''
  });

  // Form State based on police amendment text.txt
  const initialFormState = {
    // Case Overview
    rbNumber: '',
    title: '',
    caseType: 'Criminal Cases',
    dateOfCrime: '',
    dateOfReporting: new Date().toISOString().split('T')[0],
    // Pre-evaluation Data
    sourceOfInfo: '',
    incidentLocation: '',
    findings: '',
    actionsTakenBefore: '', // who, where, why
    // Suspect Bio Data
    suspectFullName: '',
    suspectDOB: '',
    suspectCountryOfBirth: 'TANZANIA',
    suspectCityOfBirth: '',
    suspectStreetOfBirth: '',
    suspectCountryOfResidence: 'TANZANIA',
    suspectCityOfResidence: '',
    suspectStreetOfResidence: '',
    suspectPhone: '',
    suspectOccupation: '',
    suspectNIDA: '',
    // Accomplice Data
    hasAccomplice: false,
    accomplices: [createAccompliceObject()]
  };

  const [newCaseForm, setNewCaseForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState('idle');
  const [cloudDrafts, setCloudDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [modalView, setModalView] = useState('form'); // 'form' or 'drafts_list'
  const [preEvaluationAttachments, setPreEvaluationAttachments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, scanning, securing, complete
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bannerCountdown, setBannerCountdown] = useState(0);
  const [draftToDeleteId, setDraftToDeleteId] = useState(null);
  const [hasDismissedDraftBanner, setHasDismissedDraftBanner] = useState(false);

  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const isFirstFetch = useRef(true);
  const retryTimer = useRef(null);

  // --- Supabase Data Loading ---

  const fetchCases = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('cases')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false }),
        8000
      );
      if (error) throw error;
      setCases(data || []);
      // Sync to local DB for next load
      if (data) await syncTable('cases', data);
    } catch (err) {
      console.error('Error fetching cases:', err.message);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Initial Load from Local DB (SWR Immediate)
  useEffect(() => {
    const loadFromLocal = async () => {
      try {
        const localCases = await db.cases.toArray();
        if (localCases.length > 0) {
          setCases(localCases);
          setIsLoading(false); // We have data, can hide initial spinner
        }
      } catch (err) {
        console.warn('[DB] Failed to load local cases:', err);
      }
    };
    loadFromLocal();
    fetchCases();
  }, [fetchCases]);

  // 2. Setup Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('cases-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
        fetchCases(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchCases]);

  const handleViewCase = async (c) => {
    try {
      const { data: accoms } = await supabase.from('accomplices').select('*').eq('case_id', c.id);
      if (accoms) await syncTable('accomplices', accoms);

      // Check local cache for mugshot first
      const cachedMugshot = await db.mugshots.get(c.id);
      let mugshotUrl = null;

      if (cachedMugshot?.blob) {
        mugshotUrl = URL.createObjectURL(cachedMugshot.blob);
      } else {
        // Fetch latest mugshot metadata
        const { data: mugshotData } = await supabase
          .from('case_mugshots')
          .select('id, file_path')
          .eq('case_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (mugshotData?.file_path) {
          // Get the actual file blob
          const { data: blob, error: dlErr } = await supabase.storage
            .from('mugshots')
            .download(mugshotData.file_path);
          
          if (!dlErr && blob) {
            mugshotUrl = URL.createObjectURL(blob);
            // Cache the blob locally
            await db.mugshots.put({
              id: c.id, // Use case_id as key for easy lookup
              case_id: c.id,
              file_path: mugshotData.file_path,
              blob: blob,
              created_at: new Date()
            });
          }
        }
      }

      setSelectedCase({ ...c, accomplices: accoms || [], mugshotUrl }); 
      setIsViewModalOpen(true);
      
      // Log the view action for audit purposes
      if (user) {
        await supabase.from('system_logs').insert({
          user_id: user.id,
          action: 'VIEW_CASE',
          table_name: 'cases',
          record_id: c.id,
          details: { rb_number: c.rb_number, title: c.title }
        });
      }
    } catch (err) {
      console.error('Error handling case view:', err);
    }
  };

  // Handle URL deep-linking
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const createMode = searchParams.get('create');
    const viewId = searchParams.get('view');

    if (createMode === 'true') {
      setIsModalOpen(true);
      navigate('/cases', { replace: true });
    } else if (viewId) {
      const foundCase = cases.find(c => c.id === viewId);
      if (foundCase) {
        handleViewCase(foundCase);
        navigate('/cases', { replace: true });
      } else if (cases.length > 0) {
        const fetchAndShow = async () => {
          try {
            const { data, error } = await supabase.from('cases').select('*, profiles(full_name)').eq('id', viewId).single();
            if (data && !error) {
              handleViewCase(data);
            }
          } catch (err) {
            console.error('Error fetching deep-linked case:', err);
          } finally {
            navigate('/cases', { replace: true });
          }
        };
        fetchAndShow();
      }
    }
  }, [location.search, navigate, cases, handleViewCase]);

  // Fetch next RB number when opening the modal
  useEffect(() => {
    if (isModalOpen && !newCaseForm.rbNumber) {
      const fetchNextRB = async () => {
        try {
          const { data, error } = await supabase.rpc('get_next_rb_number');
          if (error) throw error;
          if (data) {
            setNewCaseForm(prev => ({ ...prev, rbNumber: data }));
          }
        } catch (err) {
          console.error('Error fetching next RB number:', err);
        }
      };
      fetchNextRB();
    }
  }, [isModalOpen, newCaseForm.rbNumber]);
  // Automatic draft check when modal opens
  // Helper to check if the form is effectively empty (only prefilled/default data)
  const isFormMeaningfullyEmpty = useCallback((formData) => {
    if (!formData) return true;
    const fieldsToCheck = [
      'title', 'dateOfCrime', 'sourceOfInfo', 'incidentLocation', 'findings', 
      'actionsTakenBefore', 'suspectFullName', 'suspectDOB', 'suspectCityOfBirth', 
      'suspectStreetOfBirth', 'suspectCityOfResidence', 'suspectStreetOfResidence', 
      'suspectPhone', 'suspectOccupation', 'suspectNIDA'
    ];
    
    // 1. Check main fields for non-default values
    for (const field of fieldsToCheck) {
      const val = formData[field];
      // +255- is the default prefix for phone numbers, treat it as empty
      if (val && val.trim() !== '' && val !== '+255-') return false;
    }
    
    // 2. Check if hasAccomplice was toggled
    if (formData.hasAccomplice) return false;
    
    // 3. Check accomplices for any data
    if (formData.accomplices && formData.accomplices.length > 0) {
      for (const acc of formData.accomplices) {
        const accFields = [
          'fullName', 'phone', 'cityOfBirth', 'streetOfBirth', 
          'cityOfResidence', 'streetOfResidence', 'occupation', 'nida'
        ];
        for (const f of accFields) {
          const val = acc[f];
          if (val && val.trim() !== '' && val !== '+255-') return false;
        }
      }
    }
    
    // 4. Check for uploaded attachments (only relevant for current session)
    if (formData === newCaseForm) {
      if (preEvaluationAttachments.length > 0) return false;
      if (suspectPhoto) return false;
    }

    return true;
  }, [newCaseForm, preEvaluationAttachments.length, suspectPhoto]);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('case_drafts')
        .select('id, form_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const validDrafts = data.filter(d => {
          // Filter by time (e.g. 7 days)
          const draftDate = new Date(d.updated_at);
          const now = new Date();
          const isRecentlySaved = (now - draftDate) < 1000 * 60 * 60 * 24 * 7;
          
          // Filter out drafts that are effectively empty OR is the same as the active one
          return isRecentlySaved && d.id !== activeDraftId && !isFormMeaningfullyEmpty(d.form_data);
        });
        setCloudDrafts(validDrafts);
        // Only initialize the countdown if we have drafts and it's not already running/dismissed
        if (validDrafts.length > 0 && modalView === 'form' && !hasDismissedDraftBanner && bannerCountdown === 0) {
          setBannerCountdown(10);
        }
      } else {
        setCloudDrafts([]);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    }
  }, [user, isFormMeaningfullyEmpty, modalView]);

  useEffect(() => {
    if (isModalOpen) {
      // Only fetch drafts once when opening the modal, to avoid a rerender loop while typing
      const timer = setTimeout(() => {
        fetchDrafts();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCloudDrafts([]);
      setModalView('form');
      setHasDismissedDraftBanner(false);
      setBannerCountdown(0);
    }
  }, [isModalOpen]); // Removed fetchDrafts dependency to prevent loop while typing

  // Draft Banner Countdown Logic
  useEffect(() => {
    let timer;
    if (isModalOpen && cloudDrafts.length > 0 && modalView === "form" && bannerCountdown > 0 && !hasDismissedDraftBanner) {
      timer = setInterval(() => {
        setBannerCountdown(prev => prev - 1);
      }, 1000);
    } else if (bannerCountdown === 0 && modalView === "form" && cloudDrafts.length > 0) {
      setHasDismissedDraftBanner(true);
      setCloudDrafts([]);
    }
    return () => clearInterval(timer);
  }, [isModalOpen, cloudDrafts.length, modalView, bannerCountdown, hasDismissedDraftBanner]);

  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      await fetchCases();
      showToast(t('cases.syncSuccess'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };


  // Debounced effect to save draft to Cloud (Supabase)
  useEffect(() => {
    if (!isModalOpen || modalView === 'drafts_list') return;

    const timer = setTimeout(async () => {
      if (isFormMeaningfullyEmpty(newCaseForm)) {
        if (activeDraftId) {
          // If the form became empty but we had an active draft, remove it from cloud
          try {
            await supabase.from('case_drafts').delete().eq('id', activeDraftId);
            setActiveDraftId(null);
          } catch (e) {
            console.error('Error removing empty draft:', e);
          }
        }
        setAutosaveStatus('idle');
        return;
      }

      setAutosaveStatus('saving');
      try {
        if (!user) return;

        const payload = {
          user_id: user.id,
          form_data: newCaseForm,
          updated_at: new Date().toISOString()
        };

        let error;
        if (activeDraftId) {
          const { error: updateErr } = await supabase
            .from('case_drafts')
            .update(payload)
            .eq('id', activeDraftId);
          error = updateErr;
        } else {
          const { data: insertData, error: insertErr } = await supabase
            .from('case_drafts')
            .insert(payload)
            .select('id')
            .single();
          error = insertErr;
          if (insertData?.id) setActiveDraftId(insertData.id);
        }

        if (error) throw error;
        setAutosaveStatus('saved');
      } catch (err) {
        console.error('Cloud draft save error:', err);
        setAutosaveStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [newCaseForm, isModalOpen, activeDraftId, modalView]);
  const handleRestoreDraft = async () => {
    if (!user) return;
    setIsRestoringDraft(true);
    try {
      const { data, error } = await supabase
        .from('case_drafts')
        .select('id, form_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Filter drafts older than 1 week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const validDrafts = data.filter(d => new Date(d.updated_at) > oneWeekAgo);

        if (validDrafts.length === 0) {
          showToast(lang === 'en' ? 'No recent drafts found' : 'Hakuna rasimu za karibuni zilizopatikana', 'error');
          return;
        }

        if (validDrafts.length === 1) {
          // Convenience: If only one draft, restore it directly
          const draft = validDrafts[0];
          const restoredData = { ...draft.form_data };
          if (!restoredData.accomplices) restoredData.accomplices = [createAccompliceObject()];
          setNewCaseForm(restoredData);
          setActiveDraftId(draft.id);
          setIsModalOpen(true);
          setModalView('form');
          showToast(t('cases.draftRestored'), 'success');
        } else {
          // Multiple drafts: Open modal directly to the list view
          setCloudDrafts(validDrafts);
          setIsModalOpen(true);
          setModalView('drafts_list');
        }
      } else {
        showToast(lang === 'en' ? 'No draft found' : 'Hakuna rasimu iliyopatikana kwenye Mfumo', 'error');
      }
    } catch (err) {
      console.error('Draft restore error:', err);
      showToast(err.message, 'error');
    } finally {
      setIsRestoringDraft(false);
    }
  };

  const triggerDeleteDraft = (e, draftId) => {
    e.stopPropagation();
    setDraftToDeleteId(prev => prev === draftId ? null : draftId);
  };

  const confirmDeleteDraft = async (e) => {
    if (e) e.stopPropagation();
    if (!draftToDeleteId) return;
    
    try {
      const { error } = await supabase
        .from('case_drafts')
        .delete()
        .eq('id', draftToDeleteId);
        
      if (error) throw error;
      
      // Update local state
      setCloudDrafts(prev => {
        const updated = prev.filter(d => d.id !== draftToDeleteId);
        if (updated.length === 0) setModalView('form');
        return updated;
      });

      if (activeDraftId === draftToDeleteId) {
        setActiveDraftId(null);
        setNewCaseForm(initialFormState);
      }
      
      showToast(lang === 'en' ? 'Draft deleted successfully' : 'Rasimu imefutwa kwa mafanikio', 'success');
    } catch (err) {
      console.error('Error deleting draft:', err);
      showToast(err.message, 'error');
    } finally {
      setDraftToDeleteId(null);
    }
  };

  // --- Input Handlers ---

  const handleInputChange = (field, value) => {
    setAutosaveStatus('saving');
    // Auto-format phone numbers and capitalize sentences
    const formattedValue = capitalizeSentences(formatPhoneNumbersInText(value));
    setNewCaseForm(prev => ({ ...prev, [field]: formattedValue }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNameInput = (field, value) => {
    setAutosaveStatus('saving');
    const formattedValue = value.toUpperCase();
    if (/[0-9]/.test(formattedValue)) {
      setFormErrors(prev => ({ ...prev, [field]: lang === 'en' ? 'Only letters are allowed' : 'Herufi pekee zinaruhusiwa' }));
      const sanitized = formattedValue.replace(/[0-9]/g, '');
      setNewCaseForm(prev => ({ ...prev, [field]: sanitized }));
    } else {
      setNewCaseForm(prev => ({ ...prev, [field]: formattedValue }));
    }
  };

  const handlePhoneInput = (field, value) => {
    setAutosaveStatus('saving');
    
    // Auto-expand '0' to '+255-'
    if (value === '0') {
      setNewCaseForm(prev => ({ ...prev, [field]: '+255-' }));
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
    
    setNewCaseForm(prev => ({ ...prev, [field]: formatted.substring(0, 16) }));
  };

  const handleNidaInput = (field, value) => {
    setAutosaveStatus('saving');
    // Replicating reference logic: XXXXXXXX-XXXXX-XXXXX-XX
    let numbers = value.replace(/\D/g, '').substring(0, 20);
    let formatted = '';
    for (let i = 0; i < numbers.length; i++) {
      if (i === 8 || i === 13 || i === 18) formatted += '-';
      formatted += numbers[i];
    }
    setNewCaseForm(prev => ({ ...prev, [field]: formatted }));
  };

  const handleAccompliceChange = (index, field, value) => {
    setAutosaveStatus('saving');
    const updatedAccomplices = [...newCaseForm.accomplices];
    
    let finalValue = value;
    if (field === 'phone') {
      if (value === '0') {
        finalValue = '+255-';
      } else {
        let numbers = value.replace(/[^\d]/g, '');
        if (numbers.startsWith('255')) numbers = numbers.substring(3);
        if (numbers.startsWith('0')) numbers = numbers.substring(1);
        
        let formatted = '';
        if (numbers.length > 0) {
          formatted = '+255-';
          const groups = numbers.match(/.{1,3}/g) || [];
          formatted += groups.slice(0, 3).join('-');
          finalValue = formatted.substring(0, 16);
        } else {
          finalValue = '';
        }
      }
    } else {
      finalValue = capitalizeSentences(formatPhoneNumbersInText(value));
    }

    updatedAccomplices[index] = { ...updatedAccomplices[index], [field]: finalValue };
    setNewCaseForm(prev => ({ ...prev, accomplices: updatedAccomplices }));
  };

  const addAccomplice = () => {
    setNewCaseForm(prev => ({ 
      ...prev, 
      accomplices: [...prev.accomplices, createAccompliceObject()] 
    }));
  };

  const removeAccomplice = (index) => {
    if (newCaseForm.accomplices.length <= 1) return;
    const updatedAccomplices = newCaseForm.accomplices.filter((_, i) => i !== index);
    setNewCaseForm(prev => ({ ...prev, accomplices: updatedAccomplices }));
  };

  const deleteCloudDraft = async () => {
    if (!activeDraftId) return;
    try {
      const { error } = await supabase
        .from('case_drafts')
        .delete()
        .eq('id', activeDraftId);
      if (error) throw error;
      setActiveDraftId(null);
    } catch (err) {
      console.error('Failed to delete cloud draft:', err);
    }
  };

  const resetForm = () => {
    setNewCaseForm(initialFormState);
    setFormErrors({});
    setPreEvaluationAttachments([]);
    setUploadStatus('idle');
    setUploadProgress(0);
    deleteCloudDraft();
  };

  const handleSave = () => {
    const requiredFields = [
      { key: 'title', label: t('cases.modal.fields.title') },
      { key: 'suspectFullName', label: `${t('cases.modal.sections.bioData')} - ${t('cases.modal.fields.fullName')}` },
      { key: 'dateOfCrime', label: t('cases.modal.fields.date') },
      { key: 'dateOfReporting', label: t('cases.modal.fields.reportingDate') },
      { key: 'rbNumber', label: t('cases.modal.fields.rbNum') },
      { key: 'incidentLocation', label: t('cases.modal.fields.location') }
    ];

    const errors = {};
    const missingLabels = [];

    requiredFields.forEach(f => {
      if (!newCaseForm[f.key]) {
        errors[f.key] = t('common.required');
        missingLabels.push(f.label);
      }
    });

    if (newCaseForm.hasAccomplice) {
      newCaseForm.accomplices.forEach((acc, idx) => {
        const accPrefix = `${t('cases.modal.fields.accompliceLabel')} #${idx + 1}`;
        if (!acc.fullName) {
          errors[`accomplice_${idx}_fullName`] = t('common.required');
          missingLabels.push(`${accPrefix}: ${t('cases.modal.fields.fullName')}`);
        }
        if (!acc.phone) {
          errors[`accomplice_${idx}_phone`] = t('common.required');
          missingLabels.push(`${accPrefix}: ${t('cases.modal.fields.phone')}`);
        }
        if (!acc.nida) {
          errors[`accomplice_${idx}_nida`] = t('common.required');
          missingLabels.push(`${accPrefix}: ${t('cases.modal.fields.nida')}`);
        }
        if (!acc.cityOfResidence) {
          errors[`accomplice_${idx}_cityOfResidence`] = t('common.required');
          missingLabels.push(`${accPrefix}: ${t('cases.modal.fields.city')}`);
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const header = lang === 'en' ? 'Missing Required Fields:' : 'Sehemu zinazohitajika zimepungua:';
      const detailMessage = `${header}\n• ${missingLabels.join('\n• ')}`;
      showToast(detailMessage, 'error', 5000);
      return;
    }

    setIsSubmitting(true);

    // Simulate biometric fingerprint scan animation
    setIsScanningFingerprint(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(async () => {
          setIsScanningFingerprint(false);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const suspectPob = [newCaseForm.suspectStreetOfBirth, newCaseForm.suspectCityOfBirth, newCaseForm.suspectCountryOfBirth].filter(Boolean).join(', ');
            const suspectResidence = [newCaseForm.suspectStreetOfResidence, newCaseForm.suspectCityOfResidence, newCaseForm.suspectCountryOfResidence].filter(Boolean).join(', ');

            const casePayload = {
              title: newCaseForm.title,
              incident_info: newCaseForm.sourceOfInfo,
              incident_location: newCaseForm.incidentLocation,
              initial_findings: newCaseForm.findings,
              prior_actions_taken: newCaseForm.actionsTakenBefore,
              date_of_crime: newCaseForm.dateOfCrime,
              date_of_reporting: newCaseForm.dateOfReporting,
              suspect_full_name: newCaseForm.suspectFullName,
              suspect_dob: newCaseForm.suspectDOB || null,
              suspect_pob: suspectPob,
              suspect_residence: suspectResidence,
              suspect_phone: newCaseForm.suspectPhone,
              suspect_occupation: newCaseForm.suspectOccupation,
              suspect_national_id: newCaseForm.suspectNIDA,
              rb_number: newCaseForm.rbNumber,
              year: parseInt(newCaseForm.rbNumber.split('/').pop()) || new Date().getFullYear(),
              io_id: user?.id || null,
              status: 'Under Investigation',
            };

            const { data: newCaseData, error: caseError } = await supabase
              .from('cases')
              .insert(casePayload)
              .select()
              .single();

            if (caseError) throw caseError;

            // If there's accomplices, insert them
            if (newCaseForm.hasAccomplice && newCaseData) {
              const accomplicesPayload = newCaseForm.accomplices.map(acc => ({
                case_id: newCaseData.id,
                full_name: acc.fullName,
                national_id: acc.nida,
                residence: [acc.streetOfResidence, acc.cityOfResidence, acc.countryOfResidence].filter(Boolean).join(', '),
                phone: acc.phone,
              }));
              await supabase.from('accomplices').insert(accomplicesPayload);
            }
            // 2. Upload suspect photo (Mugshot) to Supabase Storage
            if (suspectPhoto?.file && newCaseData) {
              const fileExt = suspectPhoto.file.name.split('.').pop();
              const fileName = `${Date.now()}.${fileExt}`;
              const filePath = `${newCaseData.id}/${fileName}`;
              
              console.log('[PHOTO DEBUG] Step 1: Compressing and uploading to mugshots bucket...', { filePath, fileName, fileSize: suspectPhoto.file.size, fileType: suspectPhoto.file.type });
              
              const compressedPhoto = await compressImage(suspectPhoto.file);

              const { error: uploadErr } = await supabase.storage
                .from('mugshots')
                .upload(filePath, compressedPhoto, { contentType: compressedPhoto.type, upsert: true });

              if (uploadErr) {
                console.error('[PHOTO DEBUG] Step 1 FAILED - Storage Upload Error:', uploadErr);
                showToast(`Photo storage failed: ${uploadErr.message}`, 'error', 8000);
              } else {
                console.log('[PHOTO DEBUG] Step 1 SUCCESS - File uploaded to mugshots bucket');
              }

              const dbPayload = {
                case_id: newCaseData.id,
                file_path: filePath,
                original_filename: suspectPhoto.file.name,
                file_size: compressedPhoto.size,
                uploaded_by: user?.id || null,
              };
              console.log('[PHOTO DEBUG] Step 2: Inserting into case_mugshots...', dbPayload);

              const { data: insertedRow, error: dbLinkErr } = await supabase
                .from('case_mugshots')
                .insert(dbPayload)
                .select();

              if (dbLinkErr) {
                console.error('[PHOTO DEBUG] Step 2 FAILED - DB Insert Error:', dbLinkErr);
                showToast(`Photo DB link failed: ${dbLinkErr.message}`, 'error', 8000);
              } else {
                console.log('[PHOTO DEBUG] Step 2 SUCCESS - Row inserted:', insertedRow);
              }
            } else {
              console.log('[PHOTO DEBUG] No photo attached or no case data. suspectPhoto:', !!suspectPhoto, 'newCaseData:', !!newCaseData);
            }

            // 3. Handle Pre-evaluation Finding and Attachments
            if (newCaseData) {
               const { data: findingData, error: findingError } = await supabase
                 .from('findings')
                 .insert({
                   case_id: newCaseData.id,
                   description: newCaseForm.actionsTakenBefore || "Initial Case Pre-evaluation",
                   location: newCaseForm.incidentLocation,
                   finding_date: new Date().toISOString().split('T')[0],
                   io_id: user?.id || null
                 })
                 .select()
                 .single();
               
               if (!findingError && preEvaluationAttachments.length > 0) {
                 setUploadStatus('uploading');
                 for (let i = 0; i < preEvaluationAttachments.length; i++) {
                   const file = preEvaluationAttachments[i];
                   
                   // UI Progress simulation
                   for (let p = 0; p <= 100; p += 25) {
                     setUploadProgress(p);
                     setUploadStatus(p < 30 ? 'uploading' : p < 60 ? 'scanning' : 'securing');
                     await new Promise(r => setTimeout(r, 100));
                   }

                   const isImage = file.type.startsWith('image/');
                   const targetBucket = isImage ? 'mugshots' : 'evidence';
                   const fileCategory = isImage ? 'mugshot' : 'pre-evaluation';

                   // Compress images before upload
                   const fileToUpload = isImage ? await compressImage(file) : file;

                   const fileExt = file.name.split('.').pop();
                   const fileName = `${Date.now()}_${i}.${fileExt}`;
                   const filePath = `${newCaseData.id}/${fileName}`;

                   const { error: uploadError } = await supabase.storage
                     .from(targetBucket)
                     .upload(filePath, fileToUpload);

                   if (uploadError) {
                     console.error('Attachment Upload Error:', uploadError);
                     throw new Error(`Attachment upload failed: ${uploadError.message}`);
                   }

                   // 3. Register in DB (Branch based on file type)
                   const dbPayload = {
                     case_id: newCaseData.id,
                     file_path: filePath,
                     original_filename: file.name,
                     file_size: fileToUpload.size,
                     uploaded_by: user?.id || null
                   };

                   const targetTable = isImage ? 'case_mugshots' : 'evidence_storage';
                   
                   // Add finding_id for general evidence, though mugshots focus on the suspect profile
                   const finalPayload = isImage ? dbPayload : { ...dbPayload, finding_id: findingData.id, file_type: 'pre-evaluation' };

                   console.log(`[ATTACH DEBUG] Registering to ${targetTable}...`, finalPayload);

                   const { error: dbLinkError } = await supabase.from(targetTable).insert(finalPayload);

                   if (dbLinkError) {
                     console.error(`[ATTACH DEBUG] ${targetTable} Error:`, dbLinkError);
                     throw new Error(`Failed to register attachment: ${dbLinkError.message}`);
                   }
                 }
                 setUploadStatus('complete');
                 await new Promise(r => setTimeout(r, 500));
               }
            }

            await fetchCases();
            resetForm();
            setSuspectPhoto(null);
            setIsModalOpen(false);
            showToast(lang === 'en' ? 'Case registered successfully' : 'Kesi imesajiliwa kwa mafanikio', 'success');

          } catch (err) {
            console.error('Case insert error:', err);
            showToast('Failed to save case: ' + err.message, 'error');
          } finally {
            setIsSubmitting(false);
          }
        }, 800);
      }
    }, 50);
  };


  // --- Filtering & Pagination ---

  const filteredCases = useMemo(() => {
    return cases.filter(c => 
      (c.incident_info || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.rb_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.suspect_full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cases, searchQuery]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage]);

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('cases.title')}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('cases.searchPlaceholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px', width: '260px' }}
            />
          </div>
          <Button variant="outline" onClick={handleCloudSync} isLoading={isSyncing}>
            <RotateCw size={18} className={isSyncing ? 'animate-spin' : ''} /> {t('cases.syncBtn')}
          </Button>
          <Button variant="outline" onClick={handleRestoreDraft} isLoading={isRestoringDraft}>
            <History size={18} /> {t('cases.draftsBtn')}
          </Button>
          <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={18} /> {t('cases.initBtn')}
          </Button>
        </div>
      </div>

      <Card padding="0" style={{ overflow: 'hidden' }}>
        <div className="desktop-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={tableHeaderStyle}>{t('cases.table.rb')}</th>
                <th style={tableHeaderStyle}>{t('cases.table.title')}</th>
                <th style={tableHeaderStyle}>{t('cases.table.suspect')}</th>
                <th style={tableHeaderStyle}>{t('cases.table.date')}</th>
                <th style={tableHeaderStyle}>{t('cases.table.investigator')}</th>
                <th style={tableHeaderStyle}>{t('cases.table.status')}</th>
                <th className="sticky-action" style={{ ...tableHeaderStyle, textAlign: 'right' }}>{t('cases.table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && paginatedCases.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading cases...</td></tr>
              )}
              {!isLoading && fetchError && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '8px' }}>{fetchError}</div>
                  <button onClick={fetchCases} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                </td></tr>
              )}
              {paginatedCases.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={tdStyle}>
                    <button 
                      onClick={() => handleViewCase(c)}
                      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>{c.rb_number}</span>
                    </button>
                  </td>
                  <td style={tdStyle}><span style={{ fontWeight: 500 }}>{c.title}</span></td>
                  <td style={tdStyle}>{c.suspect_full_name}</td>
                  <td style={tdStyle}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                  <td style={tdStyle}>{c.profiles?.full_name || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      background: c.status.includes('Forwarded') ? '#e9edf2' : '#fef3c7',
                      color: c.status.includes('Forwarded') ? 'var(--primary-color)' : '#d97706'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td className="sticky-action" style={{ ...tdStyle, textAlign: 'right' }}>
                    <Button 
                      variant="outline" 
                      size="small" 
                      onClick={() => handleViewCase(c)}
                    >
                      {t('common.view')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card-based transformation (< 768px) */}
        <div className="mobile-cards">
          {paginatedCases.map((c) => (
            <div key={c.id} className="case-card">
              <div className="case-card-header">
                <div>
                   <span className="case-card-rb">{c.rb_number}</span>
                   <h3 className="case-card-title">{c.title}</h3>
                </div>
                <span style={{ 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  background: c.status.includes('Forwarded') ? '#e9edf2' : '#fef3c7',
                  color: c.status.includes('Forwarded') ? 'var(--primary-color)' : '#d97706'
                }}>
                  {c.status}
                </span>
              </div>
              <div className="case-card-meta">
                <User size={12} /> {c.suspect_full_name}
              </div>
              <div className="case-card-meta" style={{ marginTop: '2px' }}>
                <Calendar size={12} /> {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
              </div>
              <div className="case-card-action">
                <Button 
                   className="case-card-view-btn"
                   variant="outline"
                   onClick={() => handleViewCase(c)}
                >
                  {t('common.view')}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {!isLoading && filteredCases.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FolderSearch size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>{t('common.noData')}</p>
          </div>
        )}

        <div className="table-footer">
          <div className="pagination-info">
            {t('cases.footer.showing')} {(currentPage - 1) * itemsPerPage + 1} {t('cases.footer.to')} {Math.min(currentPage * itemsPerPage, filteredCases.length)} {t('cases.footer.of')} {filteredCases.length} {t('cases.footer.entries')}
          </div>
          <nav className="pagination">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              {t('cases.footer.prev')}
            </button>
            
            {(() => {
              const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
              const pages = [];
              if (totalPages <= 0) return null;
              for (let i = 1; i <= totalPages; i++) {
                if (
                  i === 1 || 
                  i === totalPages || 
                  (i >= currentPage - 1 && i <= currentPage + 1)
                ) {
                  pages.push(
                    <button 
                      key={i}
                      className={currentPage === i ? 'active' : ''}
                      onClick={() => setCurrentPage(i)}
                    >
                      {i}
                    </button>
                  );
                } else if (i === 2 || i === totalPages - 1) {
                  pages.push(<span key={i}>...</span>);
                }
              }
              // Deduplicate dots
              return pages.filter((curr, i, arr) => {
                if (curr.type === 'span' && arr[i-1]?.type === 'span') return false;
                return true;
              });
            })()}

            <button 
              disabled={currentPage === Math.max(1, Math.ceil(filteredCases.length / itemsPerPage))} 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCases.length / itemsPerPage), prev + 1))}
            >
              {t('cases.footer.next')}
            </button>
          </nav>
        </div>
      </Card>

      {/* Initialize Case Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={(t) => t('cases.modal.initTitle')}
        primaryAction={handleSave}
        primaryLabel={(t) => t('common.save')}
        secondaryAction={() => setIsModalOpen(false)}
        secondaryLabel={(t) => t('common.cancel')}
        isPrimaryLoading={isSubmitting}
        footerContent={(t, lang) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              background: autosaveStatus === 'saved' ? 'var(--success-color)' : 'var(--bg-skeleton)',
              boxShadow: autosaveStatus === 'saved' ? '0 0 8px var(--success-color)' : 'none'
            }}></div>
            <span style={{ marginRight: '8px' }}>
              {isFormMeaningfullyEmpty(newCaseForm) ? 
                (lang === 'en' ? 'Waiting for your input...' : 'Inasubiri maelezo...') : 
                (autosaveStatus === 'saved' ? (lang === 'en' ? 'Draft saved' : 'Rasimu imehifadhiwa') : (lang === 'en' ? 'Auto-saving...' : 'Inahifadhi...'))
              }
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
              <Cloud size={14} />
              <span>{lang === 'en' ? 'Cloud + Local Sync Active' : 'Mfumo + Moja kwa Moja Imetumika'}</span>
            </div>
          </div>
        )}
      >
        {(t, lang) => (
        <div className="u-stack" style={{ marginTop: 0 }}>
            {cloudDrafts.length > 0 && modalView === 'form' && (
              <div 
                style={{ 
                  background: 'var(--bg-surface-hover)', 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  animation: 'slideDown 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={18} color="var(--primary-color)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {lang === 'en' ? `You have ${cloudDrafts.length} unsaved draft(s)` : `Una rasimu ${cloudDrafts.length} ambazo hazijahifadhiwa`}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                      {lang === 'en' ? 'Would you like to resume your last session?' : 'Je, ungependa kuendelea na kazi yako ya mwisho?'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setHasDismissedDraftBanner(true);
                      setCloudDrafts([]);
                    }} 
                  > 
                    {lang === "en" ? "Ignore" : "Puuza"} 
                    {bannerCountdown > 0 && ( 
                      <span style={{ 
                        marginLeft: "6px", 
                        fontSize: "10px", 
                        opacity: 0.6, 
                        fontVariantNumeric: "tabular-nums" 
                      }}> 
                        ({bannerCountdown}s) 
                      </span> 
                    )} 
                  </Button> 
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setModalView('drafts_list')}
                  >
                    {lang === 'en' ? 'See All Drafts' : 'Angalia Rasimu Zote'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => {
                      const latestDraft = cloudDrafts[0];
                      const restoredData = { ...latestDraft.form_data };
                      if (!restoredData.accomplices) restoredData.accomplices = [createAccompliceObject()];
                      setNewCaseForm(restoredData);
                      setActiveDraftId(latestDraft.id);
                      setCloudDrafts([]);
                      showToast(t('cases.draftRestored'), 'success');
                    }}
                  >
                    {lang === 'en' ? 'Restore Session' : 'Rejesha Kazi'}
                  </Button>
                </div>
              </div>
            )}

            {modalView === 'drafts_list' ? (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Button size="sm" variant="ghost" onClick={() => setModalView('form')}>
                       <ChevronLeft size={16} /> {lang === 'en' ? 'Back to Form' : 'Rudi kwenye Fomu'}
                    </Button>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                       {lang === 'en' ? 'Available Drafts' : 'Rasimu Zinazopatikana'}
                    </h3>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cloudDrafts.map((draft) => (
                      <div 
                        key={draft.id}
                        onClick={() => {
                          const restoredData = { ...draft.form_data };
                          if (!restoredData.accomplices) restoredData.accomplices = [createAccompliceObject()];
                          setNewCaseForm(restoredData);
                          setActiveDraftId(draft.id);
                          setModalView('form');
                          setCloudDrafts([]);
                          showToast(t('cases.draftRestored'), 'success');
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.borderColor = 'var(--primary-color)';
                          e.currentTarget.style.background = 'var(--bg-surface-hover)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--bg-surface)';
                        }}
                      >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(39, 73, 119, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={20} color="var(--primary-color)" />
                             </div>
                            <div>
                               <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {draft.form_data.title || (lang === 'en' ? 'Untitled Draft' : 'Rasimu Bila Jina')}
                                </p>
                               <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {lang === 'en' ? 'Last saved: ' : 'Ilihifadhiwa mwisho: '}
                                  {new Date(draft.updated_at).toLocaleString()}
                                  {draft.form_data.rbNumber ? ` • ${draft.form_data.rbNumber}` : ''}
                               </p>
                            </div>
                         </div>
                         <div 
                           style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                           onClick={e => e.stopPropagation()} // Prevent triggering restore when clicking delete area
                         >
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                               {draftToDeleteId === draft.id && (
                                 <button
                                   onClick={(e) => confirmDeleteDraft(e)}
                                   style={{
                                     background: '#AB2E24',
                                     color: 'white',
                                     border: 'none',
                                     padding: '8px 16px',
                                     borderRadius: '20px',
                                     fontSize: '12px',
                                     fontWeight: 700,
                                     cursor: 'pointer',
                                     whiteSpace: 'nowrap',
                                     boxShadow: '0 4px 12px rgba(171, 46, 36, 0.2)',
                                     animation: 'slideLeftConfirm 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                   }}
                                 >
                                   {lang === 'en' ? 'Confirm Delete' : 'Thibitisha Futa'}
                                 </button>
                               )}

                               <button 
                                 onClick={(e) => triggerDeleteDraft(e, draft.id)}
                                 title={lang === 'en' ? 'Delete Draft' : 'Futa Rasimu'}
                                 style={{
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   width: '36px',
                                   height: '36px',
                                   borderRadius: '50%',
                                   background: draftToDeleteId === draft.id ? 'var(--bg-surface-hover)' : 'var(--bg-surface-active)',
                                   border: `1.5px solid ${draftToDeleteId === draft.id ? 'var(--border-color)' : 'var(--border-color)'}`,
                                   color: draftToDeleteId === draft.id ? 'var(--text-muted)' : 'var(--error-color)',
                                   cursor: 'pointer',
                                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                   boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                   padding: 0,
                                   transform: draftToDeleteId === draft.id ? 'rotate(90deg)' : 'none'
                                 }}
                                 onMouseOver={e => {
                                   if (draftToDeleteId !== draft.id) {
                                     e.currentTarget.style.borderColor = 'var(--error-color)';
                                     e.currentTarget.style.transform = 'translateY(-1px)';
                                     e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                   }
                                 }}
                                 onMouseOut={e => {
                                   if (draftToDeleteId !== draft.id) {
                                     e.currentTarget.style.borderColor = 'var(--border-color)';
                                     e.currentTarget.style.transform = 'translateY(0)';
                                     e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                   }
                                 }}
                               >
                                   {draftToDeleteId === draft.id ? <X size={18} /> : <Trash2 size={18} />}
                               </button>
                            </div>
                            <ChevronRight size={18} color="var(--text-muted)" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              <React.Fragment>
                {/* Case Reference Section */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                 <div style={{ flex: 1 }}>

                   <h3 className="section-subtitle" style={{ marginBottom: '16px' }}><FileText size={16} /> {t('cases.modal.sections.reference')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>{t('cases.modal.fields.rbNum')} *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MURIET/RB/0104/2026" 
                        value={newCaseForm.rbNumber} 
                        onChange={(e) => handleInputChange('rbNumber', e.target.value)}
                        autoComplete="off"
                      />
                      {formErrors.rbNumber && <span style={errorStyle}>{formErrors.rbNumber}</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>{t('cases.modal.fields.date')} *</label>
                        <input 
                          type="date" 
                          value={newCaseForm.dateOfCrime} 
                          onChange={(e) => handleInputChange('dateOfCrime', e.target.value)} 
                          autoComplete="off" 
                        />
                        {formErrors.dateOfCrime && <span style={errorStyle}>{formErrors.dateOfCrime}</span>}
                      </div>
                      <div>
                        <label style={labelStyle}>{t('cases.modal.fields.reportingDate')} *</label>
                        <input 
                          type="date" 
                          value={newCaseForm.dateOfReporting} 
                          onChange={(e) => handleInputChange('dateOfReporting', e.target.value)} 
                          autoComplete="off" 
                        />
                        {formErrors.dateOfReporting && <span style={errorStyle}>{formErrors.dateOfReporting}</span>}
                      </div>
                    </div>
                  </div>
               </div>

               {/* Right: Photo picker — 130x130 */}
               <div style={{ flexShrink: 0, width: '130px', marginTop: '38px' }}> {/* Align with first input field */}
                 <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                   <Camera size={14} />
                   {lang === 'en' ? 'Photo' : 'Picha'}
                 </label>
                 <div
                   onClick={() => document.getElementById('suspect-photo-input').click()}
                   style={{
                     width: '130px', height: '130px',
                     border: `2px dashed ${suspectPhoto ? 'var(--primary-color)' : 'var(--border-color)'}`,
                     borderRadius: '10px',
                     cursor: 'pointer',
                     background: 'var(--bg-surface-hover)',
                     transition: 'all 0.2s',
                     display: 'flex', flexDirection: 'column',
                     alignItems: 'center', justifyContent: 'center',
                     overflow: 'hidden', position: 'relative',
                   }}
                   onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                   onMouseOut={e => e.currentTarget.style.borderColor = suspectPhoto ? 'var(--primary-color)' : 'var(--border-color)'}
                 >
                   {suspectPhoto ? (
                     <>
                       <img src={suspectPhoto.preview} alt="Suspect"
                         style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                       <button type="button"
                         onClick={e => { e.stopPropagation(); setSuspectPhoto(null); }}
                         style={{
                           position: 'absolute', top: '8px', right: '8px',
                           background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff',
                           borderRadius: '50%', width: '24px', height: '24px',
                           cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                           lineHeight: '24px', textAlign: 'center', padding: 0,
                           zIndex: 10
                         }}>✕</button>
                     </>
                   ) : (
                     <div style={{ textAlign: 'center', padding: '12px' }}>
                       <Camera size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                       <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                         {lang === 'en' ? 'Add photo' : 'Ongeza picha'}
                       </div>
                     </div>
                   )}
                 </div>
                 <input id="suspect-photo-input" type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      setAutosaveStatus('saving');
                      const file = e.target.files?.[0];
                      if (file) setSuspectPhoto({ file, preview: URL.createObjectURL(file) });
                      e.target.value = '';
                    }}
                 />
               </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>{t('cases.modal.fields.title')} *</label>
              <input type="text" placeholder="e.g. THEFT BY SERVANT..." value={newCaseForm.title} onChange={(e) => handleNameInput('title', e.target.value)} autoComplete="off" />
              {formErrors.title && <span style={errorStyle}>{formErrors.title}</span>}
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>{t('cases.modal.fields.source')}</label>
              <textarea placeholder={t('cases.modal.fields.sourcePlaceholder')} style={{ minHeight: '80px' }} value={newCaseForm.sourceOfInfo} onChange={(e) => handleInputChange('sourceOfInfo', e.target.value)} autoComplete="off" />
            </div>

            <div>
                <h3 className="section-subtitle"><Briefcase size={16} /> {t('cases.modal.sections.evaluation')}</h3>
               <div className="u-stack" style={{ marginTop: '12px' }}>
                 <div>
                   <label style={labelStyle}>{t('cases.modal.fields.location')} *</label>
                   <input type="text" placeholder={t('cases.modal.fields.locationPlaceholder')} value={newCaseForm.incidentLocation} onChange={(e) => handleInputChange('incidentLocation', e.target.value)} autoComplete="off" />
                 </div>
                 <div>
                    <label style={labelStyle}>{t('cases.modal.fields.findings')}</label>
                     <textarea placeholder={t('cases.modal.fields.findingsPlaceholder')} style={{ minHeight: '120px' }} value={newCaseForm.actionsTakenBefore} onChange={(e) => handleInputChange('actionsTakenBefore', e.target.value)} autoComplete="off" />
                  </div>
                  
                  {/* Pre-evaluation Attachments */}
                  <div>
                    <label style={labelStyle}>{lang === 'en' ? 'Pre-evaluation Attachments' : 'Viambatisho vya Awali'}</label>
                    <div 
                      style={{
                        padding: '24px',
                        border: '2px dashed var(--border-color)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        background: 'var(--bg-surface-hover)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      onClick={() => document.getElementById('pre-eval-upload').click()}
                    >
                       <UploadCloud size={32} color="var(--primary-color)" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                        {preEvaluationAttachments.length > 0 
                          ? `${preEvaluationAttachments.length} files selected` 
                          : (lang === 'en' ? 'Click to upload multiple documents/photos' : 'Bofya kupakia nyaraka/picha nyingi')}
                      </p>
                      <input 
                        id="pre-eval-upload" 
                        type="file" 
                        multiple 
                        style={{ display: 'none' }} 
                        onChange={(e) => setPreEvaluationAttachments(Array.from(e.target.files))}
                      />
                    </div>
                    {uploadStatus !== 'idle' && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-surface-active)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-color)' }}>
                          <span>{uploadStatus}...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary-color)', transition: 'width 0.2s ease' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            {/* Suspect Bio Data from amendment text */}
            <div>
               <h3 className="section-subtitle"><User size={16} /> {t('cases.modal.sections.bioData')}</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                 <div style={{ gridColumn: 'span 2' }}>
                   <label style={labelStyle}>{t('cases.modal.fields.fullName')} *</label>
                   <input type="text" placeholder={t('cases.modal.fields.namePlaceholder')} value={newCaseForm.suspectFullName} onChange={(e) => handleNameInput('suspectFullName', e.target.value)} autoComplete="name" />
                   {formErrors.suspectFullName && <span style={errorStyle}>{formErrors.suspectFullName}</span>}
                 </div>
                 <div>
                   <label style={labelStyle}>{t('cases.modal.fields.dob')}</label>
                   <input type="date" value={newCaseForm.suspectDOB} onChange={(e) => handleInputChange('suspectDOB', e.target.value)} autoComplete="bday" />
                 </div>
                 
                 <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>{t('cases.modal.fields.birthPlace')} *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <input type="text" placeholder={t('cases.modal.fields.country')} value={newCaseForm.suspectCountryOfBirth} onChange={(e) => handleInputChange('suspectCountryOfBirth', e.target.value.toUpperCase())} autoComplete="country-name" />
                      <input type="text" placeholder={t('cases.modal.fields.city')} value={newCaseForm.suspectCityOfBirth} onChange={(e) => handleInputChange('suspectCityOfBirth', e.target.value.toUpperCase())} autoComplete="address-level2" />
                      <input type="text" placeholder={t('cases.modal.fields.street')} value={newCaseForm.suspectStreetOfBirth} onChange={(e) => handleInputChange('suspectStreetOfBirth', e.target.value.toUpperCase())} autoComplete="address-line1" />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>{t('cases.modal.fields.residence')} *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <input type="text" placeholder={t('cases.modal.fields.country')} value={newCaseForm.suspectCountryOfResidence} onChange={(e) => handleInputChange('suspectCountryOfResidence', e.target.value.toUpperCase())} autoComplete="country-name" />
                      <input type="text" placeholder={t('cases.modal.fields.city')} value={newCaseForm.suspectCityOfResidence} onChange={(e) => handleInputChange('suspectCityOfResidence', e.target.value.toUpperCase())} autoComplete="address-level2" />
                      <input type="text" placeholder={t('cases.modal.fields.street')} value={newCaseForm.suspectStreetOfResidence} onChange={(e) => handleInputChange('suspectStreetOfResidence', e.target.value.toUpperCase())} autoComplete="address-line1" />
                    </div>
                  </div>

                 <div>
                   <label style={labelStyle}>{t('cases.modal.fields.occupation')}</label>
                   <input type="text" value={newCaseForm.suspectOccupation} onChange={(e) => handleInputChange('suspectOccupation', e.target.value)} autoComplete="organization-title" />
                 </div>
                 <div>
                   <label style={labelStyle}>{t('cases.modal.fields.phone')} *</label>
                   <input type="tel" placeholder="+255-XXX-XXX-XXX" value={newCaseForm.suspectPhone} onChange={(e) => handlePhoneInput('suspectPhone', e.target.value)} autoComplete="tel" />
                 </div>
                 <div>
                   <label style={labelStyle}>{t('cases.modal.fields.nida')}</label>
                   <input type="text" placeholder="XXXXXXXX-XXXXX-XXXXX-XX" value={newCaseForm.suspectNIDA} onChange={(e) => handleNidaInput('suspectNIDA', e.target.value)} autoComplete="off" />
                 </div>

                </div>
             </div>

             {/* Accomplice Section */}
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <h3 className="section-subtitle" style={{ marginBottom: 0 }}>{t('cases.modal.sections.accomplice')}</h3>
                   <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', background: 'rgba(52, 114, 213, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                     {newCaseForm.accomplices.length}
                   </span>
                 </div>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                   <input type="checkbox" checked={newCaseForm.hasAccomplice} onChange={(e) => handleInputChange('hasAccomplice', e.target.checked)} style={{ width: 'auto', minHeight: 'auto' }} />
                   {t('cases.modal.fields.hasAccomplice')}
                 </label>
               </div>
               
               {newCaseForm.hasAccomplice && (
                 <div className="u-stack" style={{ gap: '20px' }}>
                   {newCaseForm.accomplices.map((acc, idx) => (
                     <div key={idx} style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-surface)', position: 'relative' }}>
                        {newCaseForm.accomplices.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeAccomplice(idx)}
                            style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}
                          >
                             <Trash2 size={14} /> {t('cases.modal.fields.remove')}
                          </button>
                        )}
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>{t('cases.modal.fields.accompliceLabel')} {idx + 1}: {t('cases.modal.fields.fullName')} *</label>
                            <input type="text" value={acc.fullName} onChange={(e) => handleAccompliceChange(idx, 'fullName', e.target.value.toUpperCase())} autoComplete="name" />
                            {formErrors[`accomplice_${idx}_fullName`] && <span style={errorStyle}>{formErrors[`accomplice_${idx}_fullName`]}</span>}
                          </div>
                          
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>{t('cases.modal.fields.birthPlace')} *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <input type="text" placeholder={t('cases.modal.fields.country')} value={acc.countryOfBirth} onChange={(e) => handleAccompliceChange(idx, 'countryOfBirth', e.target.value.toUpperCase())} autoComplete="country-name" />
                              <input type="text" placeholder={t('cases.modal.fields.city')} value={acc.cityOfBirth} onChange={(e) => handleAccompliceChange(idx, 'cityOfBirth', e.target.value.toUpperCase())} autoComplete="address-level2" />
                              <input type="text" placeholder={t('cases.modal.fields.street')} value={acc.streetOfBirth} onChange={(e) => handleAccompliceChange(idx, 'streetOfBirth', e.target.value.toUpperCase())} autoComplete="address-line1" />
                            </div>
                            {formErrors[`accomplice_${idx}_cityOfBirth`] && <span style={errorStyle}>{formErrors[`accomplice_${idx}_cityOfBirth`]}</span>}
                          </div>

                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>{t('cases.modal.fields.residence')} *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <input type="text" placeholder={t('cases.modal.fields.country')} value={acc.countryOfResidence} onChange={(e) => handleAccompliceChange(idx, 'countryOfResidence', e.target.value.toUpperCase())} autoComplete="country-name" />
                              <input type="text" placeholder={t('cases.modal.fields.city')} value={acc.cityOfResidence} onChange={(e) => handleAccompliceChange(idx, 'cityOfResidence', e.target.value.toUpperCase())} autoComplete="address-level2" />
                              <input type="text" placeholder={t('cases.modal.fields.street')} value={acc.streetOfResidence} onChange={(e) => handleAccompliceChange(idx, 'streetOfResidence', e.target.value.toUpperCase())} autoComplete="address-line1" />
                            </div>
                            {formErrors[`accomplice_${idx}_cityOfResidence`] && <span style={errorStyle}>{formErrors[`accomplice_${idx}_cityOfResidence`]}</span>}
                          </div>

                          <div>
                            <label style={labelStyle}>{t('cases.modal.fields.phone')} *</label>
                            <input type="tel" value={acc.phone} onChange={(e) => handleAccompliceChange(idx, 'phone', e.target.value)} autoComplete="tel" />
                            {formErrors[`accomplice_${idx}_phone`] && <span style={errorStyle}>{formErrors[`accomplice_${idx}_phone`]}</span>}
                          </div>
                          <div>
                             <label style={labelStyle}>{t('cases.modal.fields.nida')} *</label>
                             <input type="text" value={acc.nida} onChange={(e) => handleAccompliceChange(idx, 'nida', e.target.value)} />
                             {formErrors[`accomplice_${idx}_nida`] && <span style={errorStyle}>{formErrors[`accomplice_${idx}_nida`]}</span>}
                          </div>
                        </div>
                     </div>
                   ))}
                   
                   <Button 
                    variant="outline" 
                    onClick={addAccomplice} 
                    style={{ borderStyle: 'dashed', width: '100%', padding: '16px', background: 'var(--bg-surface-hover)' }}
                   >
                     <Plus size={18} /> {t('cases.modal.fields.addAccomplice')}
                   </Button>
                 </div>
               )}
             </div>
             </React.Fragment>
           )}
        </div>
        )}
      </Modal>

      {/* Case View Modal (High Visual Fidelity) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={(mt) => selectedCase ? `${mt('cases.modal.viewTitle')}: ${selectedCase.rb_number}` : mt('cases.modal.viewTitle')}
        size="large"
      >
        {(t, lang) => (
        selectedCase && (
          <div className="u-stack" style={{ marginTop: 0, gap: '24px' }}>
                    {/* Classification & Reference */}
              <div className="view-section">
                <h3 className="section-subtitle"><Briefcase size={16} /> {t('cases.modal.sections.reference')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <DetailItem label={t('cases.modal.fields.title')} value={selectedCase.title} />
                  <DetailItem label={t('cases.modal.fields.source')} value={selectedCase.incident_info} />
                  <DetailItem label={t('cases.table.rb')} value={`${selectedCase.rb_number}/${selectedCase.year}`} />
                  <DetailItem label={t('cases.modal.fields.date')} value={selectedCase.date_of_crime} />
                  <DetailItem label={t('cases.modal.fields.reportingDate')} value={selectedCase.date_of_reporting} />
                </div>
              </div>

              {/* Pre-evaluation Data / Investigation Context */}
              <div className="view-section">
                <h3 className="section-subtitle"><FileSearch size={16} /> {t('cases.modal.sections.evaluation')}</h3>
                <div className="u-stack" style={{ gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <DetailItem label={t('cases.modal.fields.location')} value={selectedCase.incident_location} />
                  </div>
                  <DetailItem label={t('cases.modal.fields.findings')} value={selectedCase.initial_findings} />
                  {selectedCase.prior_actions_taken && (
                    <DetailItem label={lang === 'en' ? 'Prior Actions Taken' : 'Hatua Zilizochukuliwa Kabla'} value={selectedCase.prior_actions_taken} />
                  )}
                </div>
              </div>

              {/* Accused Details */}
              <div className="view-section">
                <h3 className="section-subtitle"><User size={16} /> {t('cases.modal.sections.bioData')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <DetailItem label={t('cases.modal.fields.fullName')} value={selectedCase.suspect_full_name} />
                  <DetailItem label={t('cases.modal.fields.nida')} value={selectedCase.suspect_national_id} />
                  <DetailItem label={t('cases.modal.fields.phone')} value={selectedCase.suspect_phone} />
                  <DetailItem label={t('cases.modal.fields.dob')} value={selectedCase.suspect_dob} />
                  <DetailItem label={t('cases.modal.fields.birthPlace')} value={selectedCase.suspect_pob} />
                  <DetailItem label={t('cases.modal.fields.residence')} value={selectedCase.suspect_residence} />
                  <DetailItem label={t('cases.modal.fields.occupation')} value={selectedCase.suspect_occupation} />
                </div>
              </div>
              
              {/* Accomplices Details */}
              {selectedCase.accomplices?.length > 0 && (
                <div className="view-section">
                  <h3 className="section-subtitle"><User size={16} /> {t('cases.modal.sections.accomplice')}</h3>
                  <div className="u-stack" style={{ gap: '12px' }}>
                    {selectedCase.accomplices.map((acc, idx) => (
                      <div key={idx} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface-hover)' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase' }}>{t('cases.modal.fields.accompliceLabel')} {idx + 1}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <DetailItem label={t('cases.modal.fields.fullName')} value={acc.full_name} />
                          <DetailItem label={t('cases.modal.fields.nida')} value={acc.national_id} />
                          <DetailItem label={t('cases.modal.fields.phone')} value={acc.phone} />
                          <DetailItem label={t('cases.modal.fields.residence')} value={acc.residence} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Case Ownership & Actor Notice */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                    OJ
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{lang === 'en' ? 'CASE CREATOR' : 'MUANZISHAJI WA KESI'}</p>
                  </div>
                </div>
              </div>
              
              {/* Case Attachments & Media */}
              <div>
                <h3 className="section-subtitle"><ImageIcon size={16} /> {t('cases.details.sections.media')}</h3>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '20px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '120px', height: '150px', borderRadius: '8px', border: '2px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflow: 'hidden' }}>
                      {selectedCase.mugshotUrl ? (
                        <img 
                          src={selectedCase.mugshotUrl} 
                          alt="Accused Photo" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <User size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                      )}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lang === 'en' ? 'ACCUSED PHOTO' : 'PICHA YA MTUHUMIWA'}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                     <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>{lang === 'en' ? 'Supporting Documents' : 'Nyaraka Zinazosaidia'}</p>
                     <div style={{ padding: '16px', border: '2px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                       {lang === 'en' ? 'No documents attached to this case.' : 'Hakuna nyaraka zilizoambatanishwa na kesi hii.'}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </Modal>

      <style>{`
        .table-row-hover:hover { background: var(--bg-surface-hover); }
        .sticky-action { 
          position: sticky; 
          right: 0; 
          background: var(--bg-surface); 
          z-index: 10; 
          box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.05);
        }
        th.sticky-action { background: var(--bg-surface-hover); z-index: 11; }
        
        @media (max-width: 767px) {
          .desktop-table { display: none; }
          .mobile-cards { display: flex; flex-direction: column; gap: 16px; padding: 16px; }
          .case-card { 
            background: var(--bg-surface); 
            border: 1.5px solid var(--border-color); 
            border-radius: 12px; 
            padding: 16px; 
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }
          .case-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
          .case-card-rb { font-size: 14px; font-weight: 800; color: var(--primary-color); }
          .case-card-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
          .case-card-meta { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
          .case-card-action { margin-top: 16px; }
          .case-card-view-btn { width: 100%; min-height: 44px !important; }
        }
        @media (min-width: 768px) {
          .mobile-cards { display: none; }
        }

        input::placeholder, textarea::placeholder { color: var(--text-muted); opacity: 0.6; }
        textarea { padding: 12px var(--gutter-s); border: 1px solid var(--border-color); border-radius: var(--radius-btn); outline: none; width: 100%; font-family: inherit; resize: vertical; }
        @keyframes slideLeftConfirm {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-surface-active)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        {value || 'N/A'}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: '12px 24px',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap'
};

const sectionStyle = {
  padding: '20px',
  background: 'var(--bg-primary)',
  borderRadius: '12px',
  border: '1px solid var(--border-color)'
};

const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: 800,
  color: 'var(--text-muted)',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text-secondary)'
};

const errorStyle = {
  display: 'block',
  marginTop: '4px',
  fontSize: '11px',
  color: 'var(--danger-color)',
  fontWeight: 600
};

function FolderSearch({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}
