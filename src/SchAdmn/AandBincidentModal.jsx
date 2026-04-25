// AandBincidentModal.jsx
import React, { useState } from 'react';
import {
  X, AlertTriangle, User, GraduationCap,
  Calendar, Clock, Shield, FileText,
  CheckCircle, XCircle, Award, ExternalLink,
  Image, Eye, Loader2, Hash
} from 'lucide-react';
import {
  formatIncidentDate, formatPunishmentDate,
  getSeverityBadge, getStatusBadge, getPunishmentStatus,
  processEvidenceUrls, getStudentInitials
} from './utils/incidentUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

/* ─── Shared style tokens ─────────────────────────────────────────────────── */
const TOKEN = {
  bg:          'rgba(15, 23, 42, 0.98)',
  surface:     'rgba(30, 41, 59, 0.7)',
  surfaceHover:'rgba(30, 41, 59, 0.9)',
  border:      'rgba(148, 163, 184, 0.12)',
  borderMid:   'rgba(148, 163, 184, 0.22)',
  textPrimary: '#f1f5f9',
  textMuted:   '#94a3b8',
  textSub:     '#cbd5e1',
  accent:      '#8b5cf6',
  accentDim:   'rgba(139, 92, 246, 0.15)',
  radius:      '14px',
  radiusSm:    '8px',
};

/* ─── Tiny helpers ────────────────────────────────────────────────────────── */
const Divider = () => (
  <hr style={{ border: 'none', borderTop: `1px solid ${TOKEN.border}`, margin: '0' }} />
);

const FieldLabel = ({ children }) => (
  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.07em', textTransform: 'uppercase', color: TOKEN.textMuted }}>
    {children}
  </p>
);

const FieldValue = ({ children, mono }) => (
  <p style={{ margin: 0, fontSize: '0.9rem', color: TOKEN.textPrimary,
    fontFamily: mono ? 'monospace' : 'inherit', lineHeight: 1.5 }}>
    {children}
  </p>
);

const SectionCard = ({ children, style }) => (
  <div style={{
    background: TOKEN.surface,
    border: `1px solid ${TOKEN.border}`,
    borderRadius: TOKEN.radius,
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '14px 18px',
    borderBottom: `1px solid ${TOKEN.border}`,
    background: 'rgba(15, 23, 42, 0.3)'
  }}>
    <Icon size={15} color={TOKEN.accent} />
    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: TOKEN.textSub,
      letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {title}
    </span>
  </div>
);

const FieldGrid = ({ children, cols = 2 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '1.25rem',
    padding: '18px'
  }}>
    {children}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px',
    background: `${color}18`,
    color,
    border: `1px solid ${color}35`,
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.02em'
  }}>
    {label}
  </span>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '7px 18px',
    background: active ? TOKEN.accentDim : 'transparent',
    border: active ? `1px solid rgba(139,92,246,0.3)` : '1px solid transparent',
    borderRadius: '999px',
    color: active ? '#c4b5fd' : TOKEN.textMuted,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap'
  }}>
    {label}
  </button>
);

const FooterBtn = ({ children, onClick, disabled, variant = 'ghost', icon: Icon }) => {
  const styles = {
    approve: { background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none' },
    reject:  { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none' },
    ghost:   { background: 'rgba(30,41,59,0.8)', color: TOKEN.textSub, border: `1px solid ${TOKEN.borderMid}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '9px 20px',
      borderRadius: TOKEN.radiusSm,
      fontWeight: 600,
      fontSize: '0.88rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: '7px',
      opacity: disabled ? 0.65 : 1,
      transition: 'all 0.15s ease',
      ...styles[variant]
    }}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

/* ─── Evidence viewer overlay ─────────────────────────────────────────────── */
const EvidenceViewer = ({ urls, index, onClose, onNext, onPrev }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1100,
    background: 'rgba(2,6,23,0.96)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '2rem'
  }}>
    <button onClick={onClose} style={{
      position: 'absolute', top: '1rem', right: '1rem',
      background: 'rgba(255,255,255,0.08)', border: 'none',
      borderRadius: '50%', width: 40, height: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', cursor: 'pointer'
    }}>
      <X size={20} />
    </button>

    <div style={{ maxWidth: '90%', maxHeight: '78vh', marginBottom: '1.25rem' }}>
      <img
        src={urls[index]}
        alt={`Evidence ${index + 1}`}
        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: TOKEN.radiusSm,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://via.placeholder.com/600x400/1e293b/94a3b8?text=Not+Available';
        }}
      />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
      {['←','→'].map((ch, i) => (
        <button key={ch} onClick={i === 0 ? onPrev : onNext} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 40, height: 40, color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
        }}>{ch}</button>
      ))}
      <span style={{ fontSize: '0.88rem', minWidth: '60px', textAlign: 'center' }}>
        {index + 1} / {urls.length}
      </span>
    </div>
  </div>
);

/* ─── Main component ──────────────────────────────────────────────────────── */
const AandBincidentModal = ({
  incidentData,
  isOpen,
  onClose,
  onUpdate,
  view = 'details'
}) => {
  const [activeTab, setActiveTab]             = useState(view);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [evidenceOpen, setEvidenceOpen]       = useState(false);
  const [evidenceIdx, setEvidenceIdx]         = useState(0);

  if (!isOpen) return null;

  const evidenceUrls        = processEvidenceUrls(incidentData.evidence_url);
  const formattedDate       = formatIncidentDate(incidentData.incident_created_at || incidentData.created_at);
  const fmtStart            = formatPunishmentDate(incidentData.punishment_start_date);
  const fmtEnd              = formatPunishmentDate(incidentData.punishment_end_date);
  const severityBadge       = getSeverityBadge(incidentData.severity);
  const statusBadge         = getStatusBadge(incidentData.status);
  const punishmentStatus    = getPunishmentStatus({ completed: incidentData.punishment_completed, end_date: incidentData.punishment_end_date });
  const initials            = getStudentInitials(incidentData.student_first_name, incidentData.student_last_name);
  const isPending           = incidentData.status === 'pending';
  const shortId             = incidentData.incident_id?.substring(0, 8);

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      const result = await onUpdate?.(incidentData.incident_id, newStatus);
      if (result?.success) { onClose(); }
      else { setError(sanitizeErrorMessage(result?.message, 'Failed to update incident status')); }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cycle = (dir) => setEvidenceIdx(i =>
    dir === 1
      ? (i < evidenceUrls.length - 1 ? i + 1 : 0)
      : (i > 0 ? i - 1 : evidenceUrls.length - 1)
  );

  /* ── Details tab ── */
  const DetailsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Description + date — one card, two columns */}
      <SectionCard>
        <SectionHeader icon={FileText} title="Incident Information" />
        <FieldGrid>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Description</FieldLabel>
            <p style={{ margin: 0, fontSize: '0.92rem', color: TOKEN.textPrimary,
              lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {incidentData.description || 'No description provided'}
            </p>
          </div>
          <div>
            <FieldLabel>Date reported</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color={TOKEN.textMuted} />
              <FieldValue>{formattedDate}</FieldValue>
            </div>
          </div>
          <div>
            <FieldLabel>Incident ID</FieldLabel>
            <FieldValue mono>{shortId}…</FieldValue>
          </div>
        </FieldGrid>
      </SectionCard>

      {/* Student */}
      <SectionCard>
        <SectionHeader icon={User} title="Student" />
        <div style={{ padding: '18px', display: 'flex', gap: '1rem', alignItems: 'center',
          borderBottom: `1px solid ${TOKEN.border}` }}>
          <div style={{
            width: 52, height: 52, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '18px'
          }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: '1.05rem', fontWeight: 700, color: TOKEN.textPrimary }}>
              {incidentData.student_first_name} {incidentData.student_last_name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: TOKEN.textMuted, fontSize: '0.85rem' }}>
              <GraduationCap size={13} />
              {incidentData.admission_number}
            </div>
          </div>
        </div>
        <FieldGrid>
          <div>
            <FieldLabel>Student ID</FieldLabel>
            <FieldValue mono>{incidentData.student_id}</FieldValue>
          </div>
          {incidentData.class_name && (
            <div>
              <FieldLabel>Class</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '6px',
                  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '11px'
                }}>
                  {incidentData.class_name?.substring(0, 1)}
                </div>
                <FieldValue>{incidentData.class_name}</FieldValue>
              </div>
            </div>
          )}
        </FieldGrid>
      </SectionCard>

      {/* Reporter — only render if present */}
      {incidentData.reporter_first_name && (
        <SectionCard>
          <SectionHeader icon={User} title="Reported by" />
          <FieldGrid>
            <div>
              <FieldLabel>Name</FieldLabel>
              <FieldValue>{incidentData.reporter_first_name} {incidentData.reporter_last_name}</FieldValue>
            </div>
            {incidentData.reporter_email && (
              <div>
                <FieldLabel>Email</FieldLabel>
                <FieldValue>{incidentData.reporter_email}</FieldValue>
              </div>
            )}
          </FieldGrid>
        </SectionCard>
      )}

      {/* Punishment — only render if present */}
      {incidentData.punishment_name && (
        <SectionCard>
          <SectionHeader icon={Shield} title="Punishment" />
          <div style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '1rem',
            borderBottom: `1px solid ${TOKEN.border}` }}>
            <div style={{
              width: 44, height: 44, borderRadius: '10px',
              background: punishmentStatus.bgColor, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${punishmentStatus.color}`
            }}>
              <Award size={18} color={punishmentStatus.color} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: TOKEN.textPrimary }}>
                {incidentData.punishment_name}
              </p>
              <Badge label={punishmentStatus.label} color={punishmentStatus.color} />
            </div>
          </div>
          <FieldGrid>
            <div>
              <FieldLabel>Start date</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color={TOKEN.textMuted} />
                <FieldValue>{fmtStart}</FieldValue>
              </div>
            </div>
            <div>
              <FieldLabel>End date</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color={TOKEN.textMuted} />
                <FieldValue>{fmtEnd}</FieldValue>
              </div>
            </div>
            {incidentData.assigned_by_first_name && (
              <div>
                <FieldLabel>Assigned by</FieldLabel>
                <FieldValue>{incidentData.assigned_by_first_name} {incidentData.assigned_by_last_name}</FieldValue>
              </div>
            )}
          </FieldGrid>
        </SectionCard>
      )}
    </div>
  );

  /* ── Evidence tab ── */
  const EvidenceTab = () => (
    <SectionCard>
      <SectionHeader icon={Image} title={`Evidence (${evidenceUrls.length})`} />
      {evidenceUrls.length === 0 ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: TOKEN.textMuted }}>
          <FileText size={40} style={{ opacity: 0.4, display: 'block', margin: '0 auto 1rem' }} />
          <p style={{ margin: '0 0 4px', color: TOKEN.textSub, fontWeight: 600 }}>No evidence attached</p>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Nothing was uploaded for this incident.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: '1rem',
            padding: '18px'
          }}>
            {evidenceUrls.map((url, i) => (
              <div key={i}
                onClick={() => { setEvidenceIdx(i); setEvidenceOpen(true); }}
                style={{
                  borderRadius: TOKEN.radiusSm, overflow: 'hidden',
                  border: `1px solid ${TOKEN.border}`, cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ height: 130, background: 'rgba(15,23,42,0.7)', position: 'relative' }}>
                  <img src={url} alt={`Evidence ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.65)', color: 'white',
                    borderRadius: '4px', padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700
                  }}>#{i + 1}</span>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.9)',
                  borderTop: `1px solid ${TOKEN.border}`, display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: TOKEN.textSub }}>Evidence {i + 1}</span>
                  <button
                    onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: TOKEN.textMuted, display: 'flex', alignItems: 'center',
                      padding: '2px', borderRadius: '4px'
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Divider />
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEvidenceOpen(true)}
              style={{
                padding: '8px 16px',
                background: TOKEN.accentDim,
                border: `1px solid rgba(139,92,246,0.3)`,
                borderRadius: TOKEN.radiusSm,
                color: '#c4b5fd', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Eye size={14} /> View fullscreen gallery
            </button>
          </div>
        </>
      )}
    </SectionCard>
  );

  /* ── Timeline tab ── */
  const TimelineTab = () => {
    const events = [
      {
        dot: TOKEN.accent,
        title: 'Incident reported',
        date: formattedDate,
        body: `Reported by ${incidentData.reporter_first_name || 'a teacher'}`
      },
      incidentData.status === 'rejected' && {
        dot: '#ef4444',
        title: 'Incident rejected',
        date: incidentData.incident_updated_at ? formatIncidentDate(incidentData.incident_updated_at) : '—',
        body: 'Reviewed and rejected by school administration'
      },
      incidentData.punishment_assigned_at && {
        dot: '#f59e0b',
        title: 'Punishment assigned',
        date: formatIncidentDate(incidentData.punishment_assigned_at),
        body: `${incidentData.punishment_name} assigned by ${incidentData.assigned_by_first_name || 'administrator'} · ${fmtStart} → ${fmtEnd}`
      },
      incidentData.punishment_completed && {
        dot: '#10b981',
        title: 'Punishment completed',
        date: fmtEnd,
        body: 'Successfully completed by the student'
      }
    ].filter(Boolean);

    return (
      <SectionCard>
        <SectionHeader icon={Clock} title="Timeline" />
        <div style={{ padding: '24px 18px 18px', position: 'relative' }}>
          {/* vertical rule */}
          <div style={{
            position: 'absolute', left: '28px', top: '24px',
            bottom: '18px', width: '2px',
            background: 'linear-gradient(to bottom, #8b5cf6 0%, #3b82f6 100%)'
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {events.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: ev.dot, border: '3px solid rgba(15,23,42,0.98)',
                  flexShrink: 0, marginTop: '4px', position: 'relative', zIndex: 1
                }} />
                <div>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.95rem', color: TOKEN.textPrimary }}>
                    {ev.title}
                  </p>
                  <p style={{ margin: '0 0 5px', fontSize: '0.82rem', color: TOKEN.textMuted }}>
                    {ev.date}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: TOKEN.textSub }}>
                    {ev.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    );
  };

  /* ── Render ── */
  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(2,6,23,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: TOKEN.bg,
          borderRadius: '20px',
          border: `1px solid ${TOKEN.border}`,
          width: '100%', maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 0',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
                background: `${severityBadge.color}18`,
                border: `1px solid ${severityBadge.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={22} color={severityBadge.color} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800,
                  color: TOKEN.textPrimary, letterSpacing: '-0.01em' }}>
                  Incident Report
                </h2>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <Badge label={severityBadge.label} color={severityBadge.color} />
                  <Badge label={statusBadge.label}   color={statusBadge.color} />
                </div>
              </div>
            </div>

            <button onClick={onClose} style={{
              background: 'transparent',
              border: `1px solid ${TOKEN.border}`,
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: TOKEN.textMuted, cursor: 'pointer', flexShrink: 0
            }}>
              <X size={17} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex', gap: '6px',
            padding: '16px 24px',
            borderBottom: `1px solid ${TOKEN.border}`,
            flexShrink: 0, overflowX: 'auto'
          }}>
            <TabBtn label="Details"             active={activeTab === 'details'}   onClick={() => setActiveTab('details')} />
            <TabBtn label={`Evidence (${evidenceUrls.length})`}
                                                active={activeTab === 'evidence'}  onClick={() => setActiveTab('evidence')} />
            <TabBtn label="Timeline"            active={activeTab === 'timeline'}  onClick={() => setActiveTab('timeline')} />
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div style={{
              margin: '12px 24px 0',
              padding: '11px 16px',
              background: 'rgba(239,68,68,0.08)',
              borderLeft: '3px solid #ef4444',
              borderRadius: '0 8px 8px 0',
              color: '#fca5a5',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.88rem', flexShrink: 0
            }}>
              <AlertTriangle size={15} color="#ef4444" />
              {error}
            </div>
          )}

          {/* ── Scrollable body ── */}
          <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
            {activeTab === 'details'  && <DetailsTab />}
            {activeTab === 'evidence' && <EvidenceTab />}
            {activeTab === 'timeline' && <TimelineTab />}
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '14px 24px',
            borderTop: `1px solid ${TOKEN.border}`,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={13} color={TOKEN.textMuted} />
              <code style={{ fontSize: '0.8rem', color: TOKEN.textSub,
                background: 'rgba(30,41,59,0.9)', padding: '3px 9px',
                borderRadius: '5px', border: `1px solid ${TOKEN.border}` }}>
                {shortId}…
              </code>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {isPending && (
                <>
                  <FooterBtn
                    variant="approve" icon={loading ? Loader2 : CheckCircle} disabled={loading}
                    onClick={() => window.confirm('Approve this incident?') && handleStatusUpdate('approved')}
                  >
                    Approve
                  </FooterBtn>
                  <FooterBtn
                    variant="reject" icon={loading ? Loader2 : XCircle} disabled={loading}
                    onClick={() => window.confirm('Reject this incident?') && handleStatusUpdate('rejected')}
                  >
                    Reject
                  </FooterBtn>
                </>
              )}
              <FooterBtn variant="ghost" onClick={onClose}>Close</FooterBtn>
            </div>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '20px'
            }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: TOKEN.accent }} />
            </div>
          )}
        </div>
      </div>

      {/* Evidence lightbox */}
      {evidenceOpen && evidenceUrls.length > 0 && (
        <EvidenceViewer
          urls={evidenceUrls}
          index={evidenceIdx}
          onClose={() => setEvidenceOpen(false)}
          onNext={() => cycle(1)}
          onPrev={() => cycle(-1)}
        />
      )}
    </>
  );
};

export default AandBincidentModal;