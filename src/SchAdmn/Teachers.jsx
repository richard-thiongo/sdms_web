// SchAdmin/Teachers.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Search, Filter, RefreshCw, Loader2, 
  BookOpen, Mail, Calendar, Eye,
  UserCheck, UserX, AlertCircle, ChevronDown,
  ChevronUp, CheckCircle, XCircle
} from 'lucide-react';
import TeacherModal from './TeacherModal';
import { teacherAPI, formatDate } from './utils/teacherUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

const Teachers = () => {
  // State for teachers data
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    initial: true,
    refresh: false,
    action: false
  });
  
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('details');
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    showWithClass: 'all', // 'all', 'with', 'without'
    sortBy: 'name', // 'name', 'incidents', 'date'
    sortOrder: 'asc' // 'asc', 'desc'
  });
  
  // Expanded sections
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Use ref for addToast to avoid dependency issues
  const toastIdCounter = useRef(0);
  
  // Add toast (wrapped in useCallback)
  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
    
    return id;
  }, []);
  
  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // Toast component
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
  
  // Apply filters and sorting (moved before fetchTeachers)
  const applyFilters = useCallback((teachersList) => {
    let result = [...teachersList];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(teacher =>
        teacher.first_name?.toLowerCase().includes(searchTerm) ||
        teacher.last_name?.toLowerCase().includes(searchTerm) ||
        teacher.email?.toLowerCase().includes(searchTerm) ||
        teacher.class_name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply class filter
    if (filters.showWithClass === 'with') {
      result = result.filter(teacher => teacher.class_id);
    } else if (filters.showWithClass === 'without') {
      result = result.filter(teacher => !teacher.class_id);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'incidents':
          aValue = (a.individual_incidents_count || 0) + (a.class_incidents_count || 0);
          bValue = (b.individual_incidents_count || 0) + (b.class_incidents_count || 0);
          break;
        case 'date':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'name':
        default:
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredTeachers(result);
  }, [filters]);
  
  // Fetch teachers
  const fetchTeachers = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(prev => ({ ...prev, initial: true }));
    }
    setError(null);
    
    try {
      const data = await teacherAPI.getTeachers();
      if (data.success) {
        setTeachers(data.data || []);
        applyFilters(data.data || []);
        if (showLoading) {
          addToast('Teachers loaded successfully', 'success');
        }
      } else {
        setError(sanitizeErrorMessage(data.message, 'Failed to load teachers'));
        addToast(sanitizeErrorMessage(data.message, 'Failed to load teachers'), 'error');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Network error. Please try again.');
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        initial: false, 
        refresh: false 
      }));
    }
  }, [applyFilters, addToast]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      applyFilters(teachers);
      return newFilters;
    });
  }, [applyFilters, teachers]);
  
  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    handleFilterChange('search', value);
  }, [handleFilterChange]);
  
  // Refresh data
  const handleRefresh = useCallback(() => {
    setLoading(prev => ({ ...prev, refresh: true }));
    fetchTeachers(false);
  }, [fetchTeachers]);
  
  // Open teacher modal
  const openTeacherModal = useCallback((teacher, view = 'details') => {
    setSelectedTeacher(teacher);
    setModalView(view);
    setIsModalOpen(true);
  }, []);
  
  // Close teacher modal
  const closeTeacherModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
    setModalView('details');
  }, []);
  
  // Handle teacher update
  const handleTeacherUpdate = useCallback((updatedTeacher) => {
    setTeachers(prev => 
      prev.map(teacher => 
        teacher.user_id === updatedTeacher.user_id 
          ? { ...teacher, ...updatedTeacher }
          : teacher
      )
    );
    applyFilters(teachers.map(teacher => 
      teacher.user_id === updatedTeacher.user_id 
        ? { ...teacher, ...updatedTeacher }
        : teacher
    ));
    addToast('Teacher updated successfully', 'success');
  }, [teachers, applyFilters, addToast]);
  
  // Handle teacher delete
  const handleTeacherDelete = useCallback((teacherId) => {
    setTeachers(prev => prev.filter(teacher => teacher.user_id !== teacherId));
    applyFilters(teachers.filter(teacher => teacher.user_id !== teacherId));
    addToast('Teacher deleted successfully', 'success');
  }, [teachers, applyFilters, addToast]);
  
  // Calculate statistics
  const calculateStats = () => {
    const totalTeachers = teachers.length;
    const teachersWithClass = teachers.filter(t => t.class_id).length;
    const teachersWithoutClass = totalTeachers - teachersWithClass;
    const totalIncidents = teachers.reduce((sum, teacher) => 
      sum + (teacher.individual_incidents_count || 0) + (teacher.class_incidents_count || 0), 0);
    
    return { totalTeachers, teachersWithClass, teachersWithoutClass, totalIncidents };
  };
  
  // Initial fetch
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);
  
  // Apply filters when filters change
  useEffect(() => {
    applyFilters(teachers);
  }, [applyFilters, teachers]);
  
  const stats = calculateStats();
  
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
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
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
    
    .teacher-row {
      transition: all 0.2s ease;
      border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    }
    
    .teacher-row:hover {
      background: rgba(30, 41, 59, 0.4) !important;
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
      
      {/* Teacher Modal */}
      {isModalOpen && selectedTeacher && (
        <TeacherModal
          teacher={selectedTeacher}
          isOpen={isModalOpen}
          onClose={closeTeacherModal}
          onUpdate={handleTeacherUpdate}
          onDelete={handleTeacherDelete}
          view={modalView}
        />
      )}
      
      <div className="teachers-page-content" style={{ animation: 'fadeIn 0.3s ease' }}>
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
            Teacher Management
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: '#94a3b8',
            marginBottom: '1.5rem'
          }}>
            Manage all teachers in your school, view their incidents, and perform administrative actions
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
                <span>Showing {filteredTeachers.length} of {teachers.length} teachers</span>
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
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: loading.refresh ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  opacity: loading.refresh ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading.refresh) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
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
          {/* Total Teachers Card */}
          <div className="stat-card" onClick={() => handleFilterChange('showWithClass', 'all')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Teachers</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalTeachers}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Click to view all
            </div>
          </div>
          
          {/* Teachers with Class Card */}
          <div className="stat-card" onClick={() => handleFilterChange('showWithClass', 'with')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserCheck size={24} color="#22c55e" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>With Class</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.teachersWithClass}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.teachersWithClass > 0 ? `${Math.round((stats.teachersWithClass / stats.totalTeachers) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Teachers without Class Card */}
          <div className="stat-card" onClick={() => handleFilterChange('showWithClass', 'without')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserX size={24} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Without Class</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.teachersWithoutClass}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.teachersWithoutClass > 0 ? `${Math.round((stats.teachersWithoutClass / stats.totalTeachers) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Total Incidents Card */}
          <div className="stat-card" style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={24} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Incidents</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalIncidents}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Reported by all teachers
            </div>
          </div>
        </div>
        
        {/* Teachers Table */}
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
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Class Assignment</label>
                    <select value={filters.showWithClass} onChange={(e) => handleFilterChange('showWithClass', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Teachers</option>
                      <option value="with">With Class Assignment</option>
                      <option value="without">Without Class Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Sort By</label>
                    <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="name">Name (A-Z)</option>
                      <option value="incidents">Total Incidents</option>
                      <option value="date">Join Date</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Order</label>
                    <select value={filters.sortOrder} onChange={(e) => handleFilterChange('sortOrder', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active filters:</span>
                  {filters.search && (<span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={10} />Search: "{filters.search}"</span>)}
                  {filters.showWithClass !== 'all' && (<span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Filter size={10} />{filters.showWithClass === 'with' ? 'With Class' : 'Without Class'}</span>)}
                  <button onClick={() => setFilters({ search: '', showWithClass: 'all', sortBy: 'name', sortOrder: 'asc' })} style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '0.25rem 0.75rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Clear all</button>
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
                <Users size={20} />
                Teachers List
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
                  placeholder="Filter teachers..."
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
                  Loading teachers...
                </span>
              ) : error ? (
                <span style={{ color: '#fca5a5' }}>
                  <AlertCircle size={14} />
                  {error}
                </span>
              ) : (
                <span>
                  {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
          </div>
          
          {/* Table Content */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
            {loading.initial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p>Loading teachers...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#fca5a5' }}>{error}</p>
                <button
                  onClick={() => fetchTeachers()}
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
            ) : filteredTeachers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No teachers found</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {filters.search || filters.showWithClass !== 'all' 
                    ? 'Try changing your filters or search query' 
                    : 'No teachers have been added yet'}
                </p>
                {(filters.search || filters.showWithClass !== 'all') && (
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        showWithClass: 'all',
                        sortBy: 'name',
                        sortOrder: 'asc'
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
                minWidth: '800px'
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
                    }}>Teacher</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Email</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Class Assignment</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9restore', 
                      whiteSpace: 'nowrap'
                    }}>Incidents</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Joined</th>
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
                  {filteredTeachers.map((teacher, index) => (
                    <tr 
                      key={teacher.user_id} 
                      className="table-row"
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                        cursor: 'pointer',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.15)' // Zebra striping
                      }}
                      onClick={() => openTeacherModal(teacher, 'details')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.15)';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                          </div>
                          <div>
                            <div style={{ 
                              color: '#f1f5f9', 
                              fontWeight: '600',
                              marginBottom: '2px'
                            }}>
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#94a3b8'
                            }}>
                              ID: {teacher.user_id?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} color="#94a3b8" />
                          <span style={{ color: '#e2e8f0' }}>{teacher.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {teacher.class_id ? (
                          <div style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#86efac',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                          }}>
                            <BookOpen size={14} />
                            {teacher.class_name}
                          </div>
                        ) : (
                          <span style={{ 
                            color: '#f59e0b', 
                            fontStyle: 'italic',
                            fontSize: '0.9rem'
                          }}>
                            No class assigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={12} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              Individual: <strong>{teacher.individual_incidents_count || 0}</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={12} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              Class: <strong>{teacher.class_incidents_count || 0}</strong>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#94a3b8" />
                          <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {formatDate(teacher.created_at)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTeacherModal(teacher, 'details');
                            }}
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
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTeacherModal(teacher, 'edit');
                            }}
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              color: '#93c5fd',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                              e.currentTarget.style.color = '#bfdbfe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                              e.currentTarget.style.color = '#93c5fd';
                            }}
                          >
                            <Eye size={12} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Table Footer */}
          {!loading.initial && !error && filteredTeachers.length > 0 && (
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
                Showing {filteredTeachers.length} of {teachers.length} teachers
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Sorted by:</span>
                <span style={{ color: '#cbd5e1', fontWeight: '500' }}>
                  {filters.sortBy === 'name' ? 'Name' : 
                   filters.sortBy === 'incidents' ? 'Total Incidents' : 'Join Date'} 
                  ({filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Empty State Instructions */}
        {!loading.initial && teachers.length === 0 && !error && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '12px',
            border: '1px dashed rgba(148, 163, 184, 0.2)',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              No Teachers Yet
            </h3>
            <p style={{ marginBottom: '1rem', maxWidth: '500px', margin: '0 auto 1rem' }}>
              You haven't added any teachers to your school yet. Teachers can be created from the Dashboard page.
            </p>
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
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
              <Users size={16} />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Teachers;