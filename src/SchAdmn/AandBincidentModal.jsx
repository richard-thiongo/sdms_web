// AandBincidentModal.jsx
import React, { useState } from 'react';
import { 
  X, AlertTriangle, User, GraduationCap, 
  Calendar, Clock, Shield, FileText, 
  CheckCircle, XCircle, Award, ExternalLink,
  Image, Eye, Loader2
} from 'lucide-react';
import { 
  formatIncidentDate, formatPunishmentDate, 
  getSeverityBadge, getStatusBadge, getPunishmentStatus,
  processEvidenceUrls, getStudentInitials
} from './utils/incidentUtils';

const AandBincidentModal = ({ 
  incidentData, 
  isOpen, 
  onClose, 
  onUpdate,
  view = 'details'
}) => {
  const [activeView, setActiveView] = useState(view);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEvidenceViewer, setShowEvidenceViewer] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  
  const evidenceUrls = processEvidenceUrls(incidentData.evidence_url);
  
  // Format dates for display
  const formattedIncidentDate = formatIncidentDate(incidentData.incident_created_at || incidentData.created_at);
  const formattedPunishmentStartDate = formatPunishmentDate(incidentData.punishment_start_date);
  const formattedPunishmentEndDate = formatPunishmentDate(incidentData.punishment_end_date);
  
  // Get badge configurations
  const severityBadge = getSeverityBadge(incidentData.severity);
  const statusBadge = getStatusBadge(incidentData.status);
  const punishmentStatus = getPunishmentStatus({
    completed: incidentData.punishment_completed,
    end_date: incidentData.punishment_end_date
  });
  
  // Handle status update (only for pending incidents)
  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await onUpdate?.(incidentData.incident_id, newStatus);
      
      if (result && result.success) {
        onClose();
      } else {
        setError(result?.message || 'Failed to update incident status');
      }
    } catch (error) {
      console.error('Error updating incident status:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle evidence navigation
  const nextEvidence = () => {
    setSelectedEvidenceIndex((prev) => 
      prev < evidenceUrls.length - 1 ? prev + 1 : 0
    );
  };
  
  const prevEvidence = () => {
    setSelectedEvidenceIndex((prev) => 
      prev > 0 ? prev - 1 : evidenceUrls.length - 1
    );
  };
  
  if (!isOpen) return null;
  
  return (
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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
              ←
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
              →
            </button>
          </div>
        </div>
      )}
      
      {/* Main Modal */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.9)',
        borderRadius: '24px',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '900px',
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
                Incident Details
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
        
        {/* Modal Content */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 140px)'
        }}>
          {/* Error Display */}
          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
          
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
              Evidence ({evidenceUrls.length})
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeView === 'timeline' 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                  : 'transparent',
                border: activeView === 'timeline' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                color: activeView === 'timeline' ? 'white' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              Timeline
            </button>
          </div>
          
          {/* Details View */}
          {activeView === 'details' && (
            <div style={{ display: 'grid', gap: '2rem' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Description
                      </div>
                      <div style={{ 
                        color: '#f1f5f9', 
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {incidentData.description || 'No description provided'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Reported Date
                      </div>
                      <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} />
                        {formattedIncidentDate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {getStudentInitials(incidentData.student_first_name, incidentData.student_last_name)}
                    </div>
                    <div>
                      <div style={{ 
                        color: '#f1f5f9', 
                        fontWeight: '700',
                        fontSize: '1.25rem',
                        marginBottom: '0.25rem'
                      }}>
                        {incidentData.student_first_name} {incidentData.student_last_name}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <GraduationCap size={14} />
                        {incidentData.admission_number}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Student ID
                      </div>
                      <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                        {incidentData.student_id}
                      </div>
                    </div>
                    
                    {incidentData.class_name && (
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Class
                        </div>
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}>
                            {incidentData.class_name?.substring(0, 1)}
                          </div>
                          {incidentData.class_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Reporter Information */}
              {incidentData.reporter_first_name && (
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
                    Reporter Information
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
                          Reporter Name
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem' }}>
                          {incidentData.reporter_first_name} {incidentData.reporter_last_name}
                        </div>
                      </div>
                      
                      {incidentData.reporter_email && (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                            Email
                          </div>
                          <div style={{ color: '#f1f5f9', fontSize: '1rem' }}>
                            {incidentData.reporter_email}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Punishment Information */}
              {incidentData.punishment_name && (
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
                    Punishment Information
                  </h3>
                  
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: punishmentStatus.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${punishmentStatus.color}`
                        }}>
                          <Award size={20} color={punishmentStatus.color} />
                        </div>
                        <div>
                          <div style={{ 
                            color: '#f1f5f9', 
                            fontWeight: '700',
                            fontSize: '1.25rem'
                          }}>
                            {incidentData.punishment_name}
                          </div>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: punishmentStatus.bgColor,
                            color: punishmentStatus.color,
                            borderRadius: '999px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: `1px solid ${punishmentStatus.color}20`
                          }}>
                            {punishmentStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Start Date
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} />
                          {formattedPunishmentStartDate}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          End Date
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} />
                          {formattedPunishmentEndDate}
                        </div>
                      </div>
                    </div>
                    
                    {incidentData.assigned_by_first_name && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          Assigned By
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1rem' }}>
                          {incidentData.assigned_by_first_name} {incidentData.assigned_by_last_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                Evidence ({evidenceUrls.length})
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
                    No evidence was attached to this incident report.
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(url, '_blank');
                            }}
                            style={{
                              marginTop: '0.5rem',
                              width: '100%',
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
                            Open Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => setShowEvidenceViewer(true)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Eye size={18} />
                      View Fullscreen Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Timeline View */}
          {activeView === 'timeline' && (
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
                <Clock size={18} />
                Incident Timeline
              </h3>
              
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                position: 'relative'
              }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute',
                  left: '2rem',
                  top: '2rem',
                  bottom: '2rem',
                  width: '2px',
                  background: 'linear-gradient(to bottom, #8b5cf6, #3b82f6)'
                }} />
                
                {/* Timeline items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Incident Created */}
                  <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#8b5cf6',
                      border: '3px solid #0f172a',
                      position: 'absolute',
                      left: '1.9rem',
                      top: '4px',
                      zIndex: 1
                    }} />
                    <div style={{ marginLeft: '4rem' }}>
                      <div style={{ 
                        color: '#f1f5f9', 
                        fontWeight: '600',
                        fontSize: '1rem',
                        marginBottom: '0.25rem'
                      }}>
                        Incident Reported
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {formattedIncidentDate}
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                        Incident was reported by {incidentData.reporter_first_name || 'a teacher'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Updates - Only rejected (no approved) */}
                  {incidentData.status === 'rejected' && (
                    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        border: '3px solid #0f172a',
                        position: 'absolute',
                        left: '1.9rem',
                        top: '4px',
                        zIndex: 1
                      }} />
                      <div style={{ marginLeft: '4rem' }}>
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontWeight: '600',
                          fontSize: '1rem',
                          marginBottom: '0.25rem'
                        }}>
                          Incident Rejected
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          {incidentData.incident_updated_at ? formatIncidentDate(incidentData.incident_updated_at) : 'N/A'}
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                          Incident was reviewed and rejected by school administration
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Punishment Assigned */}
                  {incidentData.punishment_assigned_at && (
                    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '3px solid #0f172a',
                        position: 'absolute',
                        left: '1.9rem',
                        top: '4px',
                        zIndex: 1
                      }} />
                      <div style={{ marginLeft: '4rem' }}>
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontWeight: '600',
                          fontSize: '1rem',
                          marginBottom: '0.25rem'
                        }}>
                          Punishment Assigned
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          {formatIncidentDate(incidentData.punishment_assigned_at)}
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.9rel', marginBottom: '0.5rem' }}>
                          <strong>{incidentData.punishment_name}</strong> assigned by {incidentData.assigned_by_first_name || 'administrator'}
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                          Duration: {formattedPunishmentStartDate} to {formattedPunishmentEndDate}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Punishment Completed */}
                  {incidentData.punishment_completed && (
                    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '3px solid #0f172a',
                        position: 'absolute',
                        left: '1.9rem',
                        top: '4px',
                        zIndex: 1
                      }} />
                      <div style={{ marginLeft: '4rem' }}>
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontWeight: '600',
                          fontSize: '1rem',
                          marginBottom: '0.25rem'
                        }}>
                          Punishment Completed
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          {formattedPunishmentEndDate}
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                          Punishment was successfully completed by the student
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal Footer - Simplified (no edit/delete, only status actions for pending incidents) */}
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
            {/* Status Update Buttons for Pending Incidents Only */}
            {incidentData.status === 'pending' && (
              <>
                <button
                  onClick={() => {
                    if (window.confirm('Approve this incident? This will allow punishment assignment.')) {
                      handleStatusUpdate('approved');
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
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
                  onClick={() => {
                    if (window.confirm('Reject this incident?')) {
                      handleStatusUpdate('rejected');
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
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
              </>
            )}
            
            {/* Close Button */}
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
  );
};

export default AandBincidentModal;