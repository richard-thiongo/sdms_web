import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, Search, Filter, RefreshCw, Loader2, 
  AlertCircle, Calendar, Eye, Shield,
  GraduationCap, FileText, Award, CheckCircle,
  XCircle, ChevronDown, ChevronUp,
  BarChart3, Clock, ShieldAlert, Award as AwardIcon
} from 'lucide-react';
import AandBincidentModal from './AandBincidentModal';
import { 
  incidentAPI, formatIncidentDate, getSeverityBadge, 
  getStatusBadge, getPunishmentStatus, processEvidenceUrls,
  getStudentInitials, truncateText, calculateIncidentStats,
  formatPunishmentDate
} from './utils/incidentUtils';

const AandBincidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState({ initial: true, refresh: false, action: false });
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('details');
  const [filters, setFilters] = useState({
    search: '',
    severityFilter: 'all',
    statusFilter: 'all',
    punishmentFilter: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const statsGridRef = useRef(null);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const computedFilteredIncidents = useMemo(() => {
    let result = [...incidents];
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(incident => {
        const studentName = `${incident.student_first_name || ''} ${incident.student_last_name || ''}`.toLowerCase();
        const admissionNumber = incident.admission_number?.toLowerCase() || '';
        const className = incident.class_name?.toLowerCase() || '';
        const description = incident.description?.toLowerCase() || '';
        const reporterName = `${incident.reporter_first_name || ''} ${incident.reporter_last_name || ''}`.toLowerCase();
        return studentName.includes(searchTerm) || admissionNumber.includes(searchTerm) || className.includes(searchTerm) || description.includes(searchTerm) || reporterName.includes(searchTerm);
      });
    }
    if (filters.severityFilter !== 'all') result = result.filter(i => i.severity === filters.severityFilter);
    if (filters.statusFilter !== 'all') result = result.filter(i => i.status === filters.statusFilter);
    if (filters.punishmentFilter !== 'all') {
      switch (filters.punishmentFilter) {
        case 'with_punishment': result = result.filter(i => i.punishment_id); break;
        case 'without_punishment': result = result.filter(i => !i.punishment_id); break;
        case 'active': result = result.filter(i => { if (!i.punishment_id || i.punishment_completed) return false; if (!i.punishment_end_date) return true; return new Date(i.punishment_end_date) >= new Date(); }); break;
        case 'completed': result = result.filter(i => i.punishment_completed); break;
        case 'overdue': result = result.filter(i => { if (!i.punishment_id || i.punishment_completed) return false; if (!i.punishment_end_date) return false; return new Date(i.punishment_end_date) < new Date(); }); break;
        default: break;
      }
    }
    result.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'severity': aValue = a.severity === 'A' ? 0 : 1; bValue = b.severity === 'A' ? 0 : 1; break;
        case 'status': const so = { 'pending': 0, 'rejected': 1 }; aValue = so[a.status] || 2; bValue = so[b.status] || 2; break;
        case 'student': aValue = `${a.student_first_name||''} ${a.student_last_name||''}`.toLowerCase(); bValue = `${b.student_first_name||''} ${b.student_last_name||''}`.toLowerCase(); break;
        case 'class': aValue = a.class_name?.toLowerCase()||''; bValue = b.class_name?.toLowerCase()||''; break;
        default: aValue = new Date(a.incident_created_at||a.created_at||0); bValue = new Date(b.incident_created_at||b.created_at||0); break;
      }
      return filters.sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
    return result;
  }, [incidents, filters]);

  useEffect(() => { setFilteredIncidents(computedFilteredIncidents); }, [computedFilteredIncidents]);

  const fetchIncidents = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(prev => ({ ...prev, initial: true }));
    setError(null);
    try {
      const data = await incidentAPI.getIncidents({ severity: filters.severityFilter !== 'all' ? filters.severityFilter : undefined });
      if (data.success) {
        setIncidents(data.data.incidents || []);
        if (showLoading) addToast('A/B incidents loaded successfully', 'success');
      } else {
        setError(data.message || 'Failed to load incidents');
        addToast(data.message || 'Failed to load incidents', 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, initial: false, refresh: false }));
    }
  }, [filters.severityFilter, addToast]);

  const handleFilterChange = useCallback((key, value) => { setFilters(prev => ({ ...prev, [key]: value })); }, []);
  const handleSearch = useCallback((value) => { handleFilterChange('search', value); }, [handleFilterChange]);
  const handleRefresh = useCallback(() => { setLoading(prev => ({ ...prev, refresh: true })); fetchIncidents(false); }, [fetchIncidents]);
  const openIncidentModal = useCallback((incident, view = 'details') => { setSelectedIncident(incident); setModalView(view); setIsModalOpen(true); }, []);
  const closeIncidentModal = useCallback(() => { setIsModalOpen(false); setSelectedIncident(null); setModalView('details'); }, []);

  const handleStatusUpdate = useCallback(async (incidentId, status) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const result = await incidentAPI.updateIncidentStatus(incidentId, status);
      if (result.success) {
        setIncidents(prev => prev.map(i => i.incident_id === incidentId ? { ...i, status, updated_at: new Date().toISOString() } : i));
        addToast(`Incident ${status === 'approved' ? 'approved' : 'rejected'} successfully`, 'success');
        closeIncidentModal();
      } else {
        addToast(result.message || 'Failed to update incident status', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [addToast, closeIncidentModal]);

  const stats = calculateIncidentStats(incidents);
  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  // New Toast Component
  const Toast = ({ message, type = 'success', onClose }) => {
    const [leaving, setLeaving] = useState(false);
    useEffect(() => {
      const t1 = setTimeout(() => setLeaving(true), 3800);
      const t2 = setTimeout(() => { if (onClose) onClose(); }, 4300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onClose]);
    const isSuccess = type === 'success';
    return (
      <div style={{
        position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
        animation: leaving ? 'toastOut 0.45s ease forwards' : 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.65rem 1.1rem 0.65rem 0.85rem', borderRadius: '999px',
        background: isSuccess ? 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.22))' : 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(185,28,28,0.22))',
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isSuccess ? '0 8px 32px rgba(16,185,129,0.18),0 2px 8px rgba(0,0,0,0.25)' : '0 8px 32px rgba(239,68,68,0.18),0 2px 8px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap', maxWidth: '90vw',
      }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}` }}>
          {isSuccess ? <CheckCircle size={14} color="#34d399" /> : <AlertCircle size={14} color="#f87171" />}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isSuccess ? '#a7f3d0' : '#fca5a5', letterSpacing: '0.01em' }}>{message}</span>
        <button onClick={() => { setLeaving(true); setTimeout(() => { if (onClose) onClose(); }, 450); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 0.25rem', display: 'flex', alignItems: 'center', color: isSuccess ? '#6ee7b7' : '#fca5a5', opacity: 0.7 }}>
          <XCircle size={14} />
        </button>
      </div>
    );
  };

  const styles = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-24px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-32px); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .stats-grid { display: flex; overflow-x: auto; gap: 1.25rem; margin-bottom: 2rem; padding-bottom: 1rem; scrollbar-width: none; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
    .stats-grid::-webkit-scrollbar { display: none; }
    .stat-card { background: rgba(30,41,59,0.4); border-radius: 20px; padding: 1.5rem; border: 1px solid rgba(148,163,184,0.08); transition: all 0.3s cubic-bezier(0.4,0,0.2,1); cursor: pointer; backdrop-filter: blur(20px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); animation: fadeIn 0.5s ease-out; flex: 0 0 280px; scroll-snap-align: start; }
    .stat-card:hover { transform: translateY(-6px); background: rgba(30,41,59,0.6); border-color: rgba(139,92,246,0.2) !important; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2),0 8px 10px -6px rgba(0,0,0,0.1) !important; }
    .table-row { transition: all 0.2s ease; background: transparent; }
    .table-row:nth-child(even) { background: rgba(15,23,42,0.25); }
    .table-row:hover { background: rgba(30,41,59,0.4) !important; }
    .search-input-integrated { background: rgba(15,23,42,0.3); border: 1px solid rgba(148,163,184,0.1); border-radius: 8px; padding: 0.5rem 0.75rem 0.5rem 2.25rem; color: #f1f5f9; font-size: 0.9rem; width: 250px; transition: all 0.2s ease; }
    .search-input-integrated:focus { outline: none; border-color: rgba(139,92,246,0.5); background: rgba(15,23,42,0.5); box-shadow: 0 0 0 2px rgba(139,92,246,0.1); }
  `;

  return (
    <>
      <style>{styles}</style>

      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}

      {isModalOpen && selectedIncident && (
        <AandBincidentModal incidentData={selectedIncident} isOpen={isModalOpen} onClose={closeIncidentModal} onUpdate={handleStatusUpdate} view={modalView} />
      )}

      <div className="incidents-page-content" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.5s ease' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,5vw,2.5rem)', fontWeight: '800', color: '#f8fafc', marginBottom: '0.5rem' }}>
            A/B Incidents Management
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem,2vw,1rem)', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Monitor and manage A & B tier incidents across your school with detailed analytics
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
              {loading.refresh && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />Refreshing...</span>}
            </div>
            <button
              onClick={handleRefresh} disabled={loading.refresh}
              style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: loading.refresh ? 'not-allowed' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease', opacity: loading.refresh ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (!loading.refresh) { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; e.currentTarget.style.color = '#f1f5f9'; } }}
              onMouseLeave={(e) => { if (!loading.refresh) { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#cbd5e1'; } }}
            >
              {loading.refresh ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
              Refresh Data
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="stats-grid" ref={statsGridRef}>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(139,92,246,0.2))', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={24} color="#8b5cf6" /></div>
                <div><div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total A/B Incidents</div><div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalIncidents}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /><span>A-Tier: {stats.aTierCount}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /><span>B-Tier: {stats.bTierCount}</span></div>
              </div>
            </div>

            <div className="stat-card" onClick={() => handleFilterChange('statusFilter', 'pending')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.2))', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={24} color="#f59e0b" /></div>
                <div><div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Pending Review</div><div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.pendingCount}</div></div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{stats.pendingCount > 0 ? `${Math.round((stats.pendingCount / stats.totalIncidents) * 100)}% of total` : 'Click to view'}</div>
            </div>

            <div className="stat-card" onClick={() => handleFilterChange('punishmentFilter', 'with_punishment')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.2))', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={24} color="#3b82f6" /></div>
                <div><div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>With Punishment</div><div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.withPunishment}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /><span>Active: {stats.activePunishments}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /><span>Overdue: {stats.overduePunishments}</span></div>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.2))', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={24} color="#10b981" /></div>
                <div><div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Status Distribution</div><div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.rejectedCount}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /><span>Pending: {stats.pendingCount}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /><span>Rejected: {stats.rejectedCount}</span></div>
              </div>
            </div>

          </div>
        </div>

        {/* Incidents Table Card */}
        <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', animation: 'fadeIn 0.5s ease-out' }}>

          {/* Filters above the table */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', padding: '0.875rem 1.25rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease', backdropFilter: 'blur(10px)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.4)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <Filter size={16} />
              {expandedFilters ? 'Hide Filters' : 'Show Filters'}
              {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedFilters && (
              <div style={{ marginTop: '1rem', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(148,163,184,0.1)', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Severity</label>
                    <select value={filters.severityFilter} onChange={(e) => handleFilterChange('severityFilter', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Severities (A & B)</option>
                      <option value="A">A-Tier Only (Green)</option>
                      <option value="B">B-Tier Only (Yellow)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Status</label>
                    <select value={filters.statusFilter} onChange={(e) => handleFilterChange('statusFilter', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending Review</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Punishment Status</label>
                    <select value={filters.punishmentFilter} onChange={(e) => handleFilterChange('punishmentFilter', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Incidents</option>
                      <option value="with_punishment">With Punishment</option>
                      <option value="without_punishment">Without Punishment</option>
                      <option value="active">Active Punishments</option>
                      <option value="completed">Completed Punishments</option>
                      <option value="overdue">Overdue Punishments</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Sort By</label>
                    <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="date">Date (Newest First)</option>
                      <option value="severity">Severity</option>
                      <option value="status">Status</option>
                      <option value="student">Student Name</option>
                      <option value="class">Class Name</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Order</label>
                    <select value={filters.sortOrder} onChange={(e) => handleFilterChange('sortOrder', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active filters:</span>
                  {filters.search && <span style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={10} />Search: "{filters.search}"</span>}
                  {filters.severityFilter !== 'all' && <span style={{ background: filters.severityFilter === 'A' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: filters.severityFilter === 'A' ? '#86efac' : '#fcd34d', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={10} />{filters.severityFilter === 'A' ? 'A-Tier Only' : 'B-Tier Only'}</span>}
                  {filters.statusFilter !== 'all' && <span style={{ background: filters.statusFilter === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: filters.statusFilter === 'pending' ? '#fcd34d' : '#fca5a5', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={10} />{filters.statusFilter === 'pending' ? 'Pending Review' : 'Rejected'}</span>}
                  {filters.punishmentFilter !== 'all' && <span style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={10} />{filters.punishmentFilter === 'with_punishment' ? 'With Punishment' : filters.punishmentFilter === 'without_punishment' ? 'Without Punishment' : filters.punishmentFilter === 'active' ? 'Active Punishments' : filters.punishmentFilter === 'completed' ? 'Completed' : 'Overdue'}</span>}
                  <button onClick={() => setFilters({ search: '', severityFilter: 'all', statusFilter: 'all', punishmentFilter: 'all', sortBy: 'date', sortOrder: 'desc' })} style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '6px', padding: '0.25rem 0.75rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Clear all</button>
                </div>
              </div>
            )}
          </div>

          {/* Table Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(148,163,184,0.1)', background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <AlertTriangle size={20} />A/B Incidents
              </h2>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Filter incidents..." value={filters.search} onChange={(e) => handleSearch(e.target.value)} className="search-input-integrated" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              {loading.initial ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Loading incidents...</span>
              ) : error ? (
                <span style={{ color: '#fca5a5' }}>{error}</span>
              ) : (
                <span>{filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found</span>
              )}
            </div>
          </div>

          {/* Table Content - independently scrollable */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
            {loading.initial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p>Loading A/B incidents...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#fca5a5' }}>{error}</p>
                <button onClick={() => fetchIncidents()} style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', padding: '0.75rem 1.5rem', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem auto 0' }}>
                  <RefreshCw size={16} />Try Again
                </button>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No A/B incidents found</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {filters.search || filters.severityFilter !== 'all' || filters.statusFilter !== 'all' || filters.punishmentFilter !== 'all' ? 'Try changing your filters or search query' : 'No A or B tier incidents have been reported yet'}
                </p>
                {(filters.search || filters.severityFilter !== 'all' || filters.statusFilter !== 'all' || filters.punishmentFilter !== 'all') && (
                  <button onClick={() => setFilters({ search: '', severityFilter: 'all', statusFilter: 'all', punishmentFilter: 'all', sortBy: 'date', sortOrder: 'desc' })} style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', padding: '0.75rem 1.5rem', color: '#cbd5e1', cursor: 'pointer', marginTop: '1rem' }}>Clear filters</button>
                )}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                <thead>
                  <tr style={{ background: 'rgba(15,23,42,0.3)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    {['Incident Details', 'Student & Class', 'Reporter', 'Punishment', 'Date', 'Actions'].map(col => (
                      <th key={col} style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((incident, index) => {
                    const severityBadge = getSeverityBadge(incident.severity);
                    const statusBadge = getStatusBadge(incident.status);
                    const punishmentStatus = getPunishmentStatus({ completed: incident.punishment_completed, end_date: incident.punishment_end_date });
                    const evidenceUrls = processEvidenceUrls(incident.evidence_url);
                    return (
                      <tr
                        key={incident.incident_id}
                        className="table-row"
                        style={{ borderBottom: '1px solid rgba(148,163,184,0.05)', cursor: 'pointer', background: index % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.15)' }}
                        onClick={() => openIncidentModal(incident, 'details')}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: severityBadge.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={20} color={severityBadge.color} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '4px' }}>{truncateText(incident.description, 60) || 'No description'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <span style={{ padding: '0.25rem 0.75rem', background: severityBadge.bgColor, color: severityBadge.color, borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>{severityBadge.label}</span>
                                  <span style={{ padding: '0.25rem 0.75rem', background: statusBadge.bgColor, color: statusBadge.color, borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>{statusBadge.label}</span>
                                </div>
                              </div>
                            </div>
                            {evidenceUrls.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <FileText size={12} /><span>{evidenceUrls.length} evidence file{evidenceUrls.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                                {getStudentInitials(incident.student_first_name, incident.student_last_name)}
                              </div>
                              <div>
                                <div style={{ color: '#f1f5f9', fontWeight: '500', marginBottom: '2px' }}>{incident.student_first_name} {incident.student_last_name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={12} />{incident.admission_number}</div>
                              </div>
                            </div>
                            {incident.class_name && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{incident.class_name?.substring(0, 1)}</div>
                                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{incident.class_name}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {incident.reporter_first_name ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                                {getStudentInitials(incident.reporter_first_name, incident.reporter_last_name)}
                              </div>
                              <div>
                                <div style={{ color: '#f1f5f9', fontWeight: '500', marginBottom: '2px' }}>{incident.reporter_first_name} {incident.reporter_last_name}</div>
                                {incident.reporter_email && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{incident.reporter_email}</div>}
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Reporter not specified</div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {incident.punishment_name ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AwardIcon size={16} color={punishmentStatus.color} />
                                <span style={{ color: '#f1f5f9', fontWeight: '500', fontSize: '0.9rem' }}>{incident.punishment_name}</span>
                              </div>
                              <span style={{ padding: '0.25rem 0.5rem', background: punishmentStatus.bgColor, color: punishmentStatus.color, borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', width: 'fit-content' }}>{punishmentStatus.label}</span>
                              {incident.punishment_end_date && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Until {formatPunishmentDate(incident.punishment_end_date)}</div>}
                            </div>
                          ) : (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AwardIcon size={16} />No punishment assigned</div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} color="#94a3b8" />
                              <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{formatIncidentDate(incident.incident_created_at || incident.created_at)}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {incident.incident_id?.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); openIncidentModal(incident, 'details'); }}
                              style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#cbd5e1', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; e.currentTarget.style.color = '#f1f5f9'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#cbd5e1'; }}
                            >
                              <Eye size={12} />View
                            </button>
                            {incident.status === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (window.confirm('Approve this incident?')) handleStatusUpdate(incident.incident_id, 'approved'); }}
                                  disabled={loading.action}
                                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#86efac', fontSize: '0.85rem', cursor: loading.action ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: loading.action ? 0.7 : 1, transition: 'all 0.2s ease' }}
                                  onMouseEnter={(e) => { if (!loading.action) { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.color = '#bbf7d0'; } }}
                                  onMouseLeave={(e) => { if (!loading.action) { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.color = '#86efac'; } }}
                                >
                                  <CheckCircle size={12} />Approve
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (window.confirm('Reject this incident?')) handleStatusUpdate(incident.incident_id, 'rejected'); }}
                                  disabled={loading.action}
                                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fca5a5', fontSize: '0.85rem', cursor: loading.action ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: loading.action ? 0.7 : 1, transition: 'all 0.2s ease' }}
                                  onMouseEnter={(e) => { if (!loading.action) { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fecaca'; } }}
                                  onMouseLeave={(e) => { if (!loading.action) { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; } }}
                                >
                                  <XCircle size={12} />Reject
                                </button>
                              </>
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
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(148,163,184,0.1)', background: 'rgba(15,23,42,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
              <div>Showing {filteredIncidents.length} of {incidents.length} incidents</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Sorted by:</span>
                <span style={{ color: '#cbd5e1', fontWeight: '500' }}>
                  {filters.sortBy === 'date' ? 'Date' : filters.sortBy === 'severity' ? 'Severity' : filters.sortBy === 'status' ? 'Status' : filters.sortBy === 'student' ? 'Student Name' : 'Class Name'}
                  {' '}({filters.sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!loading.initial && incidents.length === 0 && !error && (
          <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(15,23,42,0.3)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)', textAlign: 'center', color: '#94a3b8' }}>
            <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>No A/B Incidents Yet</h3>
            <p style={{ maxWidth: '500px', margin: '0 auto 1rem' }}>No A or B tier incidents have been reported in your school yet.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handleRefresh} style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', padding: '0.75rem 1.5rem', color: '#cbd5e1', fontWeight: '500', fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; }}>
                <RefreshCw size={16} />Refresh
              </button>
              <button onClick={() => window.open('/admin/dashboard', '_blank')} style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', color: 'white', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <BarChart3 size={16} />Go to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default AandBincidents;