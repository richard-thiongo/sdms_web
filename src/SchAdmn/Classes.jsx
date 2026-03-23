import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Search, Filter, RefreshCw, Loader2, 
  Users, AlertCircle, Calendar, Eye, Mail,
  UserCheck, UserX, ChevronDown, ChevronUp, 
  CheckCircle, XCircle, GraduationCap, ShieldAlert
} from 'lucide-react';
import ClassModal from './ClassModal';
import { classAPI, formatDate, calculateClassStats } from './utils/classUtils';

const Classes = () => {
  // State for classes data
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    initial: true,
    refresh: false,
    action: false
  });
  
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('details');
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    showWithTeacher: 'all', // 'all', 'with', 'without'
    sortBy: 'name', // 'name', 'students', 'incidents', 'date'
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
  
  // Apply filters and sorting
  const applyFilters = useCallback((classesList) => {
    let result = [...classesList];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(cls =>
        cls.class_name?.toLowerCase().includes(searchTerm) ||
        cls.teacher_first_name?.toLowerCase().includes(searchTerm) ||
        cls.teacher_last_name?.toLowerCase().includes(searchTerm) ||
        cls.teacher_email?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply teacher filter
    if (filters.showWithTeacher === 'with') {
      result = result.filter(cls => cls.teacher_id);
    } else if (filters.showWithTeacher === 'without') {
      result = result.filter(cls => !cls.teacher_id);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'students':
          aValue = a.student_count || 0;
          bValue = b.student_count || 0;
          break;
        case 'incidents':
          aValue = (a.class_incidents_count || 0) + (a.individual_incidents_count || 0);
          bValue = (b.class_incidents_count || 0) + (b.individual_incidents_count || 0);
          break;
        case 'date':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'name':
        default:
          aValue = a.class_name?.toLowerCase() || '';
          bValue = b.class_name?.toLowerCase() || '';
          break;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredClasses(result);
  }, [filters]);
  
  // Fetch classes
  const fetchClasses = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(prev => ({ ...prev, initial: true }));
    }
    setError(null);
    
    try {
      const data = await classAPI.getClasses();
      if (data.success) {
        const classesList = data.data.classes || [];
        setClasses(classesList);
        applyFilters(classesList);
        if (showLoading) {
          addToast('Classes loaded successfully', 'success');
        }
      } else {
        setError(data.message || 'Failed to load classes');
        addToast(data.message || 'Failed to load classes', 'error');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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
      applyFilters(classes);
      return newFilters;
    });
  }, [applyFilters, classes]);
  
  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    handleFilterChange('search', value);
  }, [handleFilterChange]);
  
  // Refresh data
  const handleRefresh = useCallback(() => {
    setLoading(prev => ({ ...prev, refresh: true }));
    fetchClasses(false);
  }, [fetchClasses]);
  
  // Open class modal
  const openClassModal = useCallback((classItem, view = 'details') => {
    setSelectedClass(classItem);
    setModalView(view);
    setIsModalOpen(true);
  }, []);
  
  // Close class modal
  const closeClassModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedClass(null);
    setModalView('details');
  }, []);
  
  // Handle class update
  const handleClassUpdate = useCallback((updatedClass) => {
    setClasses(prev => 
      prev.map(cls => 
        cls.class_id === updatedClass.class_id 
          ? { ...cls, ...updatedClass, class_name: updatedClass.class_name }
          : cls
      )
    );
    applyFilters(classes.map(cls => 
      cls.class_id === updatedClass.class_id 
        ? { ...cls, ...updatedClass, class_name: updatedClass.class_name }
        : cls
    ));
    addToast('Class updated successfully', 'success');
  }, [classes, applyFilters, addToast]);
  
  // Handle class delete
  const handleClassDelete = useCallback((classId) => {
    setClasses(prev => prev.filter(cls => cls.class_id !== classId));
    applyFilters(classes.filter(cls => cls.class_id !== classId));
    addToast('Class deleted successfully', 'success');
  }, [classes, applyFilters, addToast]);
  
  // Calculate statistics
  const stats = calculateClassStats(classes);
  
  // Initial fetch
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);
  
  // Apply filters when filters change
  useEffect(() => {
    applyFilters(classes);
  }, [applyFilters, classes]);
  
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
      
      {/* Class Modal */}
      {isModalOpen && selectedClass && (
        <ClassModal
          classData={selectedClass}
          isOpen={isModalOpen}
          onClose={closeClassModal}
          onUpdate={handleClassUpdate}
          onDelete={handleClassDelete}
          view={modalView}
        />
      )}
      
      <div className="classes-page-content" style={{ animation: 'fadeIn 0.3s ease' }}>
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
            Classes Management
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: '#94a3b8',
            marginBottom: '1.5rem'
          }}>
            Manage all classes in your school, view students, incidents, and perform administrative actions
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
                <span>Showing {filteredClasses.length} of {classes.length} classes</span>
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
          {/* Total Classes Card */}
          <div className="stat-card" onClick={() => handleFilterChange('showWithTeacher', 'all')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={24} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Classes</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalClasses}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Click to view all
            </div>
          </div>
          
          {/* Classes with Teacher Card */}
          <div className="stat-card" onClick={() => handleFilterChange('showWithTeacher', 'with')}>
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
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>With Teacher</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.classesWithTeacher}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.classesWithTeacher > 0 ? `${Math.round((stats.classesWithTeacher / stats.totalClasses) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Classes without Teacher Card */}
          <div className="stat-card" onClick={() => handleFilterChange('showWithTeacher', 'without')}>
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
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Without Teacher</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.classesWithoutTeacher}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.classesWithoutTeacher > 0 ? `${Math.round((stats.classesWithoutTeacher / stats.totalClasses) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Total Incidents Card */}
          <div className="stat-card">
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
              Across all classes
            </div>
          </div>
          
          {/* Total Students Card */}
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={24} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Students</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalStudents}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Across all classes
            </div>
          </div>
        </div>
        
        {/* Classes Table */}
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
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Teacher Assignment</label>
                    <select value={filters.showWithTeacher} onChange={(e) => handleFilterChange('showWithTeacher', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Classes</option>
                      <option value="with">With Teacher Assigned</option>
                      <option value="without">Without Teacher</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Sort By</label>
                    <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="name">Class Name (A-Z)</option>
                      <option value="students">Student Count</option>
                      <option value="incidents">Total Incidents</option>
                      <option value="date">Creation Date</option>
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
                  {filters.showWithTeacher !== 'all' && (<span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Filter size={10} />{filters.showWithTeacher === 'with' ? 'With Teacher' : 'Without Teacher'}</span>)}
                  <button onClick={() => setFilters({ search: '', showWithTeacher: 'all', sortBy: 'name', sortOrder: 'asc' })} style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '0.25rem 0.75rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Clear all</button>
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
                <BookOpen size={20} />
                Classes List
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
                  placeholder="Filter classes..."
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
                  Loading classes...
                </span>
              ) : error ? (
                <span style={{ color: '#fca5a5' }}>
                  <AlertCircle size={14} />
                  {error}
                </span>
              ) : (
                <span>
                  {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''} found
                </span>
              )}
            </div>
          </div>
          
          {/* Table Content */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
            {loading.initial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p>Loading classes...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#fca5a5' }}>{error}</p>
                <button
                  onClick={() => fetchClasses()}
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
            ) : filteredClasses.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No classes found</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {filters.search || filters.showWithTeacher !== 'all' 
                    ? 'Try changing your filters or search query' 
                    : 'No classes have been created yet'}
                </p>
                {(filters.search || filters.showWithTeacher !== 'all') && (
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        showWithTeacher: 'all',
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
                minWidth: '900px'
              }}>
                <thead>
                  <tr style={{
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
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
                    }}>Teacher</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>Students</th>
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
                    }}>Created</th>
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
                  {filteredClasses.map((cls, index) => (
                    <tr 
                      key={cls.class_id} 
                      className="table-row"
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                        cursor: 'pointer',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.15)'
                      }}
                      onClick={() => openClassModal(cls)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            flexShrink: 0
                          }}>
                            {cls.class_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ 
                              color: '#f1f5f9', 
                              fontWeight: '600',
                              marginBottom: '2px',
                              fontSize: '1.05rem'
                            }}>
                              {cls.class_name}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#94a3b8'
                            }}>
                              ID: {cls.class_id?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {cls.teacher_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
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
                              {cls.teacher_first_name?.[0]}{cls.teacher_last_name?.[0]}
                            </div>
                            <div>
                              <div style={{ color: '#f1f5f9', fontWeight: '500', marginBottom: '2px' }}>
                                {cls.teacher_first_name} {cls.teacher_last_name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.8rem' }}>
                                <Mail size={12} />
                                {cls.teacher_email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ 
                            color: '#f59e0b', 
                            fontStyle: 'italic',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <UserX size={16} />
                            No teacher assigned
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                          <Users size={16} color="#94a3b8" />
                          <span style={{ fontWeight: '500' }}>{cls.student_count || 0}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Students</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={12} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              Class: <strong>{cls.class_incidents_count || 0}</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldAlert size={12} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              Individual: <strong>{cls.individual_incidents_count || 0}</strong>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#94a3b8" />
                          <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {formatDate(cls.created_at)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openClassModal(cls, 'details');
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
                              openClassModal(cls, 'edit');
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
          {!loading.initial && !error && filteredClasses.length > 0 && (
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
                Showing {filteredClasses.length} of {classes.length} classes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Sorted by:</span>
                <span style={{ color: '#cbd5e1', fontWeight: '500' }}>
                  {filters.sortBy === 'name' ? 'Class Name' : 
                   filters.sortBy === 'students' ? 'Student Count' : 
                   filters.sortBy === 'incidents' ? 'Total Incidents' : 'Creation Date'} 
                  ({filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Empty State Instructions */}
        {!loading.initial && classes.length === 0 && !error && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '12px',
            border: '1px dashed rgba(148, 163, 184, 0.2)',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              No Classes Yet
            </h3>
            <p style={{ marginBottom: '1rem', maxWidth: '500px', margin: '0 auto 1rem' }}>
              You haven't created any classes in your school yet. Classes can be created from the Dashboard page.
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
              <BookOpen size={16} />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Classes;