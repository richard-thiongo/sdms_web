import React, { useState, useEffect } from 'react';
import { 
  X, Users, AlertCircle, BookOpen, Calendar, Mail, 
  Loader2, Edit2, Trash2, ChevronRight, ChevronLeft,
  UserCheck, UserX, CheckCircle,
  Eye, ShieldAlert
} from 'lucide-react';
import { 
  classAPI, formatDate, formatDateTime, 
  getSeverityLabel, getPunishmentStatus 
} from './utils/classUtils';

const ClassModal = ({ classData, isOpen, onClose, onUpdate, onDelete, view = 'details' }) => {
  const [activeTab, setActiveTab] = useState(view === 'edit' ? 'edit' : 'overview');
  const [loading, setLoading] = useState({
    details: false,
    students: false,
    incidents: false,
    action: false
  });
  
  const [students, setStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [incidentsPage, setIncidentsPage] = useState(1);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [incidentsTotal, setIncidentsTotal] = useState(0);
  
  const [editForm, setEditForm] = useState({
    name: classData?.class_name || ''
  });
  const [editError, setEditError] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  
  const perPage = 10;
  
  // Fetch students for the class
  const fetchStudents = async (page = 1) => {
    if (!classData?.class_id) return;
    
    setLoading(prev => ({ ...prev, students: true }));
    try {
      const response = await classAPI.getClassStudents(classData.class_id, page, perPage);
      if (response.success) {
        setStudents(response.data.students || []);
        setStudentsTotal(response.data.pagination?.total || 0);
        setStudentsPage(page);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };
  
  // Fetch incidents for the class
  const fetchIncidents = async (page = 1) => {
    if (!classData?.class_id) return;
    
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const response = await classAPI.getClassIncidents(classData.class_id, page, perPage);
      if (response.success) {
        setIncidents(response.data.incidents || []);
        setIncidentsTotal(response.data.pagination?.total || 0);
        setIncidentsPage(page);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'students' && students.length === 0) {
      fetchStudents();
    }
    if (tab === 'incidents' && incidents.length === 0) {
      fetchIncidents();
    }
  };
  
  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Class name is required');
      return;
    }
    
    if (editForm.name === classData.class_name) {
      setEditError('No changes made');
      return;
    }
    
    setLoading(prev => ({ ...prev, action: true }));
    setEditError('');
    
    try {
      const response = await classAPI.updateClass(classData.class_id, { name: editForm.name });
      if (response.success) {
        onUpdate(response.data);
        setActiveTab('overview');
      } else {
        setEditError(response.message || 'Failed to update class');
      }
    } catch (error) {
      setEditError(error.message || 'Failed to update class');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (deleteInput !== classData.class_name) {
      setEditError('Please type the class name to confirm deletion');
      return;
    }
    
    setLoading(prev => ({ ...prev, action: true }));
    setEditError('');
    
    try {
      const response = await classAPI.deleteClass(classData.class_id);
      if (response.success) {
        onDelete(classData.class_id);
      } else {
        setEditError(response.message || 'Failed to delete class');
      }
    } catch (error) {
      setEditError(error.message || 'Failed to delete class');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  // Reset form when classData changes
  useEffect(() => {
    if (classData) {
      setEditForm({ name: classData.class_name || '' });
      setDeleteConfirm(false);
      setDeleteInput('');
      setEditError('');
    }
  }, [classData]);
  
  if (!isOpen || !classData) return null;
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'incidents', label: 'Incidents', icon: AlertCircle },
    { id: 'edit', label: 'Edit', icon: Edit2 }
  ];
  
  const stats = {
    totalStudents: classData.total_students || 0,
    totalClassIncidents: classData.total_class_incidents || 0,
    totalIndividualIncidents: classData.total_individual_incidents || 0
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{
        background: 'rgba(30, 41, 59, 0.9)',
        borderRadius: '24px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(24px)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#f1f5f9',
                marginBottom: '0.25rem'
              }}>
                {classData.class_name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Calendar size={12} />
                  Created: {formatDate(classData.created_at)}
                </span>
                {classData.teacher_id && (
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <UserCheck size={12} />
                    Teacher Assigned
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(15, 23, 42, 0.3)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  border: 'none',
                  color: isActive ? '#c4b5fd' : '#94a3b8',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  borderBottom: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
                {tab.label}
                {tab.id === 'students' && stats.totalStudents > 0 && (
                  <span style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#c4b5fd',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    marginLeft: '4px'
                  }}>
                    {stats.totalStudents}
                  </span>
                )}
                {tab.id === 'incidents' && (stats.totalClassIncidents + stats.totalIndividualIncidents) > 0 && (
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    marginLeft: '4px'
                  }}>
                    {stats.totalClassIncidents + stats.totalIndividualIncidents}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              {/* Statistics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
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
                </div>
                
                <div style={{
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
                      <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Class Incidents</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalClassIncidents}</div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
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
                      <ShieldAlert size={24} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Individual Incidents</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc' }}>{stats.totalIndividualIncidents}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Teacher Information */}
              {classData.teacher_id && (
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <UserCheck size={18} />
                    Class Teacher
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
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
                      {classData.teacher_first_name?.[0]}{classData.teacher_last_name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: '#f1f5f9',
                        fontWeight: '600',
                        fontSize: '1rem',
                        marginBottom: '4px'
                      }}>
                        {classData.teacher_first_name} {classData.teacher_last_name}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#94a3b8',
                        fontSize: '0.9rem'
                      }}>
                        <Mail size={14} />
                        {classData.teacher_email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Class Information */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <BookOpen size={18} />
                  Class Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Class ID</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                      {classData.class_id}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>School</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {classData.school_name || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Created</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {formatDateTime(classData.created_at)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Last Updated</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {formatDateTime(classData.updated_at) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Users size={18} />
                  Students in Class
                  <span style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#c4b5fd',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    marginLeft: '0.5rem'
                  }}>
                    {studentsTotal}
                  </span>
                </h3>
                
                {studentsTotal > perPage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => fetchStudents(studentsPage - 1)}
                      disabled={studentsPage <= 1 || loading.students}
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: loading.students || studentsPage <= 1 ? '#64748b' : '#cbd5e1',
                        cursor: loading.students || studentsPage <= 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading.students || studentsPage <= 1 ? 0.5 : 1
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', minWidth: '80px', textAlign: 'center' }}>
                      Page {studentsPage} of {Math.ceil(studentsTotal / perPage)}
                    </span>
                    <button
                      onClick={() => fetchStudents(studentsPage + 1)}
                      disabled={studentsPage >= Math.ceil(studentsTotal / perPage) || loading.students}
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: loading.students || studentsPage >= Math.ceil(studentsTotal / perPage) ? '#64748b' : '#cbd5e1',
                        cursor: loading.students || studentsPage >= Math.ceil(studentsTotal / perPage) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading.students || studentsPage >= Math.ceil(studentsTotal / perPage) ? 0.5 : 1
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              {loading.students ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                  <p>Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8'
                }}>
                  <UserX size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ marginBottom: '0.5rem' }}>No students in this class</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Students will appear here once assigned to this class</p>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600', fontSize: '0.9rem' }}>Student</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600', fontSize: '0.9rem' }}>Admission Number</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600', fontSize: '0.9rem' }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr 
                          key={student.student_id} 
                          style={{ 
                            borderBottom: index < students.length - 1 ? '1px solid rgba(148, 163, 184, 0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                flexShrink: 0
                              }}>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </div>
                              <div>
                                <div style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '2px' }}>
                                  {student.first_name} {student.last_name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                  ID: {student.student_id?.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
                            {student.admission_number}
                          </td>
                          <td style={{ padding: '1rem', color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {formatDate(student.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={18} />
                  Class Incidents
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    marginLeft: '0.5rem'
                  }}>
                    {incidentsTotal}
                  </span>
                </h3>
                
                {incidentsTotal > perPage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => fetchIncidents(incidentsPage - 1)}
                      disabled={incidentsPage <= 1 || loading.incidents}
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: loading.incidents || incidentsPage <= 1 ? '#64748b' : '#cbd5e1',
                        cursor: loading.incidents || incidentsPage <= 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading.incidents || incidentsPage <= 1 ? 0.5 : 1
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', minWidth: '80px', textAlign: 'center' }}>
                      Page {incidentsPage} of {Math.ceil(incidentsTotal / perPage)}
                    </span>
                    <button
                      onClick={() => fetchIncidents(incidentsPage + 1)}
                      disabled={incidentsPage >= Math.ceil(incidentsTotal / perPage) || loading.incidents}
                      style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: loading.incidents || incidentsPage >= Math.ceil(incidentsTotal / perPage) ? '#64748b' : '#cbd5e1',
                        cursor: loading.incidents || incidentsPage >= Math.ceil(incidentsTotal / perPage) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading.incidents || incidentsPage >= Math.ceil(incidentsTotal / perPage) ? 0.5 : 1
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              {loading.incidents ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                  <p>Loading incidents...</p>
                </div>
              ) : incidents.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8'
                }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ marginBottom: '0.5rem' }}>No incidents reported</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>This class has no reported incidents</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {incidents.map((incident) => {
                    const severity = getSeverityLabel(incident.severity);
                    const punishmentStatus = getPunishmentStatus(incident);
                    
                    return (
                      <div 
                        key={incident.class_incident_id}
                        style={{
                          background: 'rgba(30, 41, 59, 0.3)',
                          borderRadius: '12px',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          padding: '1.5rem',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = severity.color + '40';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.3)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{
                            background: severity.bgColor,
                            border: `1px solid ${severity.color}40`,
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            color: severity.color,
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <AlertCircle size={12} />
                            {severity.label}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              color: '#f1f5f9', 
                              fontWeight: '600',
                              marginBottom: '0.5rem',
                              fontSize: '1.05rem'
                            }}>
                              Class Incident
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                              {incident.description || 'No description provided'}
                            </div>
                          </div>
                          
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            {formatDateTime(incident.created_at)}
                          </div>
                        </div>
                        
                        {/* Reported By Teacher */}
                        {incident.teacher_id && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '8px'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              flexShrink: 0
                            }}>
                              {incident.teacher_first_name?.[0]}{incident.teacher_last_name?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '2px' }}>
                                Reported by {incident.teacher_first_name} {incident.teacher_last_name}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                Teacher
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Punishment Information */}
                        {incident.class_punishment_id && (
                          <div style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderRadius: '8px',
                            padding: '1rem',
                            borderLeft: `3px solid ${punishmentStatus.color}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldAlert size={16} color={punishmentStatus.color} />
                                <div style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '0.95rem' }}>
                                  {incident.punishment_name}
                                </div>
                              </div>
                              <div style={{
                                background: punishmentStatus.color + '20',
                                color: punishmentStatus.color,
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '999px',
                                fontWeight: '500'
                              }}>
                                {punishmentStatus.label}
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                              gap: '0.75rem',
                              color: '#94a3b8',
                              fontSize: '0.85rem'
                            }}>
                              <div>
                                <div style={{ marginBottom: '2px' }}>Assigned At</div>
                                <div style={{ color: '#cbd5e1' }}>{formatDateTime(incident.punishment_assigned_at)}</div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px' }}>Start Date</div>
                                <div style={{ color: '#cbd5e1' }}>{formatDate(incident.punishment_start_date)}</div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px' }}>End Date</div>
                                <div style={{ color: '#cbd5e1' }}>{formatDate(incident.punishment_end_date)}</div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px' }}>Assigned By</div>
                                <div style={{ color: '#cbd5e1' }}>
                                  {incident.assigned_by_first_name} {incident.assigned_by_last_name || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div style={{ animation: 'slideIn 0.3s ease', maxWidth: '500px', margin: '0 auto' }}>
              {!deleteConfirm ? (
                <>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Edit2 size={18} />
                    Edit Class Information
                  </h3>
                  
                  <form onSubmit={handleEditSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        color: '#cbd5e1',
                        marginBottom: '0.5rem',
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}>
                        Class Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => {
                          setEditForm({ name: e.target.value });
                          setEditError('');
                        }}
                        placeholder="Enter class name"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: editError ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = editError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {editError && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '1rem',
                        color: '#fca5a5',
                        fontSize: '0.9rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <AlertCircle size={16} />
                        {editError}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        type="submit"
                        disabled={loading.action}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.875rem',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          cursor: loading.action ? 'not-allowed' : 'pointer',
                          opacity: loading.action ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading.action) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading.action) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {loading.action ? (
                          <>
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(true)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          padding: '0.875rem 1.5rem',
                          color: '#fca5a5',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                          e.currentTarget.style.color = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.color = '#fca5a5';
                        }}
                      >
                        <Trash2 size={18} />
                        Delete Class
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#ef4444',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={18} />
                    Delete Class
                  </h3>
                  
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ color: '#fca5a5', fontWeight: '600', marginBottom: '0.75rem' }}>
                      Warning: This action cannot be undone!
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Deleting this class will:
                    </div>
                    <ul style={{ 
                      color: '#94a3b8', 
                      fontSize: '0.9rem',
                      paddingLeft: '1.25rem',
                      marginBottom: '1rem'
                    }}>
                      <li>Soft delete the class (it will be hidden from lists)</li>
                      <li>Remove class assignment from any teacher</li>
                      <li>Remove class assignment from all students</li>
                      <li>Class incidents will remain but won't be associated with the deleted class</li>
                    </ul>
                    <div style={{ color: '#fca5a5', fontSize: '0.9rem' }}>
                      Type the class name <strong>{classData.class_name}</strong> to confirm deletion:
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => {
                        setDeleteInput(e.target.value);
                        setEditError('');
                      }}
                      placeholder={`Type "${classData.class_name}" to confirm`}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: editError ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#ef4444';
                        e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = editError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  {editError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      color: '#fca5a5',
                      fontSize: '0.9rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <AlertCircle size={16} />
                      {editError}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={handleDelete}
                      disabled={loading.action || deleteInput !== classData.class_name}
                      style={{
                        flex: 1,
                        background: deleteInput !== classData.class_name 
                          ? 'rgba(239, 68, 68, 0.3)' 
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.875rem',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        cursor: loading.action || deleteInput !== classData.class_name ? 'not-allowed' : 'pointer',
                        opacity: loading.action ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading.action && deleteInput === classData.class_name) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading.action && deleteInput === classData.class_name) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {loading.action ? (
                        <>
                          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          Delete Class
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirm(false);
                        setDeleteInput('');
                        setEditError('');
                      }}
                      style={{
                        background: 'rgba(148, 163, 184, 0.1)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '0.875rem 1.5rem',
                        color: '#cbd5e1',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassModal;