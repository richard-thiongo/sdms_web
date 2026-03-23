import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, BookOpen, UserPlus, Plus, 
  Loader2, 
  CheckCircle, XCircle, AlertCircle,
  ArrowRight, Link as LinkIcon, GraduationCap, Mail
} from 'lucide-react';
import { managementAPI } from './utils/classUtils';
import './SchAdmn.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('classes');

  // 1. Storage-backed State
  const [classes, setClasses] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('schadmn_classes')) || []; } catch { return []; }
  });
  const [teachers, setTeachers] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('schadmn_teachers')) || []; } catch { return []; }
  });
  
  const [loading, setLoading] = useState(classes.length === 0 && teachers.length === 0);
  const [error, setError] = useState(null);
  
  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [availableTeachers, setAvailableTeachers] = useState([]);
  
  // Forms state
  const [classForm, setClassForm] = useState({ name: '' });
  const [teacherForm, setTeacherForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [assignForm, setAssignForm] = useState({ class_id: '', teacher_id: '' });

  // Toasts state
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(toast => toast.id !== id)); }, 5000);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const Toast = ({ message, type = 'success', onClose }) => {
    const [leaving, setLeaving] = useState(false);
    useEffect(() => {
      const t1 = setTimeout(() => setLeaving(true), 3800);
      const t2 = setTimeout(() => { if (onClose) onClose(); }, 4300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onClose]);
    const isSuccess = type === 'success';
    return (
      <div className={`schadmn-toast ${leaving ? 'schadmn-toast-leaving' : ''} ${isSuccess ? 'schadmn-toast-success' : 'schadmn-toast-error'}`}>
        <div className={`schadmn-toast-icon ${isSuccess ? 'success' : 'error'}`}>
          {isSuccess ? <CheckCircle size={14} color="#34d399" /> : <AlertCircle size={14} color="#f87171" />}
        </div>
        <span className="schadmn-toast-msg">{message}</span>
        <button onClick={() => { setLeaving(true); setTimeout(() => { if (onClose) onClose(); }, 450); }} className="schadmn-toast-close">
          <XCircle size={14} />
        </button>
      </div>
    );
  };

  const getSchoolId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.school_id;
    } catch { return null; }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    const schoolId = getSchoolId();
    if (!schoolId) {
      setError('School ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const [classesRes, teachersRes] = await Promise.all([
        managementAPI.getClasses(schoolId),
        managementAPI.getTeachers(schoolId)
      ]);
      
      const newClasses = classesRes.data || [];
      const newTeachers = teachersRes.data || [];
      
      setClasses(newClasses);
      setTeachers(newTeachers);
      
      sessionStorage.setItem('schadmn_classes', JSON.stringify(newClasses));
      sessionStorage.setItem('schadmn_teachers', JSON.stringify(newTeachers));
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const isCached = useRef(classes.length > 0 || teachers.length > 0);
  useEffect(() => {
    fetchData(isCached.current);
  }, [fetchData]);

  // Handle Class Creation
  const handleCreateClass = async (e) => {
    e.preventDefault();
    const schoolId = getSchoolId();
    try {
      await managementAPI.createClass({ ...classForm, school_id: schoolId });
      setIsClassModalOpen(false);
      setClassForm({ name: '' });
      addToast('Class created successfully', 'success');
      fetchData(true);
    } catch (err) {
      addToast(err.message || 'Error creating class', 'error');
    }
  };

  // Handle Teacher Creation
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    const schoolId = getSchoolId();
    try {
      await managementAPI.createTeacher({ ...teacherForm, school_id: schoolId });
      setIsTeacherModalOpen(false);
      setTeacherForm({ first_name: '', last_name: '', email: '', password: '' });
      addToast('Teacher registered successfully', 'success');
      fetchData(true);
    } catch (err) {
      addToast(err.message || 'Error creating teacher', 'error');
    }
  };

  // Open Assign Modal (Global)
  const openGlobalAssignModal = async (preselectedClassId = '') => {
    setAssignForm({ class_id: preselectedClassId, teacher_id: '' });
    setIsAssignModalOpen(true);
    try {
      const res = await managementAPI.getAvailableTeachers(getSchoolId(), true);
      setAvailableTeachers(res.data || []);
    } catch (err) {
      addToast('Failed to load available teachers', 'error');
    }
  };

  // Handle Assignment
  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!assignForm.class_id || !assignForm.teacher_id) {
      addToast('Please select both a class and a teacher', 'error');
      return;
    }
    try {
      await managementAPI.assignTeacherToClass({
        class_id: assignForm.class_id,
        teacher_id: assignForm.teacher_id
      });
      setIsAssignModalOpen(false);
      addToast('Teacher assigned successfully', 'success');
      fetchData(true);
    } catch (err) {
      addToast(err.message || 'Error assigning teacher', 'error');
    }
  };

  // Handle Unassign
  const handleUnassignTeacher = async (classId) => {
    if (!window.confirm('Are you sure you want to unassign the teacher from this class?')) return;
    try {
      await managementAPI.unassignTeacherFromClass(classId);
      addToast('Teacher unassigned successfully', 'success');
      fetchData(true);
    } catch (err) {
      addToast(err.message || 'Error unassigning teacher', 'error');
    }
  };

  if (loading && classes.length === 0 && teachers.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
    </div>;
  }

  const unassignedClasses = classes.filter(c => !c.class_teacher_id);

  return (
    <div className="schadmn-dashboard">
      {/* TOASTS */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}

      <div className="schadmn-section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="schadmn-head-title">
            Admin Management Dashboard
          </h1>
          <p className="schadmn-head-sub">Configure your school's structural foundation</p>
        </div>
        {/* Refresh button removed entirely */}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #f87171', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* WORKFLOW SETUP */}
      <div className="schadmn-workflow-container">
        <h2 className="schadmn-section-title">Setup Workflow</h2>
        <div className="schadmn-workflow-grid">
          <div className="schadmn-workflow-step" onClick={() => setIsClassModalOpen(true)}>
            <div className="step-number">1</div>
            <div className="step-icon"><BookOpen size={24} /></div>
            <h3>Create Class</h3>
            <p>Start by creating a class</p>
          </div>
          <div className="workflow-arrow"><ArrowRight size={24} /></div>
          
          <div className="schadmn-workflow-step" onClick={() => setIsTeacherModalOpen(true)}>
            <div className="step-number">2</div>
            <div className="step-icon"><UserPlus size={24} /></div>
            <h3>Register Teacher</h3>
            <p>Add a new teacher account</p>
          </div>
          <div className="workflow-arrow"><ArrowRight size={24} /></div>
          
          <div className="schadmn-workflow-step" onClick={() => openGlobalAssignModal('')}>
            <div className="step-number">3</div>
            <div className="step-icon"><LinkIcon size={24} /></div>
            <h3>Assign Teacher</h3>
            <p>Link a teacher to a class</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="schadmn-tabs" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => setActiveTab('classes')}
          className={`schadmn-tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: activeTab === 'classes' ? 'var(--schadmin-primary)' : 'var(--schadmin-text-secondary)', fontWeight: '600', cursor: 'pointer', borderBottom: activeTab === 'classes' ? '3px solid var(--schadmin-primary)' : '3px solid transparent' }}>
          <BookOpen size={18} /> Classes
        </button>
        <button 
          onClick={() => setActiveTab('teachers')}
          className={`schadmn-tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: activeTab === 'teachers' ? 'var(--schadmin-primary)' : 'var(--schadmin-text-secondary)', fontWeight: '600', cursor: 'pointer', borderBottom: activeTab === 'teachers' ? '3px solid var(--schadmin-primary)' : '3px solid transparent' }}>
          <Users size={18} /> Teachers
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'classes' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <div className="schadmn-section-header">
            <h2 className="schadmn-section-title">Classes ({classes.length})</h2>
            <button onClick={() => setIsClassModalOpen(true)} className="schadmn-primary-btn" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}}>
              <Plus size={16} /> Add Class
            </button>
          </div>
          
          {classes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--schadmin-text-secondary)', background: 'rgba(15,23,42,0.3)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
              No classes found. Create one to get started.
            </div>
          ) : (
            <div className="schadmn-table-container">
              <table className="schadmn-table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Teacher</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => (
                    <tr key={cls.class_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <BookOpen size={16} />
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontWeight: '600', color: 'var(--schadmin-text)'}}>{cls.class_name}</span>
                            <span style={{fontSize: '0.75rem', color: 'var(--schadmin-text-secondary)'}}>ID: {cls.class_id.substring(0,8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {cls.class_teacher_id ? (
                          <div className="schadmn-badge success" style={{display: 'inline-flex'}}>
                            <CheckCircle size={14} /> 
                            {cls.teacher_first_name} {cls.teacher_last_name}
                          </div>
                        ) : (
                          <div className="schadmn-badge warning" style={{display: 'inline-flex'}}>
                            <XCircle size={14} /> Unassigned
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {cls.class_teacher_id ? (
                          <button onClick={() => handleUnassignTeacher(cls.class_id)} className="schadmn-action-btn schadmn-btn-danger">Unassign Teacher</button>
                        ) : (
                          <button onClick={() => openGlobalAssignModal(cls.class_id)} className="schadmn-action-btn schadmn-btn-info">Assign Teacher</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teachers' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <div className="schadmn-section-header">
            <h2 className="schadmn-section-title">Teachers ({teachers.length})</h2>
            <button onClick={() => setIsTeacherModalOpen(true)} className="schadmn-primary-btn" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}}>
              <UserPlus size={16} /> Add Teacher
            </button>
          </div>
          
          {teachers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--schadmin-text-secondary)', background: 'rgba(15,23,42,0.3)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
              No teachers found. Register one to get started.
            </div>
          ) : (
            <div className="schadmn-table-container">
              <table className="schadmn-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Assigned Class</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(teacher => (
                    <tr key={teacher.user_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                            {teacher.first_name[0]}{teacher.last_name[0]}
                          </div>
                          <span style={{fontWeight: '600', color: 'var(--schadmin-text)'}}>{teacher.first_name} {teacher.last_name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--schadmin-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={14}/> {teacher.email}
                        </div>
                      </td>
                      <td>
                        {teacher.assigned_class_name ? (
                          <div className="schadmn-badge success" style={{display: 'inline-flex'}}>
                            <GraduationCap size={14} /> 
                            {teacher.assigned_class_name}
                          </div>
                        ) : (
                          <span className="schadmn-badge muted">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Create Class Modal */}
      {isClassModalOpen && (
        <div className="schadmn-modal-overlay">
          <div className="schadmn-modal-content">
            <h3 className="schadmn-modal-title">Create New Class</h3>
            <form onSubmit={handleCreateClass}>
              <div className="schadmn-input-group">
                <label className="schadmn-label">Class Name</label>
                <input type="text" value={classForm.name} onChange={(e) => setClassForm({ name: e.target.value })} required placeholder="e.g. Form 1A" className="schadmn-input" />
              </div>
              <div className="schadmn-modal-actions">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="schadmn-cancel-btn">Cancel</button>
                <button type="submit" className="schadmn-primary-btn">Create Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="schadmn-modal-overlay">
          <div className="schadmn-modal-content" style={{ maxWidth: '500px' }}>
            <h3 className="schadmn-modal-title">Register Teacher</h3>
            <form onSubmit={handleCreateTeacher}>
              <div className="schadmn-input-row">
                <div style={{ flex: 1 }}>
                  <label className="schadmn-label">First Name</label>
                  <input type="text" value={teacherForm.first_name} onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })} required className="schadmn-input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="schadmn-label">Last Name</label>
                  <input type="text" value={teacherForm.last_name} onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })} required className="schadmn-input" />
                </div>
              </div>
              <div className="schadmn-input-group">
                <label className="schadmn-label">Email</label>
                <input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} required className="schadmn-input" />
              </div>
              <div className="schadmn-input-group">
                <label className="schadmn-label">Password</label>
                <input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} required minLength="8" className="schadmn-input" />
              </div>
              <div className="schadmn-modal-actions">
                <button type="button" onClick={() => setIsTeacherModalOpen(false)} className="schadmn-cancel-btn">Cancel</button>
                <button type="submit" className="schadmn-primary-btn">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal (Global) */}
      {isAssignModalOpen && (
        <div className="schadmn-modal-overlay">
          <div className="schadmn-modal-content">
            <h3 className="schadmn-modal-title">Assign Teacher to Class</h3>
            <form onSubmit={handleAssignTeacher}>
              
              <div className="schadmn-input-group">
                <label className="schadmn-label">Select Class</label>
                <select value={assignForm.class_id} onChange={(e) => setAssignForm({ ...assignForm, class_id: e.target.value })} required className="schadmn-input" style={{ appearance: 'auto' }}>
                  <option value="">-- Choose an unassigned class --</option>
                  {unassignedClasses.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                  ))}
                </select>
                {unassignedClasses.length === 0 && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>No unassigned classes available.</p>
                )}
              </div>

              <div className="schadmn-input-group" style={{marginTop: '1.5rem'}}>
                <label className="schadmn-label">Select Teacher</label>
                <select value={assignForm.teacher_id} onChange={(e) => setAssignForm({ ...assignForm, teacher_id: e.target.value })} required className="schadmn-input" style={{ appearance: 'auto' }}>
                  <option value="">-- Choose an available teacher --</option>
                  {availableTeachers.map(t => (
                    <option key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name} ({t.email})</option>
                  ))}
                </select>
                {availableTeachers.length === 0 && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>No available teachers. Please register a new teacher.</p>
                )}
              </div>

              <div className="schadmn-modal-actions">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="schadmn-cancel-btn">Cancel</button>
                <button type="submit" disabled={availableTeachers.length === 0 || unassignedClasses.length === 0} className="schadmn-primary-btn" style={{ opacity: (availableTeachers.length === 0 || unassignedClasses.length === 0) ? 0.5 : 1, cursor: (availableTeachers.length === 0 || unassignedClasses.length === 0) ? 'not-allowed' : 'pointer' }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
