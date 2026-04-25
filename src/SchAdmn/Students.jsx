// Students.jsx - Updated version with efficient filtering
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Users, Search, Filter, RefreshCw, Loader2, 
  AlertCircle, Calendar, Eye, Edit2,
  UserX, ChevronDown, ChevronUp, 
  CheckCircle, XCircle, GraduationCap, ShieldAlert,
  BookOpen, Home
} from 'lucide-react';
import StudentModal from './StudentModal';
import { studentAPI, classAPI, formatDate, calculateStudentStats, getInitials } from './utils/studentUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

// Module-level cache to prevent reloading when switching tabs
let globalStudentsCache = null;
let globalClassesCache = null;
let lastStudentsFetchTime = 0;
let lastClassesFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Students = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // State for classes (for filter dropdown)
  const [classes, setClasses] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    initial: true,
    refresh: false,
    action: false,
    classes: false
  });
  
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('details');
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    classFilter: 'all', // 'all' or class_id
    incidentFilter: 'all', // 'all', 'with_incidents', 'without_incidents'
    sortBy: 'name', // 'name', 'admission', 'incidents', 'date', 'class'
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
  
  // UseMemo to compute filtered students efficiently
  const computedFilteredStudents = useMemo(() => {
    let result = [...students];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(student =>
        (student.first_name?.toLowerCase().includes(searchTerm) ||
        student.last_name?.toLowerCase().includes(searchTerm) ||
        student.admission_number?.toLowerCase().includes(searchTerm) ||
        student.class_name?.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply class filter
    if (filters.classFilter && filters.classFilter !== 'all') {
      result = result.filter(student => student.class_id === filters.classFilter);
    }
    
    // Apply incident filter
    if (filters.incidentFilter === 'with_incidents') {
      result = result.filter(student => (student.total_incidents || 0) > 0);
    } else if (filters.incidentFilter === 'without_incidents') {
      result = result.filter(student => (student.total_incidents || 0) === 0);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'admission':
          aValue = a.admission_number?.toLowerCase() || '';
          bValue = b.admission_number?.toLowerCase() || '';
          break;
        case 'incidents':
          aValue = a.total_incidents || 0;
          bValue = b.total_incidents || 0;
          break;
        case 'date':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'class':
          aValue = a.class_name?.toLowerCase() || '';
          bValue = b.class_name?.toLowerCase() || '';
          break;
        case 'name':
        default:
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return result;
  }, [students, filters]);
  
  // Update filtered students when computed value changes
  useEffect(() => {
    setFilteredStudents(computedFilteredStudents);
  }, [computedFilteredStudents]);
  
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
  
  // Fetch classes for filter dropdown
  const fetchClasses = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && globalClassesCache && (Date.now() - lastClassesFetchTime < CACHE_DURATION)) {
      setClasses(globalClassesCache);
      return;
    }
    
    setLoading(prev => ({ ...prev, classes: true }));
    
    try {
      const data = await classAPI.getClasses();
      if (data.success) {
        const classesList = data.data.classes || [];
        globalClassesCache = classesList;
        lastClassesFetchTime = Date.now();
        setClasses(classesList);
      } else {
        console.error('Failed to load classes:', data.message);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(prev => ({ ...prev, classes: false }));
    }
  }, []);
  
  // Fetch students
  const fetchStudents = useCallback(async (showLoading = true, forceRefresh = false) => {
    if (!forceRefresh && globalStudentsCache && (Date.now() - lastStudentsFetchTime < CACHE_DURATION)) {
      setStudents(globalStudentsCache);
      setLoading(prev => ({ ...prev, initial: false, refresh: false }));
      return;
    }

    if (showLoading) {
      setLoading(prev => ({ ...prev, initial: true }));
    }
    setError(null);
    
    try {
      // Always fetch all students - filtering will be done client-side
      const data = await studentAPI.getStudents();
      if (data.success) {
        const studentsList = data.data.students || [];
        globalStudentsCache = studentsList;
        lastStudentsFetchTime = Date.now();
        setStudents(studentsList);
        if (showLoading && studentsList.length > 0) {
          addToast('Students loaded successfully', 'success');
        }
      } else {
        setError(sanitizeErrorMessage(data.message, 'Failed to load students'));
        addToast(sanitizeErrorMessage(data.message, 'Failed to load students'), 'error');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Network error. Please try again.');
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        initial: false, 
        refresh: false 
      }));
    }
  }, [addToast]);
  
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
    fetchStudents(false, true);
    fetchClasses(true);
  }, [fetchStudents, fetchClasses]);
  
  // Open student modal
  const openStudentModal = useCallback((student, view = 'details') => {
    setSelectedStudent(student);
    setModalView(view);
    setIsModalOpen(true);
  }, []);
  
  // Close student modal
  const closeStudentModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setModalView('details');
  }, []);
  
  // Handle student update
  const handleStudentUpdate = useCallback((updatedStudent) => {
    setStudents(prev => {
      const newStudents = prev.map(student => 
        student.student_id === updatedStudent.student_id 
          ? { ...student, ...updatedStudent }
          : student
      );
      globalStudentsCache = newStudents;
      return newStudents;
    });
    addToast('Student updated successfully', 'success');
  }, [addToast]);
  
  // Handle student delete
  const handleStudentDelete = useCallback((studentId) => {
    setStudents(prev => {
      const newStudents = prev.filter(student => student.student_id !== studentId);
      globalStudentsCache = newStudents;
      return newStudents;
    });
    addToast('Student deleted successfully', 'success');
  }, [addToast]);
  
  // Calculate statistics
  const stats = calculateStudentStats(students);
  
  // Initial fetch
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);
  
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
      
      {/* Student Modal */}
      {isModalOpen && selectedStudent && (
        <StudentModal
          studentData={selectedStudent}
          isOpen={isModalOpen}
          onClose={closeStudentModal}
          onUpdate={handleStudentUpdate}
          onDelete={handleStudentDelete}
          view={modalView}
        />
      )}
      
      <div className="students-page-content" style={{ animation: 'fadeIn 0.3s ease' }}>
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
            Students Management
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: '#94a3b8',
            marginBottom: '1.5rem'
          }}>
            Manage all students in your school, view incidents, and perform administrative actions
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
                <span>Showing {filteredStudents.length} of {students.length} students</span>
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
          {/* Total Students Card */}
          <div className="stat-card" onClick={() => handleFilterChange('classFilter', 'all')}>
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
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Students</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalStudents}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Click to view all
            </div>
          </div>
          
          {/* Students with Incidents Card */}
          <div className="stat-card" onClick={() => handleFilterChange('incidentFilter', 'with_incidents')}>
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
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>With Incidents</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.studentsWithIncidents}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.studentsWithIncidents > 0 ? `${Math.round((stats.studentsWithIncidents / stats.totalStudents) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Students without Class Card */}
          <div className="stat-card" onClick={() => {
            // Find students without class
            const withoutClassStudents = students.filter(s => !s.class_id);
            setFilteredStudents(withoutClassStudents);
          }}>
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
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.studentsWithoutClass}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {stats.studentsWithoutClass > 0 ? `${Math.round((stats.studentsWithoutClass / stats.totalStudents) * 100)}% of total` : 'Click to view'}
            </div>
          </div>
          
          {/* Students with Active Punishments Card */}
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
                <ShieldAlert size={24} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Active Punishments</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.studentsWithActivePunishments}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              Currently serving punishments
            </div>
          </div>
        </div>
        
        {/* Students Table */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease-out'
        }}>

          {/* Filters above the table */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
            {/* Filter Toggle */}
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                padding: '0.875rem 1.25rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <Filter size={16} />
              {expandedFilters ? 'Hide Filters' : 'Show Filters'}
              {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedFilters && (
              <div style={{
                marginTop: '1rem',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Class Filter</label>
                    <select value={filters.classFilter} onChange={(e) => handleFilterChange('classFilter', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Classes</option>
                      {loading.classes ? (<option disabled>Loading classes...</option>) : classes.length === 0 ? (<option disabled>No classes available</option>) : (classes.map((classItem) => (<option key={classItem.class_id} value={classItem.class_id}>{classItem.class_name} ({classItem.student_count || 0} students)</option>)))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Incident Status</label>
                    <select value={filters.incidentFilter} onChange={(e) => handleFilterChange('incidentFilter', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="all">All Students</option>
                      <option value="with_incidents">With Incidents</option>
                      <option value="without_incidents">Without Incidents</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Sort By</label>
                    <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <option value="name">Name (A-Z)</option>
                      <option value="admission">Admission Number</option>
                      <option value="class">Class Name</option>
                      <option value="incidents">Incident Count</option>
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
                  {filters.classFilter !== 'all' && (<span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={10} />{(() => { const selectedClass = classes.find(c => c.class_id === filters.classFilter); return selectedClass ? selectedClass.class_name : 'Selected Class'; })()}</span>)}
                  {filters.incidentFilter !== 'all' && (<span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={10} />{filters.incidentFilter === 'with_incidents' ? 'With Incidents' : 'Without Incidents'}</span>)}
                  <button onClick={() => { setFilters({ search: '', classFilter: 'all', incidentFilter: 'all', sortBy: 'name', sortOrder: 'asc' }); }} style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '0.25rem 0.75rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Clear all</button>
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
                Students List
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
                  placeholder="Filter students..."
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
                  Loading students...
                </span>
              ) : error ? (
                <span style={{ color: '#fca5a5' }}>
                  <AlertCircle size={14} />
                  {error}
                </span>
              ) : (
                <span>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
          </div>
          
          {/* Table Content */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
            {loading.initial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p>Loading students...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#fca5a5' }}>{error}</p>
                <button
                  onClick={() => fetchStudents()}
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
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No students found</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {filters.search || filters.classFilter !== 'all' || filters.incidentFilter !== 'all'
                    ? 'Try changing your filters or search query' 
                    : 'No students have been added to your school yet'}
                </p>
                {(filters.search || filters.classFilter !== 'all' || filters.incidentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        classFilter: 'all',
                        incidentFilter: 'all',
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
                minWidth: '1000px'
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
                    }}>Admission</th>
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
                  {filteredStudents.map((student, index) => (
                    <tr 
                      key={student.student_id} 
                      className="table-row"
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                        cursor: 'pointer',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.15)'
                      }}
                      onClick={() => openStudentModal(student)}
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
                            background: student.total_incidents > 0 
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                              : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            flexShrink: 0
                          }}>
                            {getInitials(student.first_name, student.last_name)}
                          </div>
                          <div>
                            <div style={{ 
                              color: '#f1f5f9', 
                              fontWeight: '600',
                              marginBottom: '2px',
                              fontSize: '1.05rem'
                            }}>
                              {student.first_name} {student.last_name}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#94a3b8'
                            }}>
                              ID: {student.student_id?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <GraduationCap size={16} color="#94a3b8" />
                          <span style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: '500' }}>
                            {student.admission_number}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {student.class_name ? (
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
                              {student.class_name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color: '#f1f5f9', fontWeight: '500', marginBottom: '2px' }}>
                                {student.class_name}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Class
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
                            Not assigned to class
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={12} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              Total: <strong>{student.total_incidents || 0}</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldAlert size={12} color="#94a3b8" />
                            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                              Active Punishments: <strong>{student.active_punishments || 0}</strong>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#94a3b8" />
                          <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {formatDate(student.created_at)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openStudentModal(student, 'details');
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
                              openStudentModal(student, 'edit');
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
                            <Edit2 size={12} />
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
          {!loading.initial && !error && filteredStudents.length > 0 && (
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
                Showing {filteredStudents.length} of {students.length} students
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Sorted by:</span>
                <span style={{ color: '#cbd5e1', fontWeight: '500' }}>
                  {filters.sortBy === 'name' ? 'Name' : 
                   filters.sortBy === 'admission' ? 'Admission Number' : 
                   filters.sortBy === 'class' ? 'Class Name' : 
                   filters.sortBy === 'incidents' ? 'Incident Count' : 'Creation Date'} 
                  ({filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Empty State Instructions */}
        {!loading.initial && students.length === 0 && !error && (
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
              No Students Yet
            </h3>
            <p style={{ marginBottom: '1rem', maxWidth: '500px', margin: '0 auto 1rem' }}>
              You haven't added any students to your school yet. Students can be created from the Dashboard page or by teachers.
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
              <Home size={16} />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Students;