// Teacher/TeacherModals.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTeacher } from './TeacherContext';
import {
  X, AlertTriangle, User, GraduationCap, Calendar, Shield,
  FileText, CheckCircle, Loader2, Search,
  ChevronLeft, ChevronRight, School, Upload,
  Trash2, Image, RefreshCw,Plus, Lock, Key, Eye, EyeOff
} from 'lucide-react';
import './Teacher.css';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const getSeverityColor = (s) => {
  if (s === 'A') return '#10b981'; // Green to match SchAdmn
  if (s === 'B') return '#f59e0b'; // Yellow
  if (s === 'S') return '#8b5cf6'; // Purple (Highest)
  return '#94a3b8';
};

const getSeverityLabel = (s) => {
  if (s === 'A') return 'Tier A – Major Incident';
  if (s === 'B') return 'Tier B – Moderate Incident';
  if (s === 'S') return 'Tier S – Severe Incident';
  return 'Unknown';
};

const getStatusBadge = (status) => {
  const map = {
    pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b',  label: 'Pending'  },
    approved: { bg: 'rgba(16,185,129,0.15)',   color: '#10b981',  label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.15)',    color: '#ef4444',  label: 'Rejected' },
  };
  return map[status] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: status || '—' };
};

const formatDate = (ds) => {
  if (!ds) return 'N/A';
  return new Date(ds).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const processEvidenceUrls = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  if (typeof data === 'string') return data.split(',').map(u => u.trim()).filter(Boolean);
  return [];
};

const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

const getFileTypeLabel = (url) => {
  if (!url) return 'File';
  const ext = url.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'Image';
  if (ext === 'pdf') return 'PDF Document';
  if (['mp4','mov','avi'].includes(ext)) return 'Video';
  if (['mp3','wav'].includes(ext)) return 'Audio';
  return 'Document';
};

// ─── Main component ───────────────────────────────────────────────────────────
const TeacherModals = ({ modalType, modalData, onClose, onOpenModal }) => {
  const {
    loading,
    searchStudents, assignStudent,
    reportIncident, reportClassIncident,
    fetchStudentDetails, fetchIncidentDetails, fetchClassIncidentDetails,
    uploadEvidence, removeEvidence,
    fetchSchoolClasses, schoolClasses,
    removeStudent,
    changeTeacherPassword,
    // Used to enrich detail responses — the detail endpoint has no student JOIN
    classIncidents, myIncidents, schoolIncidents,
  } = useTeacher();

  const [formData, setFormData] = useState({
    admission_number: '', first_name: '', last_name: '',
    severity: 'B', description: '', punishment_name: '',
    start_date: '', end_date: '', class_id: '',
    current_password: '', new_password: '', confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  const [classSearch, setClassSearch] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef(null);

  // ── Load details on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (modalData) {
      if (['studentDetails', 'incidentDetails', 'classIncidentDetails'].includes(modalType)) {
        loadDetails();
      }
    }
    if (modalType === 'reportClassIncident') fetchSchoolClasses();
    if (modalType === 'reportIncident' && modalData) {
      setFormData(prev => ({ ...prev, admission_number: modalData }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalType, modalData]);

  const loadDetails = async () => {
    try {
      if (modalType === 'studentDetails') {
        setSelectedItem(await fetchStudentDetails(modalData));
      } else if (modalType === 'incidentDetails') {
        const detail = await fetchIncidentDetails(modalData);
        // The detail endpoint (get_incident_details_simple) does NOT join the students table —
        // it only returns: severity, description, incident_date, evidence_urls, teacher_name,
        // punishment_name, status.
        // So we find the matching incident from the already-loaded list data in context
        // and merge its student fields (first_name, last_name, admission_number, class_name)
        // into the detail object so the Student Information section has data to display.
        const allIncidents = [...(classIncidents || []), ...(myIncidents || []), ...(schoolIncidents || [])];
        const match = allIncidents.find(i => i.incident_id === modalData);
        const enriched = match
          ? {
              ...detail,
              first_name:       detail.first_name       || match.first_name,
              last_name:        detail.last_name        || match.last_name,
              admission_number: detail.admission_number || match.admission_number,
              class_name:       detail.class_name       || match.class_name,
            }
          : detail;
        setSelectedItem(enriched);
      } else if (modalType === 'classIncidentDetails') {
        setSelectedItem(await fetchClassIncidentDetails(modalData));
      }
    } catch (e) { console.error('Load details error:', e); }
  };

  const handleSearch = async () => {
    if (!formData.admission_number.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchStudents(formData.admission_number);
      setSearchResults(results || []);
    } finally { setIsSearching(false); }
  };

  const handleChangePassword = async () => {
    if (formData.new_password !== formData.confirm_password) {
      alert("Passwords don't match");
      return;
    }
    try {
      await changeTeacherPassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async () => {
    try { await assignStudent(formData); onClose(); } catch (e) { console.error(e); }
  };

  const handleReportIncident = async () => {
    const payload = {
      admission_number: formData.admission_number.trim(),
      severity: formData.severity,
      description: formData.description.trim(),
      punishment_name: formData.punishment_name.trim(),
      start_date: formData.start_date || '',
      end_date: formData.end_date || '',
    };
    try { await reportIncident(payload); onClose(); } catch (e) { console.error(e); }
  };

  const handleReportClassIncident = async () => {
    if (!selectedClass) return alert('Please select a class');
    if (!formData.description.trim()) return alert('Description is required');
    const payload = {
      class_id: selectedClass.class_id,
      severity: formData.severity,
      description: formData.description.trim(),
    };
    if (formData.punishment_name.trim()) {
      payload.punishment_name = formData.punishment_name.trim();
      if (formData.start_date) payload.start_date = formData.start_date;
      if (formData.end_date) payload.end_date = formData.end_date;
    }
    try { await reportClassIncident(payload); onClose(); } catch (e) { console.error(e); }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setEvidenceFiles(prev => [...prev, ...files].slice(0, 3));
  };

  const handleUploadEvidence = async () => {
    if (evidenceFiles.length === 0) return;
    try { await uploadEvidence(modalData, evidenceFiles); onClose(); } catch (e) { console.error(e); }
  };

  const removeFile = (i) => setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i));

  const openLightbox = (urls, index) => {
    setLightboxUrl(urls);
    setLightboxIndex(index);
  };

  const filteredClasses = (schoolClasses || []).filter(c =>
    c.class_name?.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.class_teacher_name?.toLowerCase().includes(classSearch.toLowerCase())
  );

  // ── Render by modal type ──────────────────────────────────────────────────
  const renderContent = () => {
    switch (modalType) {
      case 'assignStudent':         return renderAssignStudent();
      case 'reportIncident':        return renderReportIncident();
      case 'reportClassIncident':   return renderReportClassIncident();
      case 'studentDetails':        return renderStudentDetails();
      case 'incidentDetails':       return renderIncidentDetails();
      case 'classIncidentDetails':  return renderClassIncidentDetails();
      case 'uploadEvidence':        return renderUploadEvidence();
      case 'changePassword':        return renderChangePassword();
      default: return null;
    }
  };

  // ── 1. Assign Student ─────────────────────────────────────────────────────
  const renderAssignStudent = () => (
    <div className="teacher-modal-container">
      <h2 className="teacher-modal-title-v2">Assign Student</h2>

      <div className="teacher-modal-section">
        <label className="teacher-modal-label">1. Search by Admission Number</label>
        <p className="teacher-modal-hint">Search to check if the student already exists</p>
        <div className="teacher-flex-gap-sm">
          <input
            className="teacher-modal-input"
            placeholder="Enter admission number"
            value={formData.admission_number}
            onChange={e => setFormData({ ...formData, admission_number: e.target.value })}
          />
          <button 
            className="teacher-modal-submit-btn teacher-search-btn-icon" 
            onClick={handleSearch} 
            disabled={isSearching}
          >
            {isSearching ? <Loader2 size={18} className="teacher-spin" /> : <Search size={18} />}
          </button>
        </div>
      </div>

      {/* Existing students found */}
      {searchResults.length > 0 && (
        <div className="teacher-modal-section">
          <label className="teacher-modal-label">Existing Students Found</label>
          <p className="teacher-modal-hint">Select a student to assign to your class:</p>
          <div className="teacher-results-container">
            {searchResults.map(s => (
              <div
                key={s.student_id}
                className="teacher-item-card teacher-result-item-flat"
                onClick={() => { setFormData({ ...formData, admission_number: s.admission_number }); }}
              >
                <div className="teacher-avatar teacher-avatar-indigo">{s.first_name?.charAt(0)}</div>
                <div className="teacher-item-info">
                  <div className="teacher-name">{s.first_name} {s.last_name}</div>
                  <div className="teacher-id">{s.admission_number}</div>
                  {s.class_name && <div className="teacher-incident-count" style={{ color: '#f59e0b', marginTop: '0.1rem' }}>Currently in: {s.class_name}</div>}
                </div>
                <ChevronRight size={18} color="#64748b" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New student form (no results found after search) */}
      {searchResults.length === 0 && formData.admission_number && (
        <div className="teacher-modal-section">
          <label className="teacher-modal-label">2. Create New Student</label>
          <p className="teacher-modal-hint">Student not found — enter their name to create a new record:</p>
          <input className="teacher-modal-input" style={{ marginBottom: '0.5rem' }} placeholder="First Name *"
            value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
          <input className="teacher-modal-input" placeholder="Last Name *"
            value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
        </div>
      )}

      <div className="teacher-modal-actions">
        <button className="teacher-modal-cancel-btn" onClick={onClose}>Cancel</button>
        <button
          className="teacher-modal-submit-btn"
          onClick={handleAssign}
          disabled={loading.assign || !formData.admission_number || (searchResults.length === 0 && (!formData.first_name || !formData.last_name))}
        >
          {loading.assign ? <Loader2 size={18} className="teacher-spin" /> : (searchResults.length === 0 ? 'Create & Assign' : 'Assign Student')}
        </button>
      </div>
    </div>
  );

  // ── 2. Report Student Incident ────────────────────────────────────────────
  const renderReportIncident = () => (
    <div className="teacher-modal-container">
      <h2 className="teacher-modal-title-v2">Report Student Incident</h2>

      {/* Step 1 – Student */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">1. Select Student</label>
        <p className="teacher-modal-hint">Search by admission number:</p>
        <div className="teacher-flex-gap-sm">
          <input
            className="teacher-modal-input"
            placeholder="Enter admission number"
            value={formData.admission_number}
            onChange={e => setFormData({ ...formData, admission_number: e.target.value })}
          />
          <button 
            className="teacher-modal-submit-btn teacher-search-btn-icon" 
            onClick={handleSearch} 
            disabled={isSearching}
          >
            {isSearching ? <Loader2 size={18} className="teacher-spin" /> : <Search size={18} />}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="teacher-results-container" style={{ marginTop: '0.75rem' }}>
            {searchResults.map(s => (
              <div
                key={s.student_id}
                className="teacher-item-card teacher-result-item-flat"
                style={{ background: formData.admission_number === s.admission_number ? 'rgba(139,92,246,0.15)' : 'transparent' }}
                onClick={() => { setFormData(p => ({ ...p, admission_number: s.admission_number })); setSearchResults([]); }}
              >
                <div className="teacher-avatar teacher-avatar-indigo">{s.first_name?.charAt(0)}</div>
                <div className="teacher-item-info">
                  <div className="teacher-name">{s.first_name} {s.last_name}</div>
                  <div className="teacher-id">{s.admission_number}</div>
                  {s.incident_count > 0 && <div className="teacher-incident-count" style={{ marginTop: '0.1rem' }}>{s.incident_count} incidents</div>}
                </div>
                <CheckCircle size={18} color="#8b5cf6" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 – Severity */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">2. Severity Level *</label>
        <div className="teacher-severity-card-stack">
          {[
            { key: 'A', color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'Serious offense requiring intermediate attention' },
            { key: 'B', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Minor offense requiring monitoring' },
            { key: 'S', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', desc: 'Severe offense — pending approval' },
          ].map(({ key, color, bg, desc }) => (
            <div
              key={key}
              className={`teacher-severity-option-card ${formData.severity === key ? `active-${key}` : ''}`}
              style={{ background: bg }}
              onClick={() => setFormData(p => ({ ...p, severity: key }))}
            >
              <div className="teacher-dot-indicator" style={{ background: color }} />
              <div style={{ flex: 1 }}>
                <div style={{ color, fontWeight: '700', fontSize: '0.95rem' }}>Tier {key}</div>
                <div className="teacher-modal-hint" style={{ marginTop: 0 }}>{desc}</div>
              </div>
              {formData.severity === key && <CheckCircle size={18} color={color} />}
            </div>
          ))}
        </div>
        {formData.severity === 'S' && (
          <div className="teacher-banner teacher-banner-info" style={{ marginTop: '0.75rem', padding: '0.85rem' }}>
            <AlertTriangle size={18} color="#8b5cf6" />
            <span style={{ fontSize: '0.85rem' }}>
              S-tier incidents are submitted for admin approval before being recorded.
            </span>
          </div>
        )}
        <p className="teacher-modal-hint" style={{ textAlign: 'center', marginTop: '0.5rem', fontStyle: 'italic' }}>Tier A: Serious offences • Tier B: Minor offences • Tier S: Severe / school-level</p>
      </div>

      {/* Step 3 – Description */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">3. Description *</label>
        <div style={{ position: 'relative' }}>
          <textarea
            className="teacher-modal-textarea"
            rows={5}
            placeholder="Describe what happened..."
            maxLength={2000}
            value={formData.description}
            onChange={e => { setFormData(p => ({ ...p, description: e.target.value })); setCharCount(e.target.value.length); }}
          />
          <span className="teacher-char-limit">{charCount}/2000</span>
        </div>
      </div>

      {/* Step 4 – Punishment (optional) */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">4. Punishment (Optional)</label>
        <div style={{ position: 'relative' }}>
          <Shield size={16} color="#94a3b8" className="teacher-input-icon" />
          <input
            className="teacher-modal-input teacher-input-with-icon"
            placeholder="Punishment name"
            value={formData.punishment_name}
            onChange={e => setFormData(p => ({ ...p, punishment_name: e.target.value }))}
          />
        </div>
        {/* Date row */}
        <div className="teacher-flex-row-gap">
          <div style={{ flex: 1 }}>
            <label className="teacher-modal-label" style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Start Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar 
                size={16} 
                color="#94a3b8" 
                className="teacher-input-icon" 
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  const input = e.currentTarget.nextElementSibling;
                  if (input && input.showPicker) input.showPicker();
                  else if (input) input.focus();
                }}
              />
              <input
                type="date"
                className="teacher-modal-input teacher-input-with-icon"
                value={formData.start_date}
                onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="teacher-modal-label" style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>End Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar 
                size={16} 
                color="#94a3b8" 
                className="teacher-input-icon" 
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  const input = e.currentTarget.nextElementSibling;
                  if (input && input.showPicker) input.showPicker();
                  else if (input) input.focus();
                }}
              />
              <input
                type="date"
                className="teacher-modal-input teacher-input-with-icon"
                value={formData.end_date}
                onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="teacher-modal-actions">
        <button className="teacher-modal-cancel-btn" onClick={onClose}>Cancel</button>
        <button
          className="teacher-modal-submit-btn"
          onClick={handleReportIncident}
          disabled={loading.report || !formData.admission_number || !formData.description.trim()}
        >
          {loading.report ? <Loader2 size={18} className="teacher-spin" /> : (formData.severity === 'S' ? 'Submit for Approval' : 'Report Incident')}
        </button>
      </div>
    </div>
  );

  // ── 3. Report Class Incident ──────────────────────────────────────────────
  const renderReportClassIncident = () => (
    <div className="teacher-modal-container">
      <h2 className="teacher-modal-title-v2">Report Class Incident</h2>
      <p className="teacher-modal-hint">Create a class-level incident report</p>

      {/* Class selector */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">Select Class *</label>
        <div 
          className="teacher-modal-input" 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', height: 'auto', padding: '0.85rem 1rem' }} 
          onClick={() => setShowClassPicker(!showClassPicker)}
        >
          {selectedClass ? (
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f8fafc', fontWeight: '600' }}>{selectedClass.class_name}</div>
              <div className="teacher-modal-hint" style={{ marginTop: 0 }}>{selectedClass.class_teacher_name}</div>
            </div>
          ) : (
            <span className="teacher-modal-hint" style={{ flex: 1 }}>Tap to select a class</span>
          )}
          <ChevronRight size={18} color="#94a3b8" />
        </div>

        {showClassPicker && (
          <div className="teacher-results-container" style={{ marginTop: '0.5rem', background: '#1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <Search size={15} color="#64748b" />
              <input
                className="teacher-search-input"
                style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                placeholder="Search classes..."
                value={classSearch}
                onChange={e => setClassSearch(e.target.value)}
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
              {filteredClasses.length === 0
                ? <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>No classes found</p>
                : filteredClasses.map(c => (
                  <div
                    key={c.class_id}
                    className="teacher-item-card teacher-result-item-flat"
                    style={{
                      background: selectedClass?.class_id === c.class_id ? 'rgba(139,92,246,0.15)' : 'transparent'
                    }}
                    onClick={() => { setSelectedClass(c); setFormData(p => ({ ...p, class_id: c.class_id })); setShowClassPicker(false); }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#f8fafc', fontWeight: '600' }}>{c.class_name}</div>
                      <div className="teacher-modal-hint" style={{ marginTop: 0 }}>{c.class_teacher_name || 'Not assigned'}</div>
                      <div style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>{c.student_count || 0} students</div>
                    </div>
                    {selectedClass?.class_id === c.class_id && <CheckCircle size={18} color="#8b5cf6" />}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Severity */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">Severity Level *</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['A', 'B'].map(key => (
            <div
              key={key}
              className={`teacher-severity-option-card ${formData.severity === key ? `active-${key}` : ''}`}
              style={{ flex: 1, flexDirection: 'column', background: 'rgba(30,41,59,0.5)' }}
              onClick={() => setFormData(p => ({ ...p, severity: key }))}
            >
              <div className="teacher-dot-indicator" style={{ background: getSeverityColor(key), marginBottom: '0.4rem' }} />
              <div style={{ color: formData.severity === key ? '#f8fafc' : '#94a3b8', fontWeight: '600', fontSize: '0.9rem' }}>Tier {key}</div>
              <div className="teacher-modal-hint" style={{ textAlign: 'center' }}>
                {key === 'A' ? 'High Priority' : 'Medium Priority'}
              </div>
            </div>
          ))}
        </div>
        <p className="teacher-modal-hint" style={{ textAlign: 'center', marginTop: '0.5rem', fontStyle: 'italic' }}>Tier A: Serious offences • Tier B: Minor offences</p>
      </div>

      {/* Description */}
      <div className="teacher-modal-section">
        <label className="teacher-modal-label">Description *</label>
        <div style={{ position: 'relative' }}>
          <textarea
            className="teacher-modal-textarea"
            rows={6}
            placeholder="Describe what happened with the class..."
            maxLength={2000}
            value={formData.description}
            onChange={e => { setFormData(p => ({ ...p, description: e.target.value })); setCharCount(e.target.value.length); }}
          />
          <span className="teacher-char-limit">{charCount}/2000</span>
        </div>
      </div>

      {/* Punishment (optional) */}
      <div className="teacher-modal-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <label className="teacher-modal-label" style={{ marginBottom: 0 }}>Punishment (Optional)</label>
        </div>
        <div style={{ position: 'relative' }}>
          <Shield size={16} color="#94a3b8" className="teacher-input-icon" />
          <input
            className="teacher-modal-input teacher-input-with-icon"
            placeholder="Punishment name"
            value={formData.punishment_name}
            onChange={e => setFormData(p => ({ ...p, punishment_name: e.target.value }))}
          />
        </div>
        <div className="teacher-flex-row-gap">
          <div style={{ flex: 1 }}>
            <label className="teacher-modal-label" style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Start Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar 
                size={16} 
                color="#94a3b8" 
                className="teacher-input-icon" 
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  const input = e.currentTarget.nextElementSibling;
                  if (input && input.showPicker) input.showPicker();
                  else if (input) input.focus();
                }}
              />
              <input 
                type="date" 
                className="teacher-modal-input teacher-input-with-icon" 
                value={formData.start_date}
                onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} 
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="teacher-modal-label" style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>End Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar 
                size={16} 
                color="#94a3b8" 
                className="teacher-input-icon" 
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  const input = e.currentTarget.nextElementSibling;
                  if (input && input.showPicker) input.showPicker();
                  else if (input) input.focus();
                }}
              />
              <input 
                type="date" 
                className="teacher-modal-input teacher-input-with-icon" 
                value={formData.end_date}
                onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} 
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="teacher-modal-actions">
        <button className="teacher-modal-cancel-btn" onClick={onClose}>Cancel</button>
        <button
          className="teacher-modal-submit-btn"
          onClick={handleReportClassIncident}
          disabled={loading.reportClass || !selectedClass || !formData.description.trim()}
        >
          {loading.reportClass ? <Loader2 size={18} className="teacher-spin" /> : 'Report Class Incident'}
        </button>
      </div>
    </div>
  );

  // ── 4. Student Details ────────────────────────────────────────────────────
  const renderStudentDetails = () => {
    if (!selectedItem) return <LoadingPane label="Loading student details..." onClose={onClose} />;

    const { student, incidents, stats } = selectedItem;
    if (!student) return <ErrorPane label="Student not found" onClose={onClose} />;

    return (
      <div className="teacher-details-root">
        {/* Profile card */}
        <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="teacher-profile-header">
            <div className="teacher-big-avatar">
              <span className="teacher-big-avatar-text">{student.first_name?.charAt(0)}{student.last_name?.charAt(0)}</span>
            </div>
            <div className="teacher-item-info">
              <div className="teacher-profile-name">{student.first_name} {student.last_name}</div>
              <div className="teacher-profile-sub">{student.admission_number}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                <School size={13} color="#94a3b8" />
                <span>{student.class_name || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', padding: '0.85rem', marginTop: '1rem', border: '1px solid rgba(148,163,184,0.05)' }}>
            {[
              { label: 'Total', value: stats?.total_incidents || 0, color: '#f8fafc' },
              { label: 'Tier A', value: stats?.severity_a_count || 0, color: 'var(--teacher-success)' },
              { label: 'Tier B', value: stats?.severity_b_count || 0, color: 'var(--teacher-warning)' },
              { label: 'Tier S', value: stats?.severity_s_count || 0, color: 'var(--teacher-primary)' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: s.color }}>{s.value}</div>
                  <div className="teacher-modal-hint" style={{ textTransform: 'uppercase' }}>{s.label}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: '1px', background: 'rgba(148,163,184,0.1)', margin: '0 0.5rem' }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
            <button 
              className="teacher-modal-submit-btn" 
              style={{ flex: 1, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
              onClick={() => { onClose(); setTimeout(() => onOpenModal('reportIncident', student.admission_number), 200); }}
            >
              <AlertTriangle size={18} color="white" /> Report
            </button>
            <button
              className="teacher-modal-cancel-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
              onClick={async () => {
                if (!window.confirm(`Remove ${student.first_name} ${student.last_name} from your class?`)) return;
                try { await removeStudent(student.admission_number); onClose(); } catch (e) { console.error(e); }
              }}
            >
              <User size={18} color="white" /> Remove
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="teacher-tab-container">
          <button 
            className={`teacher-tab-btn ${activeTab === 'details' ? 'teacher-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Student Info
          </button>
          <button 
            className={`teacher-tab-btn ${activeTab === 'incidents' ? 'teacher-tab-btn-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center' }}
            onClick={() => setActiveTab('incidents')}
          >
            Incidents {stats?.total_incidents > 0 && <span className="teacher-tab-count">{stats.total_incidents}</span>}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="teacher-details-grid" style={{ marginBottom: '1rem' }}>
            {[
              ['First Name', student.first_name],
              ['Last Name', student.last_name],
              ['Admission', student.admission_number],
              ['Class', student.class_name || 'Not assigned'],
            ].map(([lbl, val]) => (
              <div key={lbl} className="teacher-detail-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                <div className="teacher-modal-hint" style={{ textTransform: 'uppercase' }}>{lbl}</div>
                <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.9rem' }}>{val}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!incidents || incidents.length === 0 ? (
              <div className="teacher-empty-state" style={{ padding: '2rem' }}>
                <CheckCircle size={48} color="#10b981" />
                <p style={{ color: '#f8fafc', fontWeight: '600', marginTop: '1rem' }}>No incidents</p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>This student has a clean record</p>
              </div>
            ) : (
              incidents.map(inc => (
                <div
                  key={inc.incident_id}
                  className="teacher-item-card"
                  style={{ padding: '1rem', cursor: 'pointer' }}
                  onClick={() => { onClose(); setTimeout(() => onOpenModal('incidentDetails', inc.incident_id), 200); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }} >
                      <span style={{ background: getSeverityColor(inc.severity), color: 'white', fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>Tier {inc.severity}</span>
                      {inc.punishment_name && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Shield size={11} color="#10b981" /> Punishment</span>
                      )}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{formatDate(inc.created_at)}</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 0.65rem' }}>{inc.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {inc.reported_by_teacher && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}><FileText size={12} color="#64748b" /><span>By: {inc.reported_by_teacher}</span></div>
                    )}
                    {inc.evidence_urls?.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}><Image size={12} color="#64748b" /><span>{inc.evidence_urls.length} files</span></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button className="teacher-modal-cancel-btn" style={{ width: '100%', marginTop: '1.25rem' }} onClick={onClose}>Close</button>
      </div>
    );
  };

  // ── 5. Incident Details ───────────────────────────────────────────────────
  const renderIncidentDetails = () => {
    if (!selectedItem) return <LoadingPane label="Loading incident details..." onClose={onClose} />;

    const inc = selectedItem;
    const evidenceUrls = processEvidenceUrls(inc.evidence_urls);
    const imageUrls = evidenceUrls.filter(isImageUrl);
    const otherUrls = evidenceUrls.filter(u => !isImageUrl(u));
    const severity = inc.severity;
    const severityColor = getSeverityColor(severity);
    const statusBadge = getStatusBadge(inc.status);

    return (
      <div className="teacher-details-root">
        {/* Severity banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '14px', padding: '1rem',
          background: `${severityColor}15`,
          border: `1px solid ${severityColor}30`,
          marginBottom: '1rem'
        }}>
          <span style={{ background: severityColor, color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            TIER {severity}
          </span>
          <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', flex: 1 }}>
            {getSeverityLabel(severity)}
          </span>
          <span className={`teacher-status-badge`} style={{ background: statusBadge.bg, color: statusBadge.color }}>
            {statusBadge.label}
          </span>
        </div>

        {/* Refresh button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button className="teacher-action-btn" onClick={loadDetails}><RefreshCw size={16} /></button>
        </div>

        {/* Incident summary */}
        <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>Incident Summary</h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>{inc.description || 'No description provided'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <Calendar size={15} color="#94a3b8" />
            <span>{formatDate(inc.incident_date || inc.created_at)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <User size={15} color="#94a3b8" />
            <span>Reported by: {inc.teacher_name || inc.reported_by_teacher || 'Unknown'}</span>
          </div>
        </div>

        {/* Student info */}
        {(() => {
          const firstName = inc.first_name  || '';
          const lastName  = inc.last_name   || '';
          const fullName  = firstName || lastName ? `${firstName} ${lastName}`.trim() : '';
          const admission = inc.admission_number || '';
          const className = inc.class_name || '';
          const initials  = firstName
                            ? `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`
                            : '?';
          return (
            <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <h4 className="teacher-section-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Student Information</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="teacher-big-avatar" style={{ border: 'none' }}>
                  <span className="teacher-big-avatar-text">{initials.toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.1rem' }}>
                    {fullName || 'Unknown Student'}
                  </div>
                  {admission && (
                    <div className="teacher-modal-hint" style={{ marginTop: '0.15rem' }}>
                      {admission}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {fullName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <User size={15} color="#94a3b8" /> <span>{fullName}</span>
                  </div>
                )}
                {admission && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <GraduationCap size={15} color="#94a3b8" /> <span>{admission}</span>
                  </div>
                )}
                {className && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <School size={15} color="#94a3b8" /> <span>{className}</span>
                  </div>
                )}
                {!fullName && !admission && !className && (
                  <p className="teacher-modal-hint" style={{ fontStyle: 'italic' }}>Student information unavailable</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Punishment */}
        {inc.punishment_name && (
          <div className="teacher-item-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--teacher-success)', marginBottom: '1rem' }}>
            <h4 style={{ color: 'var(--teacher-success)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Assigned Punishment
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem' }}>{inc.punishment_name}</div>
                <div className="teacher-modal-hint" style={{ marginTop: '0.1rem' }}>Assigned as disciplinary action</div>
              </div>
            </div>
            {(inc.punishment_start_date || inc.start_date) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <Calendar size={15} color="#94a3b8" />
                <span>
                  {formatDate(inc.punishment_start_date || inc.start_date)}
                  {(inc.punishment_end_date || inc.end_date) && ` – ${formatDate(inc.punishment_end_date || inc.end_date)}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Evidence */}
        <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '700', margin: 0 }}>Evidence ({evidenceUrls.length})</h4>
            <button
              className="teacher-modal-submit-btn"
              style={{ padding: '0.4rem 0.85rem', width: 'auto', fontSize: '0.75rem', height: 'auto' }}
              onClick={() => { onClose(); setTimeout(() => onOpenModal('uploadEvidence', inc.incident_id), 200); }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {evidenceUrls.length > 0 ? (
            <>
              {imageUrls.length > 0 && (
                <div className="teacher-evidence-thumb-container">
                  {imageUrls.map((url, i) => (
                    <div 
                      key={i} 
                      className="teacher-evidence-thumb" 
                      onClick={() => openLightbox(imageUrls, i)}
                    >
                      <img src={url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
              {otherUrls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {otherUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="teacher-item-card teacher-file-link">
                      <div className="teacher-icon-box-sm">
                        <FileText size={18} color="white" />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {url.substring(url.lastIndexOf('/') + 1)}
                        </div>
                        <div className="teacher-modal-hint" style={{ fontSize: '0.72rem' }}>{getFileTypeLabel(url)}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '1.5rem', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(148,163,184,0.1)' }}>
              <Image size={32} color="#475569" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No evidence attached</p>
            </div>
          )}
        </div>

        <button className="teacher-modal-cancel-btn" style={{ width: '100%' }} onClick={onClose}>Close</button>
      </div>
    );
  };

  // ── 6. Class Incident Details ─────────────────────────────────────────────
  const renderClassIncidentDetails = () => {
    if (!selectedItem) return <LoadingPane label="Loading class incident details..." onClose={onClose} />;

    const inc = selectedItem;
    const evidenceUrls = processEvidenceUrls(inc.evidence_urls);
    const imageUrls = evidenceUrls.filter(isImageUrl);
    const otherUrls = evidenceUrls.filter(u => !isImageUrl(u));
    const severityColor = getSeverityColor(inc.severity);

    return (
      <div className="teacher-details-root">
        {/* Severity banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '14px', padding: '1rem',
          background: `${severityColor}15`,
          border: `1px solid ${severityColor}30`,
          marginBottom: '1rem'
        }}>
          <span style={{ background: severityColor, color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            TIER {inc.severity}
          </span>
          <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem' }}>
            {getSeverityLabel(inc.severity)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button className="teacher-action-btn" onClick={loadDetails}><RefreshCw size={16} /></button>
        </div>

        {/* Summary */}
        <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h4 className="teacher-section-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Class Incident Summary</h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>{inc.description || 'No description provided'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <Calendar size={15} color="#94a3b8" />
            <span>{formatDate(inc.incident_date || inc.created_at)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <User size={15} color="#94a3b8" />
            <span>Reported by: {inc.teacher_name || inc.reported_by_teacher || 'Unknown'}</span>
          </div>
        </div>

        {/* Class info */}
        <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h4 className="teacher-section-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Class Information</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="teacher-welcome-icon-box" style={{ width: '40px', height: '40px' }}>
              <School size={20} color="var(--teacher-primary)" />
            </div>
            <div>
              <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.1rem' }}>{inc.class_name}</div>
              <div className="teacher-modal-hint">Targeted Class Group</div>
            </div>
          </div>
        </div>

        {/* Punishment */}
        {inc.punishment_name && (
          <div className="teacher-item-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--teacher-success)', marginBottom: '1rem' }}>
            <h4 style={{ color: 'var(--teacher-success)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Assigned Punishment
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div>
                <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem' }}>{inc.punishment_name}</div>
                <div className="teacher-modal-hint" style={{ marginTop: '0.1rem' }}>Assigned as disciplinary action for this class</div>
              </div>
            </div>
          </div>
        )}

        {/* Evidence */}
        <div className="teacher-item-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '700', margin: 0 }}>Evidence ({evidenceUrls.length})</h4>
          </div>

          {evidenceUrls.length > 0 ? (
            <>
              {imageUrls.length > 0 && (
                <div className="teacher-evidence-thumb-container">
                  {imageUrls.map((url, i) => (
                    <div 
                      key={i} 
                      className="teacher-evidence-thumb" 
                      onClick={() => openLightbox(imageUrls, i)}
                    >
                      <img src={url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
              {otherUrls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {otherUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="teacher-item-card teacher-file-link">
                      <div className="teacher-icon-box-sm">
                        <FileText size={18} color="white" />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {url.substring(url.lastIndexOf('/') + 1)}
                        </div>
                        <div className="teacher-modal-hint" style={{ fontSize: '0.72rem' }}>{getFileTypeLabel(url)}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '1.5rem', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(148,163,184,0.1)' }}>
              <Image size={32} color="#475569" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No evidence attached</p>
            </div>
          )}
        </div>

        <button className="teacher-modal-cancel-btn" style={{ width: '100%' }} onClick={onClose}>Close</button>
      </div>
    );
  };

  // ── 7. Upload Evidence ────────────────────────────────────────────────────
  const renderUploadEvidence = () => (
    <div className="teacher-modal-container">
      <h2 className="teacher-modal-title-v2">Upload Evidence</h2>

      {/* Limit info bar */}
      <div className="teacher-banner teacher-banner-info" style={{ marginBottom: '1.25rem', padding: '0.85rem' }}>
        <Image size={18} color="var(--teacher-primary)" />
        <span style={{ fontSize: '0.85rem' }}>
          Maximum 3 images per incident. You can also remove existing ones.
        </span>
      </div>

      {/* Existing evidence thumbnails with remove */}
      {selectedItem?.evidence_urls?.length > 0 && (
        <div className="teacher-modal-section">
          <label className="teacher-modal-label">Existing Evidence ({processEvidenceUrls(selectedItem.evidence_urls).length}/3)</label>
          <div className="teacher-evidence-thumb-container" style={{ marginTop: '0.5rem' }}>
            {processEvidenceUrls(selectedItem.evidence_urls).map((url, i) => (
              <div key={i} style={{ position: 'relative', width: '90px', height: '90px' }}>
                <img src={url} alt={`Existing ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--teacher-border)' }} />
                <button
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--teacher-error)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  onClick={async () => {
                    if (!window.confirm('Remove this evidence?')) return;
                    try { await removeEvidence(modalData, url); await loadDetails(); } catch (e) { console.error(e); }
                  }}
                >
                  <X size={14} color="white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New files */}
      <div className="teacher-modal-section" style={{ borderTop: '1px solid var(--teacher-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
        <label className="teacher-modal-label">Upload New Images ({evidenceFiles.length} selected / {3 - (selectedItem?.evidence_urls?.length || 0)} remaining)</label>
        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          className="teacher-item-card"
          style={{ width: '100%', padding: '1.5rem', border: '2px dashed rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={evidenceFiles.length >= 3}
        >
          <Upload size={32} color="var(--teacher-primary)" />
          <span style={{ color: 'var(--teacher-primary)', fontWeight: '600', fontSize: '0.9rem' }}>Choose Images (Max 3)</span>
        </button>

        {evidenceFiles.length > 0 && (
          <div className="teacher-results-container" style={{ marginTop: '1rem', background: 'rgba(15,23,42,0.4)' }}>
            {evidenceFiles.map((file, i) => (
              <div 
                key={i} 
                className="teacher-item-card teacher-result-item-flat"
                style={{ background: 'transparent' }}
              >
                <Image size={18} color="var(--teacher-text-secondary)" />
                <span style={{ flex: 1, color: '#f8fafc', fontSize: '0.85rem' }}>{file.name}</span>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }} 
                  onClick={() => removeFile(i)}
                >
                  <Trash2 size={15} color="var(--teacher-error)" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="teacher-modal-actions" style={{ marginTop: '2rem' }}>
        <button className="teacher-modal-cancel-btn" onClick={onClose}>Cancel</button>
        <button
          className="teacher-modal-submit-btn"
          onClick={handleUploadEvidence}
          disabled={evidenceFiles.length === 0 || loading.upload}
        >
          {loading.upload ? <Loader2 size={18} className="teacher-spin" /> : `Upload (${evidenceFiles.length})`}
        </button>
      </div>
    </div>
  );

  // ── 8. Change Password ────────────────────────────────────────────────────
  const renderChangePassword = () => (
    <div className="teacher-modal-container">
      <h2 className="teacher-modal-title-v2">Change Password</h2>

      <div className="teacher-modal-section">
        <label className="teacher-modal-label">Current Password *</label>
        <div style={{ position: 'relative' }}>
          <Lock size={16} color="#94a3b8" className="teacher-input-icon" />
          <input
            type={showPasswords.current ? "text" : "password"}
            className="teacher-modal-input teacher-input-with-icon"
            placeholder="Enter current password"
            style={{ paddingRight: '2.5rem' }}
            value={formData.current_password}
            onChange={e => setFormData(p => ({ ...p, current_password: e.target.value }))}
          />
          <button
            type="button"
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
          >
            {showPasswords.current ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
          </button>
        </div>
      </div>

      <div className="teacher-modal-section">
        <label className="teacher-modal-label">New Password *</label>
        <div style={{ position: 'relative' }}>
          <Key size={16} color="#94a3b8" className="teacher-input-icon" />
          <input
            type={showPasswords.new ? "text" : "password"}
            className="teacher-modal-input teacher-input-with-icon"
            placeholder="Enter new password (min 8 characters)"
            style={{ paddingRight: '2.5rem' }}
            value={formData.new_password}
            onChange={e => setFormData(p => ({ ...p, new_password: e.target.value }))}
          />
          <button
            type="button"
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
          >
            {showPasswords.new ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
          </button>
        </div>
      </div>

      <div className="teacher-modal-section">
        <label className="teacher-modal-label">Confirm New Password *</label>
        <div style={{ position: 'relative' }}>
          <CheckCircle size={16} color="#94a3b8" className="teacher-input-icon" />
          <input
            type={showPasswords.confirm ? "text" : "password"}
            className="teacher-modal-input teacher-input-with-icon"
            placeholder="Confirm new password"
            style={{ paddingRight: '2.5rem' }}
            value={formData.confirm_password}
            onChange={e => setFormData(p => ({ ...p, confirm_password: e.target.value }))}
          />
          <button
            type="button"
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
          >
            {showPasswords.confirm ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
          </button>
        </div>
      </div>

      <div className="teacher-modal-actions">
        <button className="teacher-modal-cancel-btn" onClick={onClose}>Cancel</button>
        <button
          className="teacher-modal-submit-btn"
          onClick={handleChangePassword}
          disabled={loading.password || !formData.current_password || !formData.new_password || !formData.confirm_password}
        >
          {loading.password ? <Loader2 size={18} className="teacher-spin" /> : 'Update Password'}
        </button>
      </div>
    </div>
  );

  // ── Lightbox viewer ───────────────────────────────────────────────────────
  if (lightboxUrl) {
    return (
      <div className="teacher-lightbox-overlay" onClick={() => setLightboxUrl(null)}>
        <button 
          className="teacher-lightbox-close" 
          onClick={() => setLightboxUrl(null)}
        >
          <X size={24} />
        </button>
        {lightboxUrl.length > 1 && (
          <>
            <button 
              className="teacher-lightbox-nav teacher-lightbox-nav-left"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i > 0 ? i - 1 : lightboxUrl.length - 1)); }}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              className="teacher-lightbox-nav teacher-lightbox-nav-right"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i < lightboxUrl.length - 1 ? i + 1 : 0)); }}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        <img src={lightboxUrl[lightboxIndex]} alt={`Evidence ${lightboxIndex + 1}`} className="teacher-lightbox-img" onClick={e => e.stopPropagation()} />
        <p className="teacher-lightbox-caption">
          {lightboxIndex + 1} / {lightboxUrl.length}
        </p>
      </div>
    );
  }

  // ── Overlay wrapper ───────────────────────────────────────────────────────
  return (
    <div className="teacher-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="teacher-modal-content">
        <button className="teacher-modal-close-btn" onClick={onClose}><X size={18} /></button>



        <div className="teacher-modal-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// ── Utility sub-components ────────────────────────────────────────────────────
const LoadingPane = ({ label, onClose }) => (
  <div className="teacher-pane-container">
    <Loader2 size={40} color="var(--teacher-primary)" className="teacher-spin" />
    <p className="teacher-pane-text">{label}</p>
    <button className="teacher-modal-cancel-btn" style={{ marginTop: '1.25rem' }} onClick={onClose}>Cancel</button>
  </div>
);

const ErrorPane = ({ label, onClose }) => (
  <div className="teacher-pane-container">
    <AlertTriangle size={48} color="var(--teacher-error)" style={{ margin: '0 auto' }} />
    <p className="teacher-pane-text teacher-pane-text-error">{label}</p>
    <button className="teacher-modal-cancel-btn" style={{ marginTop: '1.25rem' }} onClick={onClose}>Go Back</button>
  </div>
);

// Styles object M is removed as we now use Teacher.css

export default TeacherModals;
