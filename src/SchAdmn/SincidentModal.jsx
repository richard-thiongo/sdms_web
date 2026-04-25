import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, AlertTriangle, User, GraduationCap,
  Calendar, Clock, Shield, FileText,
  CheckCircle, XCircle, Award, ExternalLink,
  Image, Eye, Loader2, Plus, Trash2, AlertCircle,
  Edit, Save, Download, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';
import sTierUtils from './utils/stierUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const T = {
  bg:        'rgba(15, 23, 42, 0.98)',
  surface:   'rgba(30, 41, 59, 0.65)',
  surfaceD:  'rgba(15, 23, 42, 0.6)',
  border:    'rgba(148, 163, 184, 0.12)',
  borderMid: 'rgba(148, 163, 184, 0.22)',
  text:      '#f1f5f9',
  textSub:   '#cbd5e1',
  textMuted: '#94a3b8',
  accent:    '#8b5cf6',
  accentDim: 'rgba(139, 92, 246, 0.15)',
  radius:    '14px',
  radiusSm:  '8px',
};

/* ─── Primitives ──────────────────────────────────────────────────────────── */
const FieldLabel = ({ children }) => (
  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMuted }}>
    {children}
  </p>
);

const FieldValue = ({ children, mono }) => (
  <p style={{ margin: 0, fontSize: '0.9rem', color: T.text,
    fontFamily: mono ? 'monospace' : 'inherit', lineHeight: 1.5 }}>
    {children}
  </p>
);

const SectionCard = ({ children, style }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: T.radius, overflow: 'hidden', ...style
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '13px 18px', borderBottom: `1px solid ${T.border}`,
    background: 'rgba(15, 23, 42, 0.3)'
  }}>
    <Icon size={14} color={accent || T.accent} />
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: T.textSub,
      letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {title}
    </span>
  </div>
);

const FieldGrid = ({ children, cols = 2 }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '1.1rem', padding: '18px'
  }}>
    {children}
  </div>
);

const Divider = () => (
  <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, margin: 0 }} />
);

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', background: `${color}18`, color,
    border: `1px solid ${color}35`, borderRadius: '999px',
    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em'
  }}>
    {label}
  </span>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '7px 16px', whiteSpace: 'nowrap',
    background: active ? T.accentDim : 'transparent',
    border: active ? `1px solid rgba(139,92,246,0.3)` : '1px solid transparent',
    borderRadius: '999px',
    color: active ? '#c4b5fd' : T.textMuted,
    cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem',
    transition: 'all 0.15s ease'
  }}>
    {label}
  </button>
);

/* Unified action button — variant: 'primary' | 'approve' | 'reject' | 'danger' | 'ghost' */
const Btn = ({ children, onClick, disabled, variant = 'ghost', icon: Icon, full }) => {
  const map = {
    primary: { bg: `linear-gradient(135deg,${T.accent},#7c3aed)`, color: 'white', border: 'none' },
    approve: { bg: 'linear-gradient(135deg,#10b981,#059669)',      color: 'white', border: 'none' },
    reject:  { bg: 'linear-gradient(135deg,#ef4444,#dc2626)',      color: 'white', border: 'none' },
    danger:  { bg: 'rgba(239,68,68,0.1)', color: '#fca5a5',        border: '1px solid rgba(239,68,68,0.25)' },
    ghost:   { bg: T.surface,             color: T.textSub,        border: `1px solid ${T.borderMid}` },
  };
  const s = map[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? '100%' : undefined,
      padding: '9px 18px',
      background: s.bg, color: s.color, border: s.border,
      borderRadius: T.radiusSm, fontWeight: 600, fontSize: '0.87rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
      opacity: disabled ? 0.6 : 1, transition: 'all 0.15s ease'
    }}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

const FormInput = ({ label, type = 'text', value, onChange, required, placeholder, rows }) => (
  <div>
    {label && (
      <label style={{ display: 'block', color: T.textSub, marginBottom: '6px',
        fontSize: '0.85rem', fontWeight: 500 }}>
        {label}{required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
      </label>
    )}
    {rows ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
        width: '100%', padding: '10px 12px', boxSizing: 'border-box',
        background: T.surfaceD, border: `1px solid ${T.borderMid}`,
        borderRadius: T.radiusSm, color: '#f8fafc', fontSize: '0.9rem',
        resize: 'vertical', fontFamily: 'inherit'
      }} />
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
        width: '100%', padding: '10px 12px', boxSizing: 'border-box',
        background: T.surfaceD, border: `1px solid ${T.borderMid}`,
        borderRadius: T.radiusSm, color: '#f8fafc', fontSize: '0.9rem'
      }} />
    )}
  </div>
);

/* ─── Evidence lightbox ───────────────────────────────────────────────────── */
const EvidenceViewer = ({ urls, index, onClose, onNext, onPrev }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1100,
    background: 'rgba(2,6,23,0.96)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '2rem'
  }}>
    <button onClick={onClose} style={{
      position: 'absolute', top: '1rem', right: '1rem',
      background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
      width: 40, height: 40, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'white', cursor: 'pointer'
    }}>
      <X size={20} />
    </button>
    <div style={{ maxWidth: '90%', maxHeight: '78vh', marginBottom: '1.25rem' }}>
      <img src={urls[index]} alt={`Evidence ${index + 1}`} style={{
        maxWidth: '100%', maxHeight: '100%', borderRadius: T.radiusSm,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }} onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x400/1e293b/94a3b8?text=Not+Available'; }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
      {[ChevronLeft, ChevronRight].map((Icon, i) => (
        <button key={i} onClick={i === 0 ? onPrev : onNext} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', cursor: 'pointer'
        }}>
          <Icon size={20} />
        </button>
      ))}
      <span style={{ fontSize: '0.88rem', minWidth: 60, textAlign: 'center' }}>
        {index + 1} / {urls.length}
      </span>
    </div>
  </div>
);

/* ─── Main component ──────────────────────────────────────────────────────── */
const SincidentModal = ({ incidentData, isOpen, onClose, onUpdate, onDelete, onEvidenceAdded }) => {
  const [activeTab, setActiveTab]           = useState('details');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [success, setSuccess]               = useState(null);
  const [evidenceFiles, setEvidenceFiles]   = useState([]);
  const [punishmentData, setPunishmentData] = useState({ name: '', start_date: '', end_date: '', completed: false });
  const [description, setDescription]       = useState('');
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [lightboxOpen, setLightboxOpen]     = useState(false);
  const [lightboxIdx, setLightboxIdx]       = useState(0);
  const fileInputRef = useRef(null);

  const evidenceUrls  = sTierUtils.processEvidenceUrls(incidentData?.evidence_url) || [];
  const canModify     = incidentData?.status === 'pending' && !incidentData?.is_deleted;
  const severityBadge = sTierUtils.getStierSeverityBadge();
  const statusBadge   = sTierUtils.getStierStatusBadge(incidentData?.status);
  const hasPunishment = !!incidentData?.punishment_id;
  const shortId       = incidentData.incident_id?.substring(0, 8);

  useEffect(() => {
    if (incidentData) {
      setDescription(incidentData.description || '');
      if (incidentData.punishment_id) {
        setPunishmentData({
          name: incidentData.punishment_name || '',
          start_date: incidentData.punishment_start_date || '',
          end_date: incidentData.punishment_end_date || '',
          completed: incidentData.punishment_completed || false,
        });
      }
    }
  }, [incidentData]);

  const toast = useCallback((msg, type = 'success') => {
    type === 'success' ? setSuccess(msg) : setError(msg);
    setTimeout(() => type === 'success' ? setSuccess(null) : setError(null), 5000);
  }, []);

  const cycleLight = (dir) => setLightboxIdx(i =>
    dir === 1 ? (i < evidenceUrls.length - 1 ? i + 1 : 0) : (i > 0 ? i - 1 : evidenceUrls.length - 1)
  );

  /* ── API handlers ── */
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const slots = 3 - evidenceUrls.length;
    const toAdd = files.slice(0, slots);
    if (toAdd.length < files.length) toast(`Only ${slots} slot(s) remaining (max 3 total)`, 'error');
    setEvidenceFiles(toAdd);
  }, [evidenceUrls.length, toast]);

  const handleUpload = useCallback(async () => {
    if (!evidenceFiles.length) { toast('Please select files to upload', 'error'); return; }
    setLoading(true);
    try {
      const r = await sTierUtils.API.addEvidenceToStierIncident(incidentData.incident_id, evidenceFiles);
      if (r.success) {
        toast('Evidence uploaded successfully');
        onEvidenceAdded?.(r.data);
        setEvidenceFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else { toast(sanitizeErrorMessage(r.message, 'Failed to upload evidence'), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); }
  }, [evidenceFiles, incidentData?.incident_id, onEvidenceAdded, toast]);

  const handleDeleteEvidence = useCallback(async (url) => {
    if (!window.confirm('Delete this evidence?')) return;
    setLoading(true);
    try {
      const r = await sTierUtils.API.deleteEvidenceFromStierIncident(incidentData.incident_id, url);
      if (r.success) { toast('Evidence deleted'); onEvidenceAdded?.(r.data); }
      else { toast(sanitizeErrorMessage(r.message, 'Failed to delete evidence'), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); }
  }, [incidentData?.incident_id, onEvidenceAdded, toast]);

  const handleReview = useCallback(async (action) => {
    if (action === 'reject' && !window.confirm('Reject this S-tier incident? This cannot be undone.')) return;
    setLoading(true);
    try {
      const r = await sTierUtils.API.reviewStierIncident(incidentData.incident_id, action);
      if (r.success) {
        toast(`Incident ${action}ed successfully`);
        onUpdate?.(incidentData.incident_id, { status: action === 'approve' ? 'approved' : 'rejected' });
        onClose();
      } else { toast(sanitizeErrorMessage(r.message, `Failed to ${action} incident`), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); }
  }, [incidentData?.incident_id, onUpdate, onClose, toast]);

  const handleUpdateDescription = useCallback(async () => {
    if (!description.trim()) { toast('Description is required', 'error'); return; }
    setLoading(true);
    try {
      const r = await sTierUtils.API.updateStierIncident(incidentData.incident_id, description);
      if (r.success) { toast('Incident updated'); onUpdate?.(incidentData.incident_id, { description }); }
      else { toast(sanitizeErrorMessage(r.message, 'Failed to update incident'), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); }
  }, [description, incidentData?.incident_id, onUpdate, toast]);

  const handleAddPunishment = useCallback(async () => {
    if (!punishmentData.name.trim()) { toast('Punishment name is required', 'error'); return; }
    if (!punishmentData.start_date || !punishmentData.end_date) { toast('Start and end dates are required', 'error'); return; }
    if (!sTierUtils.validateDateRange(punishmentData.start_date, punishmentData.end_date)) { toast('End date must be after start date', 'error'); return; }
    setLoading(true);
    try {
      const r = await sTierUtils.API.addPunishmentToStierIncident(
        incidentData.incident_id, punishmentData.name, punishmentData.start_date, punishmentData.end_date
      );
      if (r.success) { toast('Punishment added'); onUpdate?.(incidentData.incident_id, { hasPunishment: true }); }
      else { toast(sanitizeErrorMessage(r.message, 'Failed to add punishment'), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); }
  }, [punishmentData, incidentData?.incident_id, onUpdate, toast]);

  const handleUpdatePunishment = useCallback(async () => {
    setLoading(true);
    try {
      const updates = {
        ...(punishmentData.name       && { name: punishmentData.name }),
        ...(punishmentData.start_date && { start_date: punishmentData.start_date }),
        ...(punishmentData.end_date   && { end_date: punishmentData.end_date }),
        completed: punishmentData.completed
      };
      const r = await sTierUtils.API.updatePunishment(incidentData.punishment_id, updates);
      if (r.success) { toast('Punishment updated'); onUpdate?.(incidentData.incident_id, { punishmentUpdated: true }); }
      else { toast(sanitizeErrorMessage(r.message, 'Failed to update punishment'), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); }
  }, [punishmentData, incidentData?.punishment_id, incidentData?.incident_id, onUpdate, toast]);

  const handleSoftDelete = useCallback(async () => {
    setLoading(true);
    try {
      const r = await sTierUtils.API.softDeleteStierIncident(incidentData.incident_id);
      if (r.success) { toast('Incident deleted'); onDelete?.(incidentData.incident_id); onClose(); }
      else { toast(sanitizeErrorMessage(r.message, 'Failed to delete incident'), 'error'); }
    } catch { toast('Network error occurred', 'error'); }
    finally { setLoading(false); setConfirmDelete(false); }
  }, [incidentData?.incident_id, onDelete, onClose, toast]);

  if (!isOpen || !incidentData) return null;

  /* ── Tab content ── */
  const DetailsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Student */}
      <SectionCard>
        <SectionHeader icon={User} title="Student" />
        <FieldGrid>
          <div>
            <FieldLabel>Name</FieldLabel>
            <FieldValue>{incidentData.student_first_name} {incidentData.student_last_name}</FieldValue>
          </div>
          <div>
            <FieldLabel>Admission number</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GraduationCap size={13} color={T.textMuted} />
              <FieldValue>{incidentData.admission_number}</FieldValue>
            </div>
          </div>
          <div>
            <FieldLabel>Class</FieldLabel>
            <FieldValue>{incidentData.class_name || '—'}</FieldValue>
          </div>
          <div>
            <FieldLabel>Student ID</FieldLabel>
            <FieldValue mono>{incidentData.student_id}</FieldValue>
          </div>
        </FieldGrid>
      </SectionCard>

      {/* Incident info */}
      <SectionCard>
        <SectionHeader icon={AlertTriangle} title="Incident information" />
        <FieldGrid>
          <div>
            <FieldLabel>Reported by</FieldLabel>
            <FieldValue>
              {incidentData.reporter_first_name} {incidentData.reporter_last_name}
              {incidentData.reporter_email && (
                <span style={{ color: T.textMuted, fontSize: '0.82rem' }}> · {incidentData.reporter_email}</span>
              )}
            </FieldValue>
          </div>
          <div>
            <FieldLabel>Date reported</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} color={T.textMuted} />
              <FieldValue>{sTierUtils.formatDate(incidentData.incident_created_at)}</FieldValue>
            </div>
          </div>
          <div>
            <FieldLabel>Last updated</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color={T.textMuted} />
              <FieldValue>{sTierUtils.formatDate(incidentData.incident_updated_at)}</FieldValue>
            </div>
          </div>
        </FieldGrid>

        <Divider />

        {/* Description — editable if canModify */}
        <div style={{ padding: '18px' }}>
          <FieldLabel>Description</FieldLabel>
          {canModify ? (
            <>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter incident description…"
                rows={4}
                style={{
                  width: '100%', marginTop: '6px', padding: '10px 12px',
                  boxSizing: 'border-box', background: T.surfaceD,
                  border: `1px solid ${T.borderMid}`, borderRadius: T.radiusSm,
                  color: '#f8fafc', fontSize: '0.9rem', resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="primary" icon={loading ? Loader2 : Save} disabled={loading || !description.trim()}
                  onClick={handleUpdateDescription}>
                  {loading ? 'Saving…' : 'Save description'}
                </Btn>
              </div>
            </>
          ) : (
            <p style={{ margin: '6px 0 0', fontSize: '0.92rem', color: T.text,
              lineHeight: 1.65, whiteSpace: 'pre-wrap',
              padding: '10px 12px', background: T.surfaceD,
              borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}>
              {incidentData.description || 'No description provided'}
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const EvidenceTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Existing evidence */}
      <SectionCard>
        <SectionHeader icon={Image} title={`Evidence (${evidenceUrls.length}/3)`} />
        {evidenceUrls.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: T.textMuted }}>
            <FileText size={40} style={{ opacity: 0.4, display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ margin: '0 0 4px', color: T.textSub, fontWeight: 600 }}>No evidence attached</p>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Nothing was uploaded for this incident.</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
              gap: '1rem', padding: '18px'
            }}>
              {evidenceUrls.map((url, i) => (
                <div key={i}
                  onClick={() => { setLightboxIdx(i); setLightboxOpen(true); }}
                  style={{ borderRadius: T.radiusSm, overflow: 'hidden',
                    border: `1px solid ${T.border}`, cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ height: 125, background: 'rgba(15,23,42,0.7)', position: 'relative' }}>
                    <img src={url} alt={`Evidence ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,0.65)', color: 'white',
                      borderRadius: '4px', padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700
                    }}>#{i + 1}</span>
                  </div>
                  <div style={{ padding: '9px 12px', background: 'rgba(15,23,42,0.9)',
                    borderTop: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: T.textSub }}>Evidence {i + 1}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          color: T.textMuted, display: 'flex', padding: '2px' }} title="Open link">
                        <ExternalLink size={13} />
                      </button>
                      {canModify && (
                        <button onClick={e => { e.stopPropagation(); handleDeleteEvidence(url); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            color: '#f87171', display: 'flex', padding: '2px' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Divider />
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="primary" icon={Eye} onClick={() => setLightboxOpen(true)}>
                View fullscreen gallery
              </Btn>
            </div>
          </>
        )}
      </SectionCard>

      {/* Upload — only if canModify and slots remain */}
      {canModify && evidenceUrls.length < 3 && (
        <SectionCard>
          <SectionHeader icon={Plus} title={`Upload evidence — ${3 - evidenceUrls.length} slot(s) remaining`} />
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="file" ref={fileInputRef} multiple onChange={handleFileSelect} style={{
              width: '100%', padding: '12px', boxSizing: 'border-box',
              border: `2px dashed ${T.borderMid}`, borderRadius: T.radiusSm,
              background: T.surfaceD, color: '#f8fafc', fontSize: '0.88rem', cursor: 'pointer'
            }} />

            {evidenceFiles.length > 0 && (
              <div style={{ background: T.surfaceD, borderRadius: T.radiusSm,
                border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
                  fontSize: '0.82rem', fontWeight: 600, color: T.textSub }}>
                  Selected files ({evidenceFiles.length})
                </div>
                {evidenceFiles.map((file, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderBottom: i < evidenceFiles.length - 1 ? `1px solid ${T.border}` : 'none'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 2px', color: T.text, fontSize: '0.87rem' }}>{file.name}</p>
                      <p style={{ margin: 0, color: T.textMuted, fontSize: '0.75rem' }}>
                        {sTierUtils.formatFileSize(file.size)}
                      </p>
                    </div>
                    <button onClick={() => setEvidenceFiles(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: '#f87171', display: 'flex', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Btn variant="primary" icon={loading ? Loader2 : Download}
              disabled={loading || evidenceFiles.length === 0} onClick={handleUpload} full>
              {loading ? 'Uploading…' : `Upload ${evidenceFiles.length || ''} file(s)`}
            </Btn>
          </div>
        </SectionCard>
      )}
    </div>
  );

  const PunishmentTab = () => {
    const punStatusBadge = sTierUtils.getPunishmentStatusBadge(
      incidentData.punishment_completed, incidentData.punishment_end_date
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {hasPunishment ? (
          <>
            {/* Current punishment summary */}
            <SectionCard>
              <SectionHeader icon={Shield} title="Current punishment" />
              <FieldGrid>
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={13} color={T.textMuted} />
                    <FieldValue>{incidentData.punishment_name}</FieldValue>
                  </div>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <Badge label={punStatusBadge.label} color={punStatusBadge.color || '#3b82f6'} />
                </div>
                <div>
                  <FieldLabel>Start date</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color={T.textMuted} />
                    <FieldValue>{sTierUtils.formatSimpleDate(incidentData.punishment_start_date)}</FieldValue>
                  </div>
                </div>
                <div>
                  <FieldLabel>End date</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color={T.textMuted} />
                    <FieldValue>{sTierUtils.formatSimpleDate(incidentData.punishment_end_date)}</FieldValue>
                  </div>
                </div>
              </FieldGrid>
            </SectionCard>

            {/* Edit form — only if canModify */}
            {canModify && (
              <SectionCard>
                <SectionHeader icon={Edit} title="Update punishment" />
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <FieldGrid cols={2}>
                    <FormInput label="Name" value={punishmentData.name}
                      onChange={e => setPunishmentData({ ...punishmentData, name: e.target.value })} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '26px' }}>
                      <input type="checkbox" id="completed" checked={punishmentData.completed}
                        onChange={e => setPunishmentData({ ...punishmentData, completed: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <label htmlFor="completed" style={{ color: T.textSub, fontSize: '0.88rem', cursor: 'pointer' }}>
                        Mark as completed
                      </label>
                    </div>
                    <FormInput label="Start date" type="date" value={punishmentData.start_date}
                      onChange={e => setPunishmentData({ ...punishmentData, start_date: e.target.value })} />
                    <FormInput label="End date" type="date" value={punishmentData.end_date}
                      onChange={e => setPunishmentData({ ...punishmentData, end_date: e.target.value })} />
                  </FieldGrid>
                  <Btn variant="primary" icon={loading ? Loader2 : Save} disabled={loading}
                    onClick={handleUpdatePunishment} full>
                    {loading ? 'Updating…' : 'Save changes'}
                  </Btn>
                </div>
              </SectionCard>
            )}
          </>
        ) : (
          /* No punishment yet */
          <SectionCard>
            <SectionHeader icon={Shield} title="No punishment assigned" />
            {canModify ? (
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: T.textMuted }}>
                  Assign a punishment to this S-tier incident.
                </p>
                <FieldGrid cols={1}>
                  <FormInput label="Punishment name" required value={punishmentData.name}
                    onChange={e => setPunishmentData({ ...punishmentData, name: e.target.value })}
                    placeholder="e.g. Suspension" />
                </FieldGrid>
                <FieldGrid cols={2}>
                  <FormInput label="Start date" required type="date" value={punishmentData.start_date}
                    onChange={e => setPunishmentData({ ...punishmentData, start_date: e.target.value })} />
                  <FormInput label="End date" required type="date" value={punishmentData.end_date}
                    onChange={e => setPunishmentData({ ...punishmentData, end_date: e.target.value })} />
                </FieldGrid>
                <Btn variant="primary" icon={loading ? Loader2 : Plus}
                  disabled={loading || !punishmentData.name.trim() || !punishmentData.start_date || !punishmentData.end_date}
                  onClick={handleAddPunishment} full>
                  {loading ? 'Adding…' : 'Add punishment'}
                </Btn>
              </div>
            ) : (
              <div style={{ padding: '2.5rem 2rem', textAlign: 'center', color: T.textMuted }}>
                <Award size={40} style={{ opacity: 0.35, display: 'block', margin: '0 auto 1rem' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>
                  Only pending incidents can have punishments assigned.
                </p>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    );
  };

  const ActionsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Review */}
      <SectionCard>
        <SectionHeader icon={CheckCircle} title="Review incident" />
        <div style={{ padding: '18px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: T.textMuted }}>
            Approve or reject this S-tier incident. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <Btn variant="approve" icon={loading ? Loader2 : CheckCircle}
                disabled={loading} onClick={() => handleReview('approve')} full>
                Approve
              </Btn>
            </div>
            <div style={{ flex: 1 }}>
              <Btn variant="reject" icon={loading ? Loader2 : XCircle}
                disabled={loading} onClick={() => handleReview('reject')} full>
                Reject
              </Btn>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Delete */}
      <SectionCard>
        <SectionHeader icon={Trash2} title="Delete incident" accent="#ef4444" />
        <div style={{ padding: '18px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: T.textMuted }}>
            Soft-delete this incident. Administrators can restore it later.
          </p>
          {confirmDelete ? (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`,
              borderRadius: T.radiusSm, padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.88rem' }}>
                Are you sure? This will soft-delete the incident.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <Btn variant="reject" icon={loading ? Loader2 : Trash2}
                    disabled={loading} onClick={handleSoftDelete} full>
                    {loading ? 'Deleting…' : 'Yes, delete'}
                  </Btn>
                </div>
                <div style={{ flex: 1 }}>
                  <Btn variant="ghost" disabled={loading} onClick={() => setConfirmDelete(false)} full>
                    Cancel
                  </Btn>
                </div>
              </div>
            </div>
          ) : (
            <Btn variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)} full>
              Delete incident
            </Btn>
          )}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Render ── */
  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          background: T.bg, borderRadius: '20px', border: `1px solid ${T.border}`,
          width: '100%', maxWidth: '820px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6)', overflow: 'hidden',
          position: 'relative'
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: '20px 24px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
                background: severityBadge.bgColor,
                border: `1.5px solid ${severityBadge.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={20} color={severityBadge.color} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800,
                  color: T.text, letterSpacing: '-0.01em' }}>
                  S-Tier Incident
                </h2>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <Badge label={severityBadge.label} color={severityBadge.color} />
                  <Badge label={statusBadge.label}   color={statusBadge.color} />
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: '50%', width: 36, height: 36, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textMuted, cursor: 'pointer'
            }}>
              <X size={17} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex', gap: '6px', padding: '16px 24px',
            borderBottom: `1px solid ${T.border}`, flexShrink: 0, overflowX: 'auto'
          }}>
            <TabBtn label="Details"    active={activeTab === 'details'}    onClick={() => setActiveTab('details')} />
            <TabBtn label={`Evidence (${evidenceUrls.length}/3)`}
                                       active={activeTab === 'evidence'}   onClick={() => setActiveTab('evidence')} />
            <TabBtn label="Punishment" active={activeTab === 'punishment'} onClick={() => setActiveTab('punishment')} />
            {canModify && (
              <TabBtn label="Actions"  active={activeTab === 'actions'}    onClick={() => setActiveTab('actions')} />
            )}
          </div>

          {/* ── Toast banners ── */}
          {(error || success) && (
            <div style={{
              margin: '12px 24px 0', padding: '11px 16px', flexShrink: 0,
              background: error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              borderLeft: `3px solid ${error ? '#ef4444' : '#10b981'}`,
              borderRadius: '0 8px 8px 0',
              color: error ? '#fca5a5' : '#86efac',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem'
            }}>
              {error ? <AlertCircle size={15} color="#ef4444" /> : <CheckCircle size={15} color="#10b981" />}
              {error || success}
            </div>
          )}

          {/* ── Scrollable body ── */}
          <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
            {activeTab === 'details'    && <DetailsTab />}
            {activeTab === 'evidence'   && <EvidenceTab />}
            {activeTab === 'punishment' && <PunishmentTab />}
            {activeTab === 'actions' && canModify && <ActionsTab />}
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '13px 24px', borderTop: `1px solid ${T.border}`,
            background: 'rgba(15,23,42,0.6)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Hash size={13} color={T.textMuted} />
              <code style={{ fontSize: '0.78rem', color: T.textSub,
                background: 'rgba(30,41,59,0.9)', padding: '3px 9px',
                borderRadius: '5px', border: `1px solid ${T.border}` }}>
                {shortId}…
              </code>
            </div>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '20px'
            }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: T.accent }} />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && evidenceUrls.length > 0 && (
        <EvidenceViewer
          urls={evidenceUrls} index={lightboxIdx}
          onClose={() => setLightboxOpen(false)}
          onNext={() => cycleLight(1)} onPrev={() => cycleLight(-1)}
        />
      )}
    </>
  );
};

export default SincidentModal;