// Teacher/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useTeacher } from './TeacherContext';
import {
  Users, AlertTriangle, FileText, School,
  UserPlus, ChevronRight, RefreshCw, Loader2,
  Shield,
} from 'lucide-react';
import './Teacher.css';

const TeacherDashboard = ({ onOpenModal, onNavigateToLists }) => {
  const {
    dashboardStats,
    students,
    classIncidents,
    classLevelIncidents,
    loading,
    fetchDashboardStats,
    fetchClassStudents,
    fetchClassIncidents,
    fetchClassLevelIncidents,
  } = useTeacher();

  const [refreshing, setRefreshing] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user_data') || localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        const name = parsed.full_name || parsed.name || parsed.first_name || 'Teacher';
        setTeacherName(name.split(' ')[0]);
      }
    } catch (e) {
      console.error('Error loading teacher name:', e);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchClassStudents(),
        fetchClassIncidents(),
        fetchClassLevelIncidents(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getSeverityColor = (s) => {
    if (s === 'A') return 'var(--teacher-success)';
    if (s === 'B') return 'var(--teacher-warning)';
    if (s === 'S') return 'var(--teacher-primary)';
    return 'var(--teacher-text-muted)';
  };

  const formatDate = (ds) => {
    if (!ds) return '';
    const d = new Date(ds);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const recentStudents = students.slice(0, 5);
  const recentIncidents = classIncidents.slice(0, 5);
  const recentClassIncidents = classLevelIncidents.slice(0, 5);

  if (loading.dashboard && !refreshing) {
    return (
      <div className="teacher-loading-container">
        <Loader2 size={48} className="teacher-spin" />
        <p className="teacher-loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Welcome Header ── */}
      <div className="teacher-welcome-row">
        <div className="teacher-welcome-left">
          <div className="teacher-avatar-circle">
            <span className="teacher-avatar-letter">{teacherName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="teacher-greeting">{getGreeting()}</p>
            <h1 className="teacher-name">{teacherName}</h1>
          </div>
        </div>
        <button onClick={handleRefresh} className="teacher-refresh-btn" disabled={refreshing}>
          {refreshing
            ? <Loader2 size={20} className="teacher-spin" />
            : <RefreshCw size={20} />}
        </button>
      </div>

      {/* ── Welcome Card (class + school) ── */}
      <div className="teacher-welcome-card">
        <div className="teacher-welcome-icon-box">
          <School size={28} color="#8b5cf6" />
        </div>
        <div>
          <p className="teacher-welcome-card-title">Class Dashboard</p>
          <p className="teacher-welcome-card-sub">
            {dashboardStats.class_name || 'Your Class'} • {dashboardStats.school_name || 'Your School'}
          </p>
        </div>
      </div>



      {/* ── Stats Row 1 ── */}
      <h2 className="teacher-section-title">Overview</h2>
      <div className="teacher-stats-grid">
        <div className="teacher-stat-card" onClick={() => onNavigateToLists('students')}>
          <div className="teacher-stat-icon teacher-stat-icon-blue">
            <Users size={22} />
          </div>
          <div className="teacher-flex-1">
            <p className="teacher-stat-label">Total Students</p>
            <p className="teacher-stat-value">{formatNumber(dashboardStats.total_students)}</p>
          </div>
        </div>

        <div className="teacher-stat-card" onClick={() => onNavigateToLists('incidents')}>
          <div className="teacher-stat-icon teacher-stat-icon-yellow">
            <AlertTriangle size={22} />
          </div>
          <div className="teacher-flex-1">
            <p className="teacher-stat-label">Student Incidents</p>
            <p className="teacher-stat-value">{formatNumber(dashboardStats.total_class_incidents)}</p>
          </div>
        </div>

        <div className="teacher-stat-card" onClick={() => onNavigateToLists('myIncidents')}>
          <div className="teacher-stat-icon teacher-stat-icon-green">
            <FileText size={22} />
          </div>
          <div className="teacher-flex-1">
            <p className="teacher-stat-label">My Reports</p>
            <p className="teacher-stat-value">{formatNumber(dashboardStats.my_incidents)}</p>
          </div>
        </div>

        <div className="teacher-stat-card" onClick={() => onNavigateToLists('classIncidentsList')}>
          <div className="teacher-stat-icon teacher-stat-icon-purple">
            <School size={22} />
          </div>
          <div className="teacher-flex-1">
            <p className="teacher-stat-label">Class Reports</p>
            <p className="teacher-stat-value">{formatNumber(dashboardStats.class_incidents)}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <h2 className="teacher-section-title">Quick Actions</h2>
      <div className="teacher-actions-grid">
        <button className="teacher-action-btn" onClick={() => onOpenModal('reportIncident')}>
          <div className="teacher-action-icon teacher-action-icon-red">
            <AlertTriangle size={24} />
          </div>
          <span className="teacher-action-text">Report a Student </span>
        </button>

        <button className="teacher-action-btn" onClick={() => onOpenModal('reportClassIncident')}>
          <div className="teacher-action-icon teacher-action-icon-blue">
            <School size={24} />
          </div>
          <span className="teacher-action-text">Report a Class</span>
        </button>

        <button className="teacher-action-btn" onClick={() => onOpenModal('assignStudent')}>
          <div className="teacher-action-icon teacher-action-icon-green">
            <UserPlus size={24} />
          </div>
          <span className="teacher-action-text">Add a Student</span>
        </button>
      </div>

      {/* ── Recent Students ── */}
      <div className="teacher-section">
        <div className="teacher-section-header">
          <h2 className="teacher-section-title">Recent Students</h2>
          <button className="teacher-see-all-btn" onClick={() => onNavigateToLists('students')}>
            View All <ChevronRight size={16} />
          </button>
        </div>

        {recentStudents.length > 0 ? (
          <div className="teacher-list">
            {recentStudents.map((s) => (
              <div
                key={s.student_id || s.admission_number}
                className="teacher-student-item"
                onClick={() => onOpenModal('studentDetails', s.admission_number)}
              >
                <div className="teacher-student-avatar">
                  <span className="teacher-student-avatar-text">{s.first_name?.charAt(0)}</span>
                </div>
                <div className="teacher-student-info">
                  <div className="teacher-student-name">{s.first_name} {s.last_name}</div>
                  <div className="teacher-student-admission">{s.admission_number}</div>
                </div>
                {s.incident_count > 0 && (
                  <div className="teacher-incident-badge">
                    <span className="teacher-incident-count">{s.incident_count}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users size={48} className="teacher-empty-icon-box" style={{ marginBottom: 0 }} />}
            title="No students yet"
            description="Assign students to your class to get started"
            actionLabel="Assign Student"
            onAction={() => onOpenModal('assignStudent')}
          />
        )}
      </div>

      {/* ── Recent Student Incidents ── */}
      <div className="teacher-section">
        <div className="teacher-section-header">
          <h2 className="teacher-section-title">Recent Student Incidents</h2>
          <button className="teacher-see-all-btn" onClick={() => onNavigateToLists('incidents')}>
            View All <ChevronRight size={16} />
          </button>
        </div>

        {recentIncidents.length > 0 ? (
          <div className="teacher-list">
            {recentIncidents.map((inc) => (
              <div
                key={inc.incident_id}
                className="teacher-incident-item"
                onClick={() => onOpenModal('incidentDetails', inc.incident_id)}
              >
                <div className="teacher-incident-header">
                  <div className="teacher-severity-row">
                    <div className="teacher-dot-indicator" style={{ background: getSeverityColor(inc.severity) }} />
                    <span className="teacher-severity-text">Tier {inc.severity}</span>
                    {inc.reported_by_me && <span className="teacher-my-badge">My Report</span>}
                  </div>
                  <span className="teacher-date-text">{formatDate(inc.created_at)}</span>
                </div>
                {/* Student name + admission */}
                <div className="teacher-incident-student-row">
                  <div className="teacher-small-avatar">
                    <span className="teacher-small-avatar-text">{inc.first_name?.charAt(0) || 'S'}</span>
                  </div>
                  <div className="teacher-student-info">
                    <div className="teacher-incident-student-name">{inc.first_name} {inc.last_name}</div>
                    <div className="teacher-incident-admission">{inc.admission_number}</div>
                  </div>
                </div>
                <div className="teacher-incident-desc">
                  {inc.description?.substring(0, 80)}{inc.description?.length > 80 ? '…' : ''}
                </div>
                {/* Reported by teacher */}
                {inc.reported_by_teacher && (
                  <div className="teacher-reported-by">
                    <FileText size={13} color="var(--teacher-text-muted)" />
                    <span>Reported by: {inc.reported_by_teacher}</span>
                  </div>
                )}
                {/* Punishment badge */}
                {inc.punishment_name && (
                  <div className="teacher-punishment-badge">
                    <Shield size={13} color="var(--teacher-success)" />
                    <span>{inc.punishment_name}</span>
                  </div>
                )}
                {/* Evidence count */}
                {inc.evidence_urls?.length > 0 && (
                  <div className="teacher-evidence-line">
                    <span>🖼 {inc.evidence_urls.length} evidence</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<AlertTriangle size={48} color="var(--teacher-success)" className="teacher-empty-icon-box" style={{ marginBottom: 0 }} />}
            title="No student incidents"
            description="Great job! Your students have no reported incidents"
            actionLabel="Report Incident"
            onAction={() => onOpenModal('reportIncident')}
          />
        )}
      </div>

      {/* ── Recent Class Incidents ── */}
      <div className="teacher-section">
        <div className="teacher-section-header">
          <h2 className="teacher-section-title">Recent Class Incidents</h2>
          <button className="teacher-see-all-btn" onClick={() => onNavigateToLists('classIncidentsList')}>
            View All <ChevronRight size={16} />
          </button>
        </div>

        {recentClassIncidents.length > 0 ? (
          <div className="teacher-list">
            {recentClassIncidents.map((inc) => (
              <div
                key={inc.class_incident_id}
                className="teacher-incident-item"
                onClick={() => onOpenModal('classIncidentDetails', inc.class_incident_id)}
              >
                <div className="teacher-incident-header">
                  <div className="teacher-severity-row">
                    <div className="teacher-dot-indicator" style={{ background: getSeverityColor(inc.severity) }} />
                    <span className="teacher-severity-text">Tier {inc.severity}</span>
                    {inc.reported_by_me && <span className="teacher-my-badge">My Report</span>}
                  </div>
                  <span className="teacher-date-text">{formatDate(inc.created_at)}</span>
                </div>
                <div className="teacher-incident-class-row">
                  <School size={14} color="var(--teacher-text-muted)" />
                  <span className="teacher-incident-class-name">{inc.class_name}</span>
                </div>
                <div className="teacher-incident-desc">
                  {inc.description?.substring(0, 80)}{inc.description?.length > 80 ? '…' : ''}
                </div>
                {inc.reported_by_teacher && (
                  <div className="teacher-reported-by">
                    <FileText size={13} color="var(--teacher-text-muted)" />
                    <span>Reported by: {inc.reported_by_teacher}</span>
                  </div>
                )}
                {inc.punishment_name && (
                  <div className="teacher-punishment-badge">
                    <Shield size={13} color="#10b981" />
                    <span>{inc.punishment_name}</span>
                  </div>
                )}
                {inc.evidence_urls?.length > 0 && (
                  <div className="teacher-evidence-line">
                    <span>🖼 {inc.evidence_urls.length} evidence</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<School size={48} color="var(--teacher-primary)" className="teacher-empty-icon-box" style={{ marginBottom: 0 }} />}
            title="No class incidents"
            description="Report incidents that involve the entire class"
            actionLabel="Report Class Incident"
            onAction={() => onOpenModal('reportClassIncident')}
          />
        )}
      </div>
    </div>
  );
};

// ── Shared empty state component ────────────────────────────────────────────
const EmptyState = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="teacher-empty-state">
    {icon}
    <h3 className="teacher-empty-title">{title}</h3>
    <p className="teacher-empty-desc">{description}</p>
    {actionLabel && (
      <button className="teacher-empty-btn" onClick={onAction}>{actionLabel}</button>
    )}
  </div>
);

export default TeacherDashboard;
