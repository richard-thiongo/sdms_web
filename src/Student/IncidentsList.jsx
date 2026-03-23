import { useNavigate } from 'react-router-dom';
import { useStudent } from './StudentContext';
import {
  AlertCircle, CheckCircle, Filter,
  Loader2, RefreshCw, ChevronDown,
  ChevronUp, Shield, Award,
  Eye, ArrowLeft, X, Search
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import './Student.css';

const IncidentsList = ({ type = 'personal' }) => {
  const navigate = useNavigate();
  const {
    loading: contextLoading,
    incidents,
    pagination,
    fetchIncidents
  } = useStudent();
  
  const [studentInfo, setStudentInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [filters, setFilters] = useState({
    severity: '',
    search: '',
    page: 1,
    perPage: 20
  });
  
  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await fetchIncidents(type, filters);
      if (data && type === 'personal' && data.student) {
        setStudentInfo(data.student);
      }
      if (data && type === 'class' && data.class) {
        setClassInfo(data.class);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [fetchIncidents, type, filters]);

  const handleSearchChange = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };


  const viewDetails = (incidentId, incidentType) => {
    navigate(`/student/incident/${incidentId}?type=${incidentType || type}`);
  };

  const goBack = () => {
    navigate('/student/dashboard');
  };

  const openImagePreview = (e, url) => {
    e.stopPropagation();
    setPreviewImage(url);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Severity colors: S (highest) = RED, A (lowest) = PURPLE




  if (contextLoading.incidents && incidents.length === 0) {
    return (
      <div className="student-loading-screen">
        <div className="student-loader-content">
          <Loader2 size={48} className="student-spinner" />
          <p>Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {previewImage && (
        <div
          onClick={closeImagePreview}
          className="student-img-preview-overlay"
        >
          <button
            onClick={closeImagePreview}
            className="student-img-preview-close"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="Evidence preview"
            className="student-img-preview-img"
          />
        </div>
      )}
      
      <div className="incidents-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        
        <button
          onClick={() => setShowFilters(true)}
          className="student-mobile-filter-btn"
        >
          <Filter size={24} />
        </button>

        {showFilters && (
          <div className="filters-panel">
            <div className="student-filters-panel-header">
              <h2 className="student-filters-panel-title">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="student-filters-panel-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="student-filter-label">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => {
                  handleFilterChange('severity', e.target.value);
                  setShowFilters(false);
                }}
                className="student-filter-select"
              >
                <option value="">All Severities</option>
                <option value="S">Severity S (Highest)</option>
                <option value="B">Severity B</option>
                <option value="A">Severity A (Lowest)</option>
              </select>
            </div>
            
            <button
              onClick={() => {
                handleFilterChange('severity', '');
                setShowFilters(false);
              }}
              className="student-filter-clear-btn"
            >
              Clear Filter
            </button>
          </div>
        )}
        
        <div className="student-content-container">
          <button
            onClick={goBack}
            className="student-back-btn"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="student-page-header-row">
            <div>
              <h1 className="student-page-title">
                {type === 'personal' && 'My Personal Incidents'}
                {type === 'class' && 'Class Incidents'}
                {type === 'all' && 'All Incidents'}
              </h1>
              
              {type === 'personal' && studentInfo && (
                <p className="student-page-subtitle">
                  Viewing incidents for {studentInfo.full_name} ({studentInfo.admission_number})
                </p>
              )}
              {type === 'class' && classInfo && (
                <p className="student-page-subtitle">
                  Viewing incidents for {classInfo.class_name}
                </p>
              )}
            </div>

           <div className="student-toolbar-container">
             <div className="student-search-container">
               <Search size={16} color="#64748b" className="student-search-icon" />
               <input
                 type="text"
                 placeholder="Search incidents..."
                 value={filters.search}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 className="student-search-input"
               />
             </div>

             <div className="student-toolbar-actions">
               <button
                 onClick={() => setShowFilters(!showFilters)}
                 className="student-toolbar-btn"
               >
                 <Filter size={16} />
                 <span className="desktop-only" style={{ marginLeft: '0.25rem' }}>Filters</span>
                 {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </button>
               
               <button
                 onClick={handleRefresh}
                 disabled={refreshing}
                 className="student-toolbar-btn"
               >
                 <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                 <span className="desktop-only">Refresh</span>
               </button>
             </div>
           </div>

           {showFilters && (
             <div className="student-filter-desktop-container">
               <div className="student-filter-desktop-group">
                 <label className="student-filter-desktop-label">Severity Level</label>
                 <select
                   value={filters.severity}
                   onChange={(e) => handleFilterChange('severity', e.target.value)}
                   className="student-filter-desktop-select"
                 >
                   <option value="">All Severities</option>
                   <option value="S">Severity S</option>
                   <option value="B">Severity B</option>
                   <option value="A">Severity A</option>
                 </select>
               </div>
             </div>
           )}

           <div className="student-incidents-count">
             <span>Showing {incidents.length} of {pagination.total} incidents</span>
           </div>
         </div>

         <div className="student-content-centered">
           {error ? (
             <ErrorState error={error} onRetry={handleRefresh} />
           ) : incidents.length === 0 ? (
             <EmptyState
               type={type}
               hasFilter={!!filters.severity || !!filters.search}
               onClearFilter={() => setFilters(prev => ({ ...prev, severity: '', search: '', page: 1 }))}
             />
           ) : (
             <div className="student-incident-list-col">
               {incidents.map(incident => (
                 <IncidentCard
                   key={incident.incident_id}
                   incident={incident}
                   type={type}
                   onClick={() => viewDetails(incident.incident_id, incident.incident_type || type)}
                   onImageClick={openImagePreview}
                 />
               ))}
             </div>
           )}

           {pagination.totalPages > 1 && (
             <Pagination
               page={pagination.page}
               totalPages={pagination.totalPages}
               onPageChange={handlePageChange}
             />
           )}
         </div>
       </div>
     </div>
    </>
  );
};

const IncidentCard = ({ incident, type, onClick, onImageClick }) => {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'S': return { background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }; // Purple (Highest)
      case 'B': return { background: 'rgba(245, 158, 11, 0.2)', color: '#fed7aa' }; // Yellow
      case 'A': return { background: 'rgba(16, 185, 129, 0.2)', color: '#86efac' }; // Green (Lowest)
      default: return { background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return { background: 'rgba(34, 197, 94, 0.2)', color: '#bbf7d0' };
      case 'rejected': return { background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' };
      default: return { background: 'rgba(245, 158, 11, 0.2)', color: '#fed7aa' };
    }
  };

  const severityStyle = getSeverityStyle(incident.severity);
  const statusStyle = getStatusStyle(incident.status);

  const isImageUrl = (url) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(url);
  };

  return (
    <div
      className="student-incident-card"
      onClick={onClick}
    >
      <div className="student-incident-card-header">
        <div className="student-incident-flex-row">
          <span 
            className="student-badge-base"
            style={{ ...severityStyle, border: `1px solid ${severityStyle.background.replace('0.2', '0.3')}` }}
          >
            Severity {incident.severity} {incident.severity === 'S' ? '(Highest)' : incident.severity === 'A' ? '(Lowest)' : ''}
          </span>
          
          {incident.status && (
            <span 
              className="student-badge-base"
              style={{ ...statusStyle, border: `1px solid ${statusStyle.background.replace('0.2', '0.3')}` }}
            >
              {incident.status}
            </span>
          )}
          
          {type === 'all' && incident.incident_type && (
            <span className={incident.incident_type === 'personal' ? 'student-badge-personal' : 'student-badge-class'}>
              {incident.incident_type === 'personal' ? 'Personal' : 'Class'}
            </span>
          )}
        </div>
      </div>
      
      <p className="student-incident-desc">
        {incident.description}
      </p>
      
      {incident.evidence_urls && incident.evidence_urls.length > 0 && (
        <div className="student-evidence-list">
          {incident.evidence_urls.map((url, index) => {
            if (isImageUrl(url)) {
              return (
                <div
                  key={index}
                  className="student-evidence-thumbnail"
                  onClick={(e) => onImageClick(e, url)}
                >
                  <img
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="student-evidence-img"
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      
      <div className="student-incident-footer">
        <div className="student-incident-footer-left">
          {incident.reported_by && (
            <div className="student-incident-reported-by">
              <Shield size={12} />
              Reported by: {incident.reported_by.full_name}
            </div>
          )}
          
          {incident.punishment && (
            <div className="student-incident-punishment" style={{ color: incident.punishment.completed ? '#86efac' : '#fca5a5' }}>
              <Award size={12} />
              {incident.punishment.name} - {incident.punishment.completed ? 'Completed' : 'Pending'}
            </div>
          )}
        </div>
        
        <div className="student-incident-view-details">
          <Eye size={14} />
          <span>View Details</span>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ type, hasFilter, onClearFilter }) => (
  <div className="student-empty-state">
    <CheckCircle size={48} className="student-empty-state-icon" />
    <h3 className="student-empty-state-title">
      No Incidents Found
    </h3>
    <p className="student-empty-state-desc" style={{ marginBottom: hasFilter ? '1.5rem' : 0 }}>
      {hasFilter 
        ? `No ${type} incidents with the selected filter found.` 
        : `No ${type} incidents have been recorded yet.`}
    </p>
    {hasFilter && (
      <button
        onClick={onClearFilter}
        className="student-btn"
      >
        Clear Filter
      </button>
    )}
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="student-error-state">
    <AlertCircle size={48} className="student-error-state-icon" />
    <p className="student-error-state-desc">{error}</p>
    <button
      onClick={onRetry}
      className="student-btn"
    >
      Try Again
    </button>
  </div>
);

const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="student-pagination pagination-mobile">
    <button
      onClick={() => onPageChange(page - 1)}
      disabled={page === 1}
      className="student-pagination-btn"
    >
      Previous
    </button>
    
    <span className="student-pagination-info">
      {page} of {totalPages}
    </span>
    
    <button
      onClick={() => onPageChange(page + 1)}
      disabled={page === totalPages}
      className="student-pagination-btn"
    >
      Next
    </button>
  </div>
);

export default IncidentsList;