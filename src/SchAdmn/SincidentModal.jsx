import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, AlertTriangle, User, GraduationCap, 
  Calendar, Clock, Shield, FileText, 
  CheckCircle, XCircle, Award, ExternalLink,
  Image, Eye, Loader2, Plus, Trash2, AlertCircle,
  Edit, Save, Download, ChevronLeft, ChevronRight
} from 'lucide-react';
import sTierUtils from './utils/stierUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

const SincidentModal = ({ 
  incidentData, 
  isOpen, 
  onClose, 
  onUpdate,
  onDelete,
  onEvidenceAdded 
}) => {
  const [activeView, setActiveView] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [punishmentData, setPunishmentData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    completed: false,
  });
  const [incidentDescription, setIncidentDescription] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showEvidenceViewer, setShowEvidenceViewer] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const fileInputRef = useRef(null);

  const evidenceUrls = sTierUtils.processEvidenceUrls(incidentData?.evidence_url) || [];
  const canModify = incidentData?.status === 'pending' && !incidentData?.is_deleted;
  const severityBadge = sTierUtils.getStierSeverityBadge();
  const statusBadge = sTierUtils.getStierStatusBadge(incidentData?.status);
  const hasPunishment = !!incidentData?.punishment_id;

  useEffect(() => {
    if (incidentData) {
      setIncidentDescription(incidentData.description || '');
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

  const showToast = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
    } else {
      setError(message);
    }
    
    setTimeout(() => {
      if (type === 'success') {
        setSuccess(null);
      } else {
        setError(null);
      }
    }, 5000);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 3 - evidenceUrls.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (filesToAdd.length < files.length) {
      showToast(`Only ${remainingSlots} file(s) can be added (max 3 total)`, 'error');
    }
    
    setEvidenceFiles(filesToAdd);
  }, [evidenceUrls.length, showToast]);

  const handleUploadEvidence = useCallback(async () => {
    if (evidenceFiles.length === 0) {
      showToast('Please select files to upload', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await sTierUtils.API.addEvidenceToStierIncident(
        incidentData.incident_id,
        evidenceFiles
      );
      
      if (result.success) {
        showToast('Evidence uploaded successfully');
        if (onEvidenceAdded) {
          onEvidenceAdded(result.data);
        }
        setEvidenceFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showToast(sanitizeErrorMessage(result.message, 'Failed to upload evidence'), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [evidenceFiles, incidentData?.incident_id, onEvidenceAdded, showToast]);

  const handleDeleteEvidence = useCallback(async (evidenceUrl) => {
    if (!window.confirm('Are you sure you want to delete this evidence?')) return;

    setLoading(true);
    try {
      const result = await sTierUtils.API.deleteEvidenceFromStierIncident(
        incidentData.incident_id,
        evidenceUrl
      );
      
      if (result.success) {
        showToast('Evidence deleted successfully');
        if (onEvidenceAdded) {
          onEvidenceAdded(result.data);
        }
      } else {
        showToast(sanitizeErrorMessage(result.message, 'Failed to delete evidence'), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [incidentData?.incident_id, onEvidenceAdded, showToast]);

  const handleReview = useCallback(async (action) => {
    if (action === 'reject') {
      if (!window.confirm('Are you sure you want to reject this S-tier incident? This action cannot be undone.')) {
        return;
      }
    }

    setLoading(true);
    try {
      const result = await sTierUtils.API.reviewStierIncident(
        incidentData.incident_id,
        action
      );
      
      if (result.success) {
        showToast(`Incident ${action}ed successfully`);
        if (onUpdate) {
          onUpdate(incidentData.incident_id, { 
            status: action === 'approve' ? 'approved' : 'rejected' 
          });
        }
        onClose();
      } else {
        showToast(sanitizeErrorMessage(result.message, `Failed to ${action} incident`), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [incidentData?.incident_id, onUpdate, onClose, showToast]);

  const handleUpdateIncident = useCallback(async () => {
    if (!incidentDescription.trim()) {
      showToast('Description is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await sTierUtils.API.updateStierIncident(
        incidentData.incident_id,
        incidentDescription
      );
      
      if (result.success) {
        showToast('Incident updated successfully');
        if (onUpdate) {
          onUpdate(incidentData.incident_id, { description: incidentDescription });
        }
      } else {
        showToast(sanitizeErrorMessage(result.message, 'Failed to update incident'), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [incidentDescription, incidentData?.incident_id, onUpdate, showToast]);

  const handleAddPunishment = useCallback(async () => {
    if (!punishmentData.name.trim()) {
      showToast('Punishment name is required', 'error');
      return;
    }
    if (!punishmentData.start_date || !punishmentData.end_date) {
      showToast('Start and end dates are required', 'error');
      return;
    }
    if (!sTierUtils.validateDateRange(punishmentData.start_date, punishmentData.end_date)) {
      showToast('End date must be after start date', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await sTierUtils.API.addPunishmentToStierIncident(
        incidentData.incident_id,
        punishmentData.name,
        punishmentData.start_date,
        punishmentData.end_date
      );
      
      if (result.success) {
        showToast('Punishment added successfully');
        if (onUpdate) {
          onUpdate(incidentData.incident_id, { hasPunishment: true });
        }
      } else {
        showToast(sanitizeErrorMessage(result.message, 'Failed to add punishment'), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [punishmentData, incidentData?.incident_id, onUpdate, showToast]);

  const handleUpdatePunishment = useCallback(async () => {
    setLoading(true);
    try {
      const updates = {};
      if (punishmentData.name) updates.name = punishmentData.name;
      if (punishmentData.start_date) updates.start_date = punishmentData.start_date;
      if (punishmentData.end_date) updates.end_date = punishmentData.end_date;
      updates.completed = punishmentData.completed;
      
      const result = await sTierUtils.API.updatePunishment(
        incidentData.punishment_id,
        updates
      );
      
      if (result.success) {
        showToast('Punishment updated successfully');
        if (onUpdate) {
          onUpdate(incidentData.incident_id, { punishmentUpdated: true });
        }
      } else {
        showToast(sanitizeErrorMessage(result.message, 'Failed to update punishment'), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [punishmentData, incidentData?.punishment_id, incidentData?.incident_id, onUpdate, showToast]);

  const handleSoftDelete = useCallback(async () => {
    setLoading(true);
    try {
      const result = await sTierUtils.API.softDeleteStierIncident(incidentData.incident_id);
      
      if (result.success) {
        showToast('Incident deleted successfully');
        if (onDelete) {
          onDelete(incidentData.incident_id);
        }
        onClose();
      } else {
        showToast(sanitizeErrorMessage(result.message, 'Failed to delete incident'), 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
    }
  }, [incidentData?.incident_id, onDelete, onClose, showToast]);

  const removeFile = useCallback((index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const nextEvidence = useCallback(() => {
    setSelectedEvidenceIndex((prev) => 
      prev < evidenceUrls.length - 1 ? prev + 1 : 0
    );
  }, [evidenceUrls.length]);

  const prevEvidence = useCallback(() => {
    setSelectedEvidenceIndex((prev) => 
      prev > 0 ? prev - 1 : evidenceUrls.length - 1
    );
  }, [evidenceUrls.length]);

  if (!isOpen || !incidentData) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Evidence Viewer Modal */}
      {showEvidenceViewer && evidenceUrls.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '2rem'
        }}>
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem'
          }}>
            <button
              onClick={() => setShowEvidenceViewer(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div style={{
            maxWidth: '90%',
            maxHeight: '80%',
            marginBottom: '1rem'
          }}>
            <img 
              src={evidenceUrls[selectedEvidenceIndex]} 
              alt={`Evidence ${selectedEvidenceIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/600x400/1e293b/94a3b8?text=Evidence+Not+Available';
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'white'
          }}>
            <button
              onClick={prevEvidence}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={24} />
            </button>
            
            <span style={{ fontSize: '0.9rem' }}>
              {selectedEvidenceIndex + 1} of {evidenceUrls.length}
            </span>
            
            <button
              onClick={nextEvidence}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
      
      {/* Main Modal */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.9)',
          borderRadius: '24px',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(24px)',
          animation: 'slideUp 0.3s ease'
        }}>
          {/* Modal Header */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            background: 'rgba(30, 41, 59, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: severityBadge.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${severityBadge.color}`
              }}>
                <AlertTriangle size={24} color={severityBadge.color} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f1f5f9',
                  marginBottom: '0.25rem'
                }}>
                  S-Tier Incident
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: severityBadge.bgColor,
                    color: severityBadge.color,
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: `1px solid ${severityBadge.color}20`
                  }}>
                    {severityBadge.label}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: statusBadge.bgColor,
                    color: statusBadge.color,
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: `1px solid ${statusBadge.color}20`
                  }}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Toast Messages */}
          {error && (
            <div style={{
              margin: '0 2rem',
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div style={{
              margin: '0 2rem',
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              color: '#86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}
          
          {/* Modal Content */}
          <div style={{
            padding: '2rem',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 200px)'
          }}>
            {/* Loading State */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '16px'
              }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
              </div>
            )}
            
            {/* View Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              paddingBottom: '0.5rem'
            }}>
              <button
                onClick={() => setActiveView('details')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeView === 'details' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : 'transparent',
                  border: activeView === 'details' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: activeView === 'details' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Details
              </button>
              <button
                onClick={() => setActiveView('evidence')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeView === 'evidence' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : 'transparent',
                  border: activeView === 'evidence' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: activeView === 'evidence' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Evidence ({evidenceUrls.length}/3)
              </button>
              <button
                onClick={() => setActiveView('punishment')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeView === 'punishment' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : 'transparent',
                  border: activeView === 'punishment' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: activeView === 'punishment' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Punishment
              </button>
              {canModify && (
                <button
                  onClick={() => setActiveView('actions')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeView === 'actions' 
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                      : 'transparent',
                    border: activeView === 'actions' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: activeView === 'actions' ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Actions
                </button>
              )}
            </div>
            
            {/* Details View */}
            {activeView === 'details' && (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Student Information */}
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#e2e8f0',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <User size={18} />
                    Student Information
                  </h3>
                  
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Student Name
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem' }}>
                          {incidentData.student_first_name} {incidentData.student_last_name}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Admission Number
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <GraduationCap size={16} />
                          {incidentData.admission_number}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Class
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem' }}>
                          {incidentData.class_name || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Student ID
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem', fontFamily: 'monospace' }}>
                          {incidentData.student_id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Incident Information */}
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#e2e8f0',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <AlertTriangle size={18} />
                    Incident Information
                  </h3>
                  
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Reported By
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem' }}>
                          {incidentData.reporter_first_name} {incidentData.reporter_last_name}
                          {incidentData.reporter_email && ` (${incidentData.reporter_email})`}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Reported Date
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} />
                          {sTierUtils.formatDate(incidentData.incident_created_at)}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Last Updated
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} />
                          {sTierUtils.formatDate(incidentData.incident_updated_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                        Description
                      </div>
                      {canModify ? (
                        <div>
                          <textarea
                            value={incidentDescription}
                            onChange={(e) => setIncidentDescription(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '8px',
                              color: '#f8fafc',
                              fontSize: '0.9rem',
                              resize: 'vertical',
                              minHeight: '100px'
                            }}
                            placeholder="Enter incident description..."
                          />
                          <button
                            onClick={handleUpdateIncident}
                            disabled={loading || !incidentDescription.trim()}
                            style={{
                              marginTop: '1rem',
                              padding: '0.75rem 1.5rem',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              cursor: loading || !incidentDescription.trim() ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              opacity: loading || !incidentDescription.trim() ? 0.7 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!loading && incidentDescription.trim()) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading && incidentDescription.trim()) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            {loading ? (
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Save size={16} />
                            )}
                            Update Description
                          </button>
                        </div>
                      ) : (
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontSize: '1rem',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          padding: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: '8px',
                          border: '1px solid rgba(148, 163, 184, 0.1)'
                        }}>
                          {incidentData.description || 'No description provided'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Evidence View */}
            {activeView === 'evidence' && (
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Image size={18} />
                  Evidence ({evidenceUrls.length}/3)
                </h3>
                
                {evidenceUrls.length === 0 ? (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    border: '1px dashed rgba(148, 163, 184, 0.2)',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                      No Evidence Attached
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      No evidence was attached to this S-tier incident report.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      {evidenceUrls.map((url, index) => (
                        <div 
                          key={index}
                          style={{
                            position: 'relative',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setSelectedEvidenceIndex(index);
                            setShowEvidenceViewer(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '150px',
                            background: 'rgba(30, 41, 59, 0.8)'
                          }}>
                            <img 
                              src={url} 
                              alt={`Evidence ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                background: 'linear-gradient(135deg, #1e293b, #0f172a)'
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8;">
                                    <FileText size={48} />
                                  </div>
                                `;
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              #{index + 1}
                            </div>
                          </div>
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(15, 23, 42, 0.9)',
                            borderTop: '1px solid rgba(148, 163, 184, 0.1)'
                          }}>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#e2e8f0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              Evidence {index + 1}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(url, '_blank');
                                }}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  background: 'rgba(139, 92, 246, 0.1)',
                                  border: '1px solid rgba(139, 92, 246, 0.2)',
                                  borderRadius: '6px',
                                  color: '#c4b5fd',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <ExternalLink size={12} />
                                Open
                              </button>
                              {canModify && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvidence(url);
                                  }}
                                  style={{
                                    padding: '0.5rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '6px',
                                    color: '#fca5a5',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => setShowEvidenceViewer(true)}
                        disabled={evidenceUrls.length === 0}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: evidenceUrls.length === 0 
                            ? 'rgba(148, 163, 184, 0.1)' 
                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: evidenceUrls.length === 0 ? '#94a3b8' : 'white',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          cursor: evidenceUrls.length === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          opacity: evidenceUrls.length === 0 ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (evidenceUrls.length > 0) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (evidenceUrls.length > 0) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        <Eye size={18} />
                        View Fullscreen Gallery
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Upload Section */}
                {canModify && evidenceUrls.length < 3 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Plus size={18} />
                      Upload New Evidence ({3 - evidenceUrls.length} slots remaining)
                    </h3>
                    
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        onChange={handleFileSelect}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: '2px dashed rgba(148, 163, 184, 0.3)',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          color: '#f8fafc',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          marginBottom: '1rem'
                        }}
                      />
                      
                      {evidenceFiles.length > 0 && (
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ 
                            color: '#cbd5e1', 
                            fontWeight: '600',
                            marginBottom: '0.75rem',
                            fontSize: '0.9rem'
                          }}>
                            Selected Files ({evidenceFiles.length})
                          </div>
                          {evidenceFiles.map((file, index) => (
                            <div 
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgba(30, 41, 59, 0.6)',
                                borderRadius: '6px',
                                marginBottom: '0.5rem'
                              }}
                            >
                              <div>
                                <div style={{ 
                                  color: '#f1f5f9', 
                                  fontSize: '0.85rem',
                                  marginBottom: '2px'
                                }}>
                                  {file.name}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                  {sTierUtils.formatFileSize(file.size)}
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  borderRadius: '4px',
                                  padding: '0.5rem',
                                  color: '#fca5a5',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={handleUploadEvidence}
                        disabled={loading || evidenceFiles.length === 0}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          background: loading || evidenceFiles.length === 0
                            ? 'rgba(148, 163, 184, 0.1)'
                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: loading || evidenceFiles.length === 0 ? '#94a3b8' : 'white',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          cursor: loading || evidenceFiles.length === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          opacity: loading || evidenceFiles.length === 0 ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && evidenceFiles.length > 0) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && evidenceFiles.length > 0) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {loading ? (
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Download size={16} />
                        )}
                        {loading ? 'Uploading...' : `Upload ${evidenceFiles.length} File(s)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Punishment View */}
            {activeView === 'punishment' && (
              <div>
                {hasPunishment ? (
                  <>
                    <div>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#e2e8f0',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <Shield size={18} />
                        Current Punishment
                      </h3>
                      
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                              Name
                            </div>
                            <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Award size={16} />
                              {incidentData.punishment_name}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                              Status
                            </div>
                            <div>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                background: '#dbeafe',
                                color: '#3b82f6',
                                borderRadius: '999px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                              }}>
                                {sTierUtils.getPunishmentStatusBadge(
                                  incidentData.punishment_completed,
                                  incidentData.punishment_end_date
                                ).label}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                              Start Date
                            </div>
                            <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={16} />
                              {sTierUtils.formatSimpleDate(incidentData.punishment_start_date)}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                              End Date
                            </div>
                            <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={16} />
                              {sTierUtils.formatSimpleDate(incidentData.punishment_end_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {canModify && (
                      <div style={{ marginTop: '2rem' }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#e2e8f0',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <Edit size={18} />
                          Update Punishment
                        </h3>
                        
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          border: '1px solid rgba(148, 163, 184, 0.1)'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#cbd5e1',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                Name
                              </label>
                              <input
                                type="text"
                                value={punishmentData.name}
                                onChange={(e) => setPunishmentData({...punishmentData, name: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  background: 'rgba(15, 23, 42, 0.8)',
                                  border: '1px solid rgba(148, 163, 184, 0.2)',
                                  borderRadius: '8px',
                                  color: '#f8fafc',
                                  fontSize: '0.9rem'
                                }}
                              />
                            </div>
                            
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#cbd5e1',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={punishmentData.completed}
                                  onChange={(e) => setPunishmentData({...punishmentData, completed: e.target.checked})}
                                  style={{ marginRight: '8px' }}
                                />
                                Mark as completed
                              </label>
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#cbd5e1',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={punishmentData.start_date}
                                onChange={(e) => setPunishmentData({...punishmentData, start_date: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  background: 'rgba(15, 23, 42, 0.8)',
                                  border: '1px solid rgba(148, 163, 184, 0.2)',
                                  borderRadius: '8px',
                                  color: '#f8fafc',
                                  fontSize: '0.9rem'
                                }}
                              />
                            </div>
                            
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#cbd5e1',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                End Date
                              </label>
                              <input
                                type="date"
                                value={punishmentData.end_date}
                                onChange={(e) => setPunishmentData({...punishmentData, end_date: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  background: 'rgba(15, 23, 42, 0.8)',
                                  border: '1px solid rgba(148, 163, 184, 0.2)',
                                  borderRadius: '8px',
                                  color: '#f8fafc',
                                  fontSize: '0.9rem'
                                }}
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={handleUpdatePunishment}
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1.5rem',
                              background: loading
                                ? 'rgba(148, 163, 184, 0.1)'
                                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              border: 'none',
                              borderRadius: '8px',
                              color: loading ? '#94a3b8' : 'white',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              opacity: loading ? 0.7 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            {loading ? (
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Save size={16} />
                            )}
                            {loading ? 'Updating...' : 'Update Punishment'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Shield size={18} />
                      No Punishment Assigned
                    </h3>
                    
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: '12px',
                      padding: '3rem 2rem',
                      border: '1px dashed rgba(148, 163, 184, 0.2)',
                      textAlign: 'center',
                      color: '#94a3b8'
                    }}>
                      <Award size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                        No punishment assigned to this incident
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
                        {canModify 
                          ? 'Add a punishment for this S-tier incident' 
                          : 'Only pending incidents can have punishments assigned'
                        }
                      </div>
                      
                      {canModify && (
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          maxWidth: '500px',
                          margin: '0 auto'
                        }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#e2e8f0',
                            marginBottom: '1.5rem'
                          }}>
                            Add New Punishment
                          </h4>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                              display: 'block',
                              color: '#cbd5e1',
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}>
                              Punishment Name *
                            </label>
                            <input
                              type="text"
                              value={punishmentData.name}
                              onChange={(e) => setPunishmentData({...punishmentData, name: e.target.value})}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '0.9rem'
                              }}
                              required
                            />
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#cbd5e1',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                Start Date *
                              </label>
                              <input
                                type="date"
                                value={punishmentData.start_date}
                                onChange={(e) => setPunishmentData({...punishmentData, start_date: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  background: 'rgba(15, 23, 42, 0.8)',
                                  border: '1px solid rgba(148, 163, 184, 0.2)',
                                  borderRadius: '8px',
                                  color: '#f8fafc',
                                  fontSize: '0.9rem'
                                }}
                                required
                              />
                            </div>
                            
                            <div>
                              <label style={{
                                display: 'block',
                                color: '#cbd5e1',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                              }}>
                                End Date *
                              </label>
                              <input
                                type="date"
                                value={punishmentData.end_date}
                                onChange={(e) => setPunishmentData({...punishmentData, end_date: e.target.value})}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  background: 'rgba(15, 23, 42, 0.8)',
                                  border: '1px solid rgba(148, 163, 184, 0.2)',
                                  borderRadius: '8px',
                                  color: '#f8fafc',
                                  fontSize: '0.9rem'
                                }}
                                required
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={handleAddPunishment}
                            disabled={loading || !punishmentData.name.trim() || !punishmentData.start_date || !punishmentData.end_date}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1.5rem',
                              background: loading || !punishmentData.name.trim() || !punishmentData.start_date || !punishmentData.end_date
                                ? 'rgba(148, 163, 184, 0.1)'
                                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              border: 'none',
                              borderRadius: '8px',
                              color: loading || !punishmentData.name.trim() || !punishmentData.start_date || !punishmentData.end_date
                                ? '#94a3b8' 
                                : 'white',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              cursor: loading || !punishmentData.name.trim() || !punishmentData.start_date || !punishmentData.end_date
                                ? 'not-allowed' 
                                : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              opacity: loading || !punishmentData.name.trim() || !punishmentData.start_date || !punishmentData.end_date
                                ? 0.7 
                                : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!loading && punishmentData.name.trim() && punishmentData.start_date && punishmentData.end_date) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading && punishmentData.name.trim() && punishmentData.start_date && punishmentData.end_date) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            {loading ? (
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Plus size={16} />
                            )}
                            {loading ? 'Adding...' : 'Add Punishment'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions View */}
            {activeView === 'actions' && canModify && (
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Shield size={18} />
                  Incident Actions
                </h3>
                
                {/* Review Actions */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#e2e8f0',
                    marginBottom: '1rem'
                  }}>
                    Review Incident
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Approve or reject this S-tier incident.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => handleReview('approve')}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1.5rem',
                        background: loading
                          ? 'rgba(148, 163, 184, 0.1)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: loading ? '#94a3b8' : 'white',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {loading ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                    
                    <button
                      onClick={() => handleReview('reject')}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1.5rem',
                        background: loading
                          ? 'rgba(148, 163, 184, 0.1)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: loading ? '#94a3b8' : 'white',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {loading ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
                
                {/* Delete Action */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#e2e8f0',
                    marginBottom: '1rem'
                  }}>
                    Delete Incident
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Soft delete this incident. This action can be undone by administrators.
                  </p>
                  
                  {showConfirmDelete ? (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Are you sure you want to soft delete this S-tier incident?
                      </p>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={handleSoftDelete}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            background: loading
                              ? 'rgba(148, 163, 184, 0.1)'
                              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: loading ? '#94a3b8' : 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {loading ? (
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          {loading ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        
                        <button
                          onClick={() => setShowConfirmDelete(false)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(148, 163, 184, 0.1)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#cbd5e1',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#fca5a5';
                      }}
                    >
                      <Trash2 size={16} />
                      Delete Incident
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Modal Footer */}
          <div style={{
            padding: '1.5rem 2rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Incident ID:
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.85rem', 
                color: '#cbd5e1',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                {incidentData.incident_id?.substring(0, 8)}...
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SincidentModal;