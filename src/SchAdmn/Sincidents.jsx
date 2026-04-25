import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  AlertTriangle, Search, Filter, RefreshCw, Loader2, 
  AlertCircle, Calendar, Eye, Shield,
  GraduationCap, FileText, CheckCircle,
  XCircle, ChevronDown, ChevronUp,
  Clock, User,
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Award as AwardIcon
} from 'lucide-react';
import SincidentModal from './SincidentModal';
import sTierUtils from './utils/stierUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

const Sincidents = () => {
  // State for incidents data
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    initial: true,
    refresh: false,
    action: false
  });
  
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    statusFilter: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // Expanded sections
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 1,
  });
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  
  // Add toast
  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
    
    return id;
  }, []);
  
  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // UseMemo to compute filtered incidents efficiently
  const computedFilteredIncidents = useMemo(() => {
    let result = [...incidents];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(incident => {
        const studentName = `${incident.student_first_name || ''} ${incident.student_last_name || ''}`.toLowerCase();
        const admissionNumber = incident.admission_number?.toLowerCase() || '';
        const className = incident.class_name?.toLowerCase() || '';
        
        return (
          studentName.includes(searchTerm) ||
          admissionNumber.includes(searchTerm) ||
          className.includes(searchTerm)
        );
      });
    }
    
    // Apply status filter
    if (filters.statusFilter !== 'all') {
      result = result.filter(incident => incident.status === filters.statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'student':
          aValue = `${a.student_first_name || ''} ${a.student_last_name || ''}`.toLowerCase();
          bValue = `${b.student_first_name || ''} ${b.student_last_name || ''}`.toLowerCase();
          break;
        case 'class':
          aValue = a.class_name?.toLowerCase() || '';
          bValue = b.class_name?.toLowerCase() || '';
          break;
        case 'status':
          const statusOrder = { 'pending': 0, 'approved': 1, 'rejected': 2 };
          aValue = statusOrder[a.status] || 3;
          bValue = statusOrder[b.status] || 3;
          break;
        case 'date':
        default:
          aValue = new Date(a.incident_created_at || a.created_at || 0);
          bValue = new Date(b.incident_created_at || b.created_at || 0);
          break;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return result;
  }, [incidents, filters]);
  
  // Update filtered incidents when computed value changes
  useEffect(() => {
    setFilteredIncidents(computedFilteredIncidents);
  }, [computedFilteredIncidents]);
  
  // Fetch incidents
  const fetchIncidents = useCallback(async (page = 1, showLoading = true) => {
    if (showLoading) {
      setLoading(prev => ({ ...prev, initial: true }));
    }
    setError(null);
    
    try {
      const result = await sTierUtils.API.getStierIncidents({
        page,
        per_page: pagination.per_page,
        status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
      });
      
      if (result.success) {
        const incidentsList = result.data?.incidents || [];
        setIncidents(incidentsList);
        setPagination(result.data?.pagination || {
          page: 1,
          per_page: 20,
          total: 0,
          total_pages: 1,
        });
        
        if (showLoading && incidentsList.length > 0) {
          addToast('S-tier incidents loaded successfully', 'success');
        }
      } else {
        setError(sanitizeErrorMessage(result.message, 'Failed to load incidents'));
        addToast(sanitizeErrorMessage(result.message, 'Failed to load incidents'), 'error');
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Network error. Please try again.');
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        initial: false, 
        refresh: false 
      }));
    }
  }, [filters.statusFilter, pagination.per_page, addToast]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    handleFilterChange('search', value);
  }, [handleFilterChange]);
  
  // Refresh data
  const handleRefresh = useCallback(() => {
    setLoading(prev => ({ ...prev, refresh: true }));
    fetchIncidents(pagination.page, false);
  }, [fetchIncidents, pagination.page]);
  
  // Open incident modal
  const openIncidentModal = useCallback((incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  }, []);
  
  // Close incident modal
  const closeIncidentModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  }, []);
  
  // Handle incident update
  const handleIncidentUpdate = useCallback((incidentId, updates) => {
    setIncidents(prev => prev.map(incident =>
      incident.incident_id === incidentId
        ? { ...incident, ...updates }
        : incident
    ));
    
    if (updates.hasPunishment || updates.punishmentUpdated) {
      fetchIncidents(pagination.page, false);
    }
  }, [fetchIncidents, pagination.page]);
  
  // Handle incident delete
  const handleIncidentDelete = useCallback((incidentId) => {
    setIncidents(prev => prev.filter(incident => incident.incident_id !== incidentId));
    addToast('Incident deleted successfully', 'success');
  }, [addToast]);
  
  // Handle evidence added
  const handleEvidenceAdded = useCallback((updatedIncident) => {
    setIncidents(prev => prev.map(incident =>
      incident.incident_id === updatedIncident.incident_id
        ? { ...incident, evidence_url: updatedIncident.evidence_url }
        : incident
    ));
  }, []);
  
  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages && newPage !== pagination.page) {
      fetchIncidents(newPage);
    }
  }, [pagination.page, pagination.total_pages, fetchIncidents]);
  
  // Calculate statistics
  const stats = {
    total: pagination.total,
    pending: incidents.filter(i => i.status === 'pending').length,
    approved: incidents.filter(i => i.status === 'approved').length,
    rejected: incidents.filter(i => i.status === 'rejected').length,
  };
  
  // Initial fetch
  useEffect(() => {
    fetchIncidents(1);
  }, [fetchIncidents]);

  // Toast Component
  const Toast = ({ message, type = 'success', onClose }) => {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
      const leaveTimer = setTimeout(() => setLeaving(true), 3800);
      const closeTimer = setTimeout(() => { if (onClose) onClose(); }, 4300);
      return () => { clearTimeout(leaveTimer); clearTimeout(closeTimer); };
    }, [onClose]);

    const isSuccess = type === 'success';
    return (
      <div style={{
        position: 'fixed',
        top: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: leaving ? 'toastOut 0.45s ease forwards' : 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.65rem 1.1rem 0.65rem 0.85rem',
        borderRadius: '999px',
        background: isSuccess
          ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.22))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(185,28,28,0.22))',
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isSuccess
          ? '0 8px 32px rgba(16,185,129,0.18), 0 2px 8px rgba(0,0,0,0.25)'
          : '0 8px 32px rgba(239,68,68,0.18), 0 2px 8px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',
        maxWidth: '90vw',
      }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
          border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`,
        }}>
          {isSuccess ? <CheckCircle size={14} color="#34d399" /> : <AlertCircle size={14} color="#f87171" />}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isSuccess ? '#a7f3d0' : '#fca5a5', letterSpacing: '0.01em' }}>
          {message}
        </span>
        <button onClick={() => { setLeaving(true); setTimeout(() => { if (onClose) onClose(); }, 450); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 0.25rem', display: 'flex', alignItems: 'center', color: isSuccess ? '#6ee7b7' : '#fca5a5', opacity: 0.7 }}>
          <XCircle size={14} />
        </button>
      </div>
    );
  };
  
  // Get student initials
  const getStudentInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };
  
  // CSS styles
  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-24px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to   { opacity: 0; transform: translateX(-50%) translateY(-32px); }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .stats-grid {
      display: flex;
      overflow-x: auto;
      gap: 1.25rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      scrollbar-width: none;
      ms-overflow-style: none;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }

    .stats-grid::-webkit-scrollbar {
      display: none;
    }

    .stat-card {
      background: rgba(30, 41, 59, 0.4);
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      backdrop-filter: blur(20px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: fadeIn 0.5s ease-out;
      flex: 0 0 280px;
      scroll-snap-align: start;
    }
    
    .stat-card:hover {
      transform: translateY(-6px);
      background: rgba(30, 41, 59, 0.6);
      border-color: rgba(139, 92, 246, 0.2) !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    }

    .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 0;
      padding: 0;
    }

    .table-row {
      transition: all 0.2s ease;
      background: transparent;
    }

    .table-row:nth-child(even) {
      background: rgba(15, 23, 42, 0.15);
    }

    .table-row:hover {
      background: rgba(30, 41, 59, 0.4) !important;
    }

    .search-input-integrated {
      background: rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 8px;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      color: #f1f5f9;
      font-size: 0.9rem;
      width: 250px;
      transition: all 0.2s ease;
    }

    .search-input-integrated:focus {
      outline: none;
      border-color: rgba(139, 92, 246, 0.5);
      background: rgba(15, 23, 42, 0.5);
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      {/* Incident Modal */}
      {isModalOpen && selectedIncident && (
        <SincidentModal
          incidentData={selectedIncident}
          isOpen={isModalOpen}
          onClose={closeIncidentModal}
          onUpdate={handleIncidentUpdate}
          onDelete={handleIncidentDelete}
          onEvidenceAdded={handleEvidenceAdded}
        />
      )}
      
      <div className="incidents-page-content" style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          animation: 'fadeIn 0.5s ease'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: '800',
            color: '#f8fafc',
            marginBottom: '0.5rem'
          }}>
            S-Tier Incidents Management
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: '#94a3b8',
            marginBottom: '1.5rem'
          }}>
            Manage and review serious disciplinary incidents (S-tier) requiring immediate attention
          </p>
          
          {/* Search and Actions Bar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>

            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#94a3b8',
                fontSize: '0.9rem'
              }}>
                <span>Showing {filteredIncidents.length} of {incidents.length} incidents on this page</span>
                {loading.refresh && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    Refreshing...
                  </span>
                )}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading.refresh}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  padding: '0.875rem 1.25rem',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: loading.refresh ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  opacity: loading.refresh ? 0.7 : 1,
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  if (!loading.refresh) {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 1)';
                    e.currentTarget.style.color = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading.refresh) {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                {loading.refresh ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Refresh Data
              </button>
            </div>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="stats-grid">
          {/* Total S-Tier Incidents Card */}
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={24} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total S-Tier Incidents</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.total}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {pagination.page} of {pagination.total_pages} pages
            </div>
          </div>
          
          {/* Pending Incidents Card */}
          <div className="stat-card" onClick={() => handleFilterChange('statusFilter', 'pending')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={24} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Pending Review</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.pending}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.pending > 0 ? `${Math.round((stats.pending / stats.total) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Approved Incidents Card */}
          <div className="stat-card" onClick={() => handleFilterChange('statusFilter', 'approved')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Approved</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.approved}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.approved > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Rejected Incidents Card */}
          <div className="stat-card" onClick={() => handleFilterChange('statusFilter', 'rejected')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <XCircle size={24} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Rejected</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.rejected}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.rejected > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
        </div>
        
        {/* Incidents Table */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* Filters above the table */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', padding: '0.875rem 1.25rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease', backdropFilter: 'blur(10px)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <Filter size={16} />
              {expandedFilters ? 'Hide Filters' : 'Show Filters'}
              {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedFilters && (
              <div style={{ marginTop: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(148, 163, 184, 0.1)', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Status</label>
                    <select value={filters.statusFilter} onChange={(e) => handleFilterChange('statusFilter', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Sort By</label>
                    <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="date">Date (Newest First)</option>
                      <option value="status">Status</option>
                      <option value="student">Student Name</option>
                      <option value="class">Class Name</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Order</label>
                    <select value={filters.sortOrder} onChange={(e) => handleFilterChange('sortOrder', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active filters:</span>
                  {filters.search && (<span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={10} />Search: "{filters.search}"</span>)}
                  {filters.statusFilter !== 'all' && (<span style={{ background: filters.statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.2)' : filters.statusFilter === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: filters.statusFilter === 'pending' ? '#fcd34d' : filters.statusFilter === 'approved' ? '#86efac' : '#fca5a5', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={10} />{filters.statusFilter === 'pending' ? 'Pending Review' : filters.statusFilter === 'approved' ? 'Approved' : 'Rejected'}</span>)}
                  <button onClick={() => setFilters({ search: '', statusFilter: 'all', sortBy: 'date', sortOrder: 'desc' })} style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '0.25rem 0.75rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Clear all</button>
                </div>
              </div>
            )}
          </div>
          {/* Table Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: 0
              }}>
                <AlertTriangle size={20} />
                S-Tier Incidents
              </h2>
              
              {/* Integrated Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  placeholder="Filter incidents..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input-integrated"
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#94a3b8',
              fontSize: '0.9rem'
            }}>
              {loading.initial ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Loading incidents...
                </span>
              ) : error ? (
                <span style={{ color: '#fca5a5' }}>
                  <AlertCircle size={14} />
                  {error}
                </span>
              ) : (
                <span>
                  {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found
                  {filters.search && ` (searched from ${incidents.length} total)`}
                </span>
              )}
            </div>
          </div>
          
          {/* Table Content */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
            {loading.initial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p>Loading S-tier incidents...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#fca5a5' }}>{error}</p>
                <button
                  onClick={() => fetchIncidents(1)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '1rem auto 0'
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
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No S-tier incidents found</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {filters.search || filters.statusFilter !== 'all'
                    ? 'Try changing your filters or search query' 
                    : 'No S-tier incidents have been reported in your school yet'}
                </p>
                {(filters.search || filters.statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        statusFilter: 'all',
                        sortBy: 'date',
                        sortOrder: 'desc'
                      });
                    }}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      marginTop: '1rem'
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
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '1200px'
              }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Student</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Class</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Admission No.</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Status</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Reported On</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Evidence</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Punishment</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((incident, index) => {
                    const statusBadge = sTierUtils.getStierStatusBadge(incident.status);
                    const evidenceUrls = sTierUtils.processEvidenceUrls(incident.evidence_url);
                    const hasPunishment = !!incident.punishment_id;
                    
                    return (
                      <tr 
                        key={incident.incident_id}
                        className="table-row"
                        onClick={() => openIncidentModal(incident)}
                        style={{
                          borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                          background: index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.15)',
                          cursor: 'pointer'
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Student Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                flexShrink: 0
                              }}>
                                {getStudentInitials(incident.student_first_name, incident.student_last_name)}
                              </div>
                              <div>
                                <div style={{ 
                                  color: '#f1f5f9', 
                                  fontWeight: '600',
                                  marginBottom: '4px',
                                  fontSize: '1.05rem'
                                }}>
                                  {incident.student_first_name} {incident.student_last_name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={12} />
                                  {incident.student_id}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          {incident.class_name ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                flexShrink: 0
                              }}>
                                {incident.class_name?.substring(0, 1)}
                              </div>
                              <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {incident.class_name}
                              </span>
                            </div>
                          ) : (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                              N/A
                            </div>
                          )}
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <GraduationCap size={16} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              {incident.admission_number}
                            </span>
                          </div>
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: statusBadge.bgColor,
                            color: statusBadge.color,
                            borderRadius: '999px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: `1px solid ${statusBadge.color}20`,
                            display: 'inline-block'
                          }}>
                            {statusBadge.label}
                          </span>
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} color="#94a3b8" />
                              <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                                {sTierUtils.formatSimpleDate(incident.incident_created_at)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              ID: {incident.incident_id?.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          {evidenceUrls.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={16} color="#3b82f6" />
                              <span style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}>
                                {evidenceUrls.length} file{evidenceUrls.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <div style={{ 
                              color: '#94a3b8', 
                              fontStyle: 'italic',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <FileText size={16} />
                              None
                            </div>
                          )}
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          {hasPunishment ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AwardIcon size={16} color="#f59e0b" />
                              <span style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '150px'
                              }}>
                                {incident.punishment_name}
                              </span>
                            </div>
                          ) : (
                            <div style={{ 
                              color: '#94a3b8', 
                              fontStyle: 'italic',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <AwardIcon size={16} />
                              None
                            </div>
                          )}
                        </td>
                        
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => openIncidentModal(incident)}
                              style={{
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '6px',
                                padding: '0.5rem 0.75rem',
                                color: '#cbd5e1',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
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
                              <Eye size={12} />
                              View
                            </button>
                            
                            {/* Review Button for Pending Incidents Only */}
                            {incident.status === 'pending' && !incident.is_deleted && (
                              <button
                                onClick={() => openIncidentModal(incident)}
                                style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid rgba(245, 158, 11, 0.2)',
                                  borderRadius: '6px',
                                  padding: '0.5rem 0.75rem',
                                  color: '#fcd34d',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                                  e.currentTarget.style.color = '#fde68a';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                                  e.currentTarget.style.color = '#fcd34d';
                                }}
                              >
                                <Shield size={12} />
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Table Footer */}
          {!loading.initial && !error && filteredIncidents.length > 0 && (
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              background: 'rgba(15, 23, 42, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#94a3b8',
              fontSize: '0.85rem'
            }}>
              <div>
                Showing {filteredIncidents.length} of {incidents.length} incidents on page {pagination.page} of {pagination.total_pages}
              </div>
              
              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      color: pagination.page === 1 ? '#94a3b8' : '#cbd5e1',
                      fontSize: '0.85rem',
                      cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: pagination.page === 1 ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page !== 1) {
                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                  >
                    <ArrowLeft size={14} />
                    First
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      color: pagination.page === 1 ? '#94a3b8' : '#cbd5e1',
                      fontSize: '0.85rem',
                      cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: pagination.page === 1 ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page !== 1) {
                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  
                  <div style={{ padding: '0 0.75rem', color: '#cbd5e1' }}>
                    Page {pagination.page} of {pagination.total_pages}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      color: pagination.page === pagination.total_pages ? '#94a3b8' : '#cbd5e1',
                      fontSize: '0.85rem',
                      cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: pagination.page === pagination.total_pages ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page !== pagination.total_pages) {
                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={pagination.page === pagination.total_pages}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      color: pagination.page === pagination.total_pages ? '#94a3b8' : '#cbd5e1',
                      fontSize: '0.85rem',
                      cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: pagination.page === pagination.total_pages ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page !== pagination.total_pages) {
                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                  >
                    Last
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Empty State Instructions */}
        {!loading.initial && incidents.length === 0 && !error && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '12px',
            border: '1px dashed rgba(148, 163, 184, 0.2)',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              No S-Tier Incidents Yet
            </h3>
            <p style={{ marginBottom: '1rem', maxWidth: '500px', margin: '0 auto 1rem' }}>
              No S-tier incidents have been reported in your school yet. These are the most serious incidents 
              requiring immediate administrative review and action.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleRefresh}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: '#cbd5e1',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
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
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sincidents;