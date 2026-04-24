import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useStudent } from './StudentContext';
import {
  AlertCircle,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  X,
  Mail,
  Award
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import './Student.css';

const IncidentDetails = () => {
  const { incidentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const incidentType = searchParams.get('type') || 'personal';
  
  const {
    loading: contextLoading,
    error: contextError,
    selectedIncident: incident,
    fetchIncidentDetails
  } = useStudent();

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  
  useEffect(() => {
    if (incidentId) {
      fetchIncidentDetails(incidentId, incidentType).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId, incidentType]);

  const goBack = () => {
    navigate(-1);
  };

  const openImageGallery = (index) => {
    setImageIndex(index);
    setSelectedImage(incident.evidence_urls[index]);
  };

  const closeImageGallery = () => {
    setSelectedImage(null);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    const newIndex = (imageIndex + 1) % incident.evidence_urls.length;
    setImageIndex(newIndex);
    setSelectedImage(incident.evidence_urls[newIndex]);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const newIndex = (imageIndex - 1 + incident.evidence_urls.length) % incident.evidence_urls.length;
    setImageIndex(newIndex);
    setSelectedImage(incident.evidence_urls[newIndex]);
  };

  const isImageUrl = (url) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(url);
  };

  // Severity colors: S (highest) = RED, A (lowest) = PURPLE
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'S': return {
        bg: 'rgba(139, 92, 246, 0.2)',
        text: '#c4b5fd',
        border: 'rgba(139, 92, 246, 0.3)',
        icon: '#8b5cf6',
        label: 'S (Highest)'
      };
      case 'B': return {
        bg: 'rgba(245, 158, 11, 0.2)',
        text: '#fed7aa',
        border: 'rgba(245, 158, 11, 0.3)',
        icon: '#f59e0b',
        label: 'B'
      };
      case 'A': return {
        bg: 'rgba(16, 185, 129, 0.2)',
        text: '#86efac',
        border: 'rgba(16, 185, 129, 0.3)',
        icon: '#10b981',
        label: 'A (Lowest)'
      };
      default: return {
        bg: 'rgba(148, 163, 184, 0.2)',
        text: '#cbd5e1',
        border: 'rgba(148, 163, 184, 0.3)',
        icon: '#94a3b8',
        label: severity
      };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return {
        bg: 'rgba(34, 197, 94, 0.2)',
        text: '#bbf7d0',
        border: 'rgba(34, 197, 94, 0.3)'
      };
      case 'rejected': return {
        bg: 'rgba(239, 68, 68, 0.2)',
        text: '#fecaca',
        border: 'rgba(239, 68, 68, 0.3)'
      };
      case 'pending':
      default: return {
        bg: 'rgba(245, 158, 11, 0.2)',
        text: '#fed7aa',
        border: 'rgba(245, 158, 11, 0.3)'
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (contextLoading.details && !incident) {
    return (
      <div className="student-loading-screen">
        <div className="student-loader-content">
          <Loader2 size={48} className="student-spinner" />
          <p>Loading incident details...</p>
        </div>
      </div>
    );
  }

  const error = contextError;

  if (error || !incident) {
    return (
      <div className="student-loading-screen">
        <div className="student-error-state student-error-state--wide">
          <AlertCircle size={48} className="student-error-state-icon" />
          <h2 className="student-empty-state-title student-empty-state-title--error">
            Error Loading Incident
          </h2>
          <p className="student-error-state-desc">
            {error || 'Incident not found'}
          </p>
          <button onClick={goBack} className="student-btn student-btn-block">
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const severityColor = getSeverityColor(incident.severity);
  const statusColor = getStatusColor(incident.status);
  const imageUrls = incident.evidence_urls?.filter(url => isImageUrl(url)) || [];

  return (
    <>
      {selectedImage && (
        <div onClick={closeImageGallery} className="student-img-preview-overlay">
          <button onClick={closeImageGallery} className="student-img-preview-close">
            <X size={24} />
          </button>
          
          {imageUrls.length > 1 && (
            <>
              <button onClick={prevImage} className="student-gallery-nav student-gallery-nav-left">
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextImage} className="student-gallery-nav student-gallery-nav-right">
                <ChevronRight size={24} />
              </button>
              <div className="student-gallery-indicator">
                {imageIndex + 1} / {imageUrls.length}
              </div>
            </>
          )}
          
          <img src={selectedImage} alt="Evidence preview" className="student-img-preview-img" />
        </div>
      )}
      
      <div className="incident-details-container">
        <div className="student-details-header-wrapper">
          
          <button onClick={goBack} className="student-btn student-details-back-btn">
            <ArrowLeft size={18} />
            Back to Incidents
          </button>

          <div className="student-detail-card">
            
            <div className="student-detail-card-hero">
              <div className="student-detail-card-hero-top">
                <div>
                  <div className="student-detail-card-title-row">
                    <Shield size={24} color={severityColor.icon} />
                    <h1 className="student-detail-card-title">Incident Details</h1>
                  </div>
                  <div className="student-detail-badges">
                    <span
                      className="student-detail-badge"
                      style={{
                        background: severityColor.bg,
                        color: severityColor.text,
                        border: `1px solid ${severityColor.border}`
                      }}
                    >
                      Severity {severityColor.label}
                    </span>
                    
                    <span
                      className="student-detail-badge"
                      style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`
                      }}
                    >
                      {incident.status}
                    </span>
                    
                    <span
                      className={`student-detail-badge ${
                        incident.incident_type === 'personal'
                          ? 'student-detail-badge--personal'
                          : 'student-detail-badge--class'
                      }`}
                    >
                      {incident.incident_type === 'personal' ? 'Personal Incident' : 'Class Incident'}
                    </span>
                  </div>
                </div>
                
                <div className="student-details-id-wrapper">
                  <div className="student-details-id-label">Incident ID</div>
                  <div className="student-details-id-value">{incident.incident_id}</div>
                </div>
              </div>
            </div>

            <div className="student-details-content-pad">
              
              <div className="student-details-section">
                <h3 className="student-details-section-title">
                  <FileText size={18} color="#8b5cf6" />
                  Description
                </h3>
                <p className="student-details-desc-text">{incident.description}</p>
              </div>

              <div className="student-two-column">
                
                <div>
                  <h3 className="student-details-section-title-simple">People Involved</h3>
                  
                  {incident.student && (
                    <PersonCard
                      title="Student"
                      name={incident.student.full_name}
                      subtitle={incident.student.admission_number}
                      gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                    />
                  )}
                  
                  {incident.reported_by && (
                    <PersonCard
                      title="Reported By"
                      name={incident.reported_by.full_name}
                      subtitle={`Teacher • ${incident.reported_by.role}`}
                      email={incident.reported_by.email}
                      gradient="linear-gradient(135deg, #22c55e, #16a34a)"
                    />
                  )}
                  
                  {incident.assigned_by && (
                    <PersonCard
                      title="Punishment Assigned By"
                      name={incident.assigned_by.full_name}
                      subtitle={incident.assigned_by.role}
                      email={incident.assigned_by.email}
                      gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                    />
                  )}
                </div>

                <div>
                  <h3 className="student-details-section-title-simple">Context</h3>
                  
                  {incident.school && (
                    <ContextCard
                      title="School"
                      content={incident.school.school_name}
                      subtitle={incident.school.school_code}
                    />
                  )}
                  
                  {incident.class && (
                    <ContextCard
                      title="Class"
                      content={incident.class.class_name}
                    />
                  )}
                  
                  <div className="student-details-card">
                    <div className="student-details-label student-details-label--mb">Timeline</div>
                    <div className="student-details-timeline-row">
                      <div className="student-details-label">Created</div>
                      <div className="student-details-value">{formatDate(incident.incident_created_at)}</div>
                    </div>
                    <div>
                      <div className="student-details-label">Last Updated</div>
                      <div className="student-details-value">{formatDate(incident.incident_updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {incident.punishment && (
                <PunishmentCard punishment={incident.punishment} />
              )}

              {imageUrls.length > 0 && (
                <EvidenceGallery images={imageUrls} onImageClick={openImageGallery} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const PersonCard = ({ title, name, subtitle, email, gradient }) => (
  <div className="student-person-card">
    <div className="student-person-card-title">{title}</div>
    <div className="student-person-card-body">
      <div className="student-person-card-avatar" style={{ background: gradient }}>
        {name?.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="student-person-card-info">
        <div className="student-person-card-name">{name}</div>
        <div className="student-person-card-subtitle">{subtitle}</div>
        {email && (
          <div className="student-person-card-email">
            <Mail size={12} style={{ flexShrink: 0 }} />
            <span>{email}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const ContextCard = ({ title, content, subtitle }) => (
  <div className="student-person-card">
    <div className="student-person-card-title">{title}</div>
    <div className="student-person-card-name">{content}</div>
    {subtitle && <div className="student-person-card-subtitle">{subtitle}</div>}
  </div>
);

const PunishmentCard = ({ punishment }) => (
  <div className={`student-punishment-card-detail ${punishment.completed ? 'student-punishment-card-detail--complete' : 'student-punishment-card-detail--pending'}`}>
    <h3 className="student-punishment-card-title">
      <Award size={18} color={punishment.completed ? '#22c55e' : '#f59e0b'} />
      Punishment Details
    </h3>
    
    <div className="student-punishment-grid">
      <div>
        <div className="student-details-label">Punishment Name</div>
        <div className="student-punishment-name">{punishment.name}</div>
      </div>
      
      <div>
        <div className="student-details-label">Status</div>
        <span className={`student-punishment-status ${punishment.completed ? 'student-punishment-status--complete' : 'student-punishment-status--pending'}`}>
          {punishment.completed ? 'Completed' : 'Pending'}
        </span>
      </div>
      
      {punishment.start_date && (
        <div>
          <div className="student-details-label">Start Date</div>
          <div className="student-details-value">{new Date(punishment.start_date).toLocaleDateString()}</div>
        </div>
      )}
      
      {punishment.end_date && (
        <div>
          <div className="student-details-label">End Date</div>
          <div className="student-details-value">{new Date(punishment.end_date).toLocaleDateString()}</div>
        </div>
      )}
      
      {punishment.assigned_at && (
        <div>
          <div className="student-details-label">Assigned At</div>
          <div className="student-details-value">{new Date(punishment.assigned_at).toLocaleString()}</div>
        </div>
      )}
    </div>
  </div>
);

const EvidenceGallery = ({ images, onImageClick }) => (
  <div className="student-evidence-gallery">
    <h3 className="student-evidence-gallery-title">
      <ImageIcon size={18} color="#8b5cf6" />
      Evidence Images ({images.length})
    </h3>
    
    <div className="student-evidence-grid">
      {images.map((url, index) => (
        <div
          key={index}
          className="student-evidence-image"
          onClick={() => onImageClick(index)}
        >
          <img src={url} alt={`Evidence ${index + 1}`} className="student-evidence-img-fill" />
        </div>
      ))}
    </div>
  </div>
);

export default IncidentDetails;