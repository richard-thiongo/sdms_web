import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { 
  Award, BookOpen, AlertCircle, 
  ChevronRight, Loader2, 
  CheckCircle, XCircle,
  User, GraduationCap, Users, TrendingUp, ShieldAlert
} from 'lucide-react';
import './Student.css';


const Main = () => {
  const navigate = useNavigate();
  const { 
    loading: contextLoading, 
    error: contextError, 
    dashboardData, 
    fetchDashboard
  } = useStudent();
  
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    if (contextError) {
      addToast(contextError, 'error');
    }
  }, [contextError, addToast]);

  useEffect(() => {
    fetchDashboard().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToIncidents = useCallback((type) => {
    navigate(`/student/incidents/${type}`);
  }, [navigate]);

  const viewIncident = useCallback((incidentId, type) => {
    navigate(`/student/incident/${incidentId}?type=${type}`);
  }, [navigate]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const Toast = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    if (!isVisible) return null;

    return (
      <div className={`student-toast ${type === 'success' ? 'student-toast-success' : 'student-toast-error'}`}>
        {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        <span className="student-toast-message">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="student-toast-close"
        >
          <XCircle size={18} />
        </button>
      </div>
    );
  };

  if (contextLoading.dashboard && !dashboardData) {
    return (
      <div className="student-loading-screen">
        <div className="student-loader-content">
          <Loader2 size={48} className="student-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const studentData = dashboardData?.student_info;

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

        <div className="student-dashboard-content">

          {studentData && (
            <div className="student-profile-card">
              <div className="student-profile-card-inner">
                <div className="student-profile-big-avatar">
                  {studentData.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                
                <div className="student-profile-details">
                  <h1 className="student-welcome-title">
                    Welcome back, {studentData.first_name}! 👋
                  </h1>
                  
                  <div className="student-info-row">
                    <div className="student-info-item">
                      <User size={16} />
                      <span>{studentData.full_name}</span>
                    </div>
                    <div className="student-info-item">
                      <GraduationCap size={16} />
                      <span>Admission: {studentData.admission_number}</span>
                    </div>
                    {studentData.class && (
                      <div className="student-info-item">
                        <Users size={16} />
                        <span>Class: {studentData.class.class_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="student-school-badge">
                  <div className="student-school-label">School</div>
                  <div className="student-school-value">
                    {studentData.school?.school_name || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {dashboardData?.statistics && (
            <div className="student-stats-grid">
              <StatCard
                icon={<AlertCircle size={24} color="#8b5cf6" />}
                title="Total Incidents"
                value={formatNumber(dashboardData.statistics.personal.total_incidents)}
                footer={
                  <div className="student-stat-footer-flex">
                    <span>Pending: {dashboardData.statistics.personal.pending_count}</span>
                    <span>Approved: {dashboardData.statistics.personal.approved_count}</span>
                    <span>Rejected: {dashboardData.statistics.personal.rejected_count}</span>
                  </div>
                }
              />

              <StatCard
                icon={<TrendingUp size={24} color="#f59e0b" />}
                title="Severity Breakdown"
                value={formatNumber(dashboardData.statistics.personal.severity_s_count + 
                       dashboardData.statistics.personal.severity_b_count + 
                       dashboardData.statistics.personal.severity_a_count)}
                footer={
                  <div className="student-stat-footer-col">
                    <div className="student-stat-footer-row">
                      <span className="student-text-s">S Tier (Highest)</span>
                      <span>{dashboardData.statistics.personal.severity_s_count}</span>
                    </div>
                    <div className="student-stat-footer-row">
                      <span className="student-text-b">B Tier</span>
                      <span>{dashboardData.statistics.personal.severity_b_count}</span>
                    </div>
                    <div className="student-stat-footer-row">
                      <span className="student-text-a">A Tier (Lowest)</span>
                      <span>{dashboardData.statistics.personal.severity_a_count}</span>
                    </div>
                  </div>
                }
              />

              <StatCard
                icon={<Award size={24} color="#22c55e" />}
                title="Punishments"
                value={formatNumber(dashboardData.statistics.personal.total_punishments)}
                footer={
                  <div className="student-stat-footer-flex">
                    <span>Completed: {dashboardData.statistics.personal.completed_punishments}</span>
                    <span>Rate: {dashboardData.statistics.personal.punishment_completion_rate}%</span>
                  </div>
                }
              />

              {dashboardData.statistics.class && (
                <StatCard
                  icon={<Users size={24} color="#3b82f6" />}
                  title="Class Incidents"
                  value={formatNumber(dashboardData.statistics.class.total_class_incidents || 0)}
                  footer={
                    <div className="student-stat-footer-col">
                      <div className="student-stat-footer-row">
                        <span className="student-text-s">S Tier</span>
                        <span>{dashboardData.statistics.class.severity_s_count || 0}</span>
                      </div>
                      <div className="student-stat-footer-row">
                        <span className="student-text-b">B Tier</span>
                        <span>{dashboardData.statistics.class.severity_b_count || 0}</span>
                      </div>
                      <div className="student-stat-footer-row">
                        <span className="student-text-a">A Tier</span>
                        <span>{dashboardData.statistics.class.severity_a_count || 0}</span>
                      </div>
                    </div>
                  }
                />
              )}
            </div>
          )}

          {dashboardData?.recent_incidents && (
            <div className="student-recent-grid">
              
              <IncidentSection
                title="Recent Personal Incidents"
                icon={<ShieldAlert size={18} color="#8b5cf6" />}
                incidents={dashboardData.recent_incidents.personal}
                onViewAll={() => goToIncidents('personal')}
                onViewIncident={viewIncident}
                type="personal"
              />
              
              <IncidentSection
                title="Recent Class Incidents"
                icon={<Users size={18} color="#3b82f6" />}
                incidents={dashboardData.recent_incidents.class}
                onViewAll={() => goToIncidents('class')}
                onViewIncident={viewIncident}
                type="class"
              />
            </div>
          )}

          <div className="student-actions-grid">
            <QuickActionButton
              icon={<ShieldAlert size={32} />}
              text="View My Incidents"
              color="#8b5cf6"
              onClick={() => goToIncidents('personal')}
            />

            {studentData?.class && (
              <QuickActionButton
                icon={<Users size={32} />}
                text="View Class Incidents"
                color="#3b82f6"
                onClick={() => goToIncidents('class')}
              />
            )}

            <QuickActionButton
              icon={<BookOpen size={32} />}
              text="View All Incidents"
              color="#22c55e"
              onClick={() => goToIncidents('all')}
            />
          </div>

        </div>
    </>
  );
};

const StatCard = ({ icon, title, value, footer }) => (
  <div className="student-stat-card">
    <div className="student-stat-top">
      <div className="student-stat-icon-wrap student-bg-purple-gradient">
        {icon}
      </div>
      <div className="student-stat-info">
        <div className="student-stat-title">{title}</div>
        <div className="student-stat-value">
          {value}
        </div>
      </div>
    </div>
    {footer && (
      <div className="student-stat-footer">
        {footer}
      </div>
    )}
  </div>
);

const IncidentSection = ({ title, icon, incidents, onViewAll, onViewIncident, type }) => (
  <div className="student-section-container">
    <div className="student-section-header">
      <h3 className="student-section-title">
        {icon}
        {title}
      </h3>
      <button
        onClick={onViewAll}
        className="student-view-all-btn"
      >
        View All <ChevronRight size={16} />
      </button>
    </div>

    <div className="student-section-body">
      {incidents.length === 0 ? (
        <div className="student-empty-state">
          <CheckCircle size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No incidents yet. Keep up the good work!</p>
        </div>
      ) : (
        incidents.map(incident => (
          <IncidentCard
            key={incident.incident_id}
            incident={incident}
            onClick={() => onViewIncident(incident.incident_id, type)}
          />
        ))
      )}
    </div>
  </div>
);

const IncidentCard = ({ incident, onClick }) => {
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

  return (
    <div
      className="student-incident-card"
      onClick={onClick}
    >
      <div className="student-incident-flex-col">
        <div className="student-incident-flex-row">
          <span 
            className="student-badge-base"
            style={severityStyle}
          >
            Severity {incident.severity} {incident.severity === 'S' ? '(Highest)' : incident.severity === 'A' ? '(Lowest)' : ''}
          </span>
          <span 
            className="student-badge-base"
            style={statusStyle}
          >
            {incident.status}
          </span>
        </div>
      </div>
      <p className="student-incident-desc-line">
        {incident.description}
      </p>
      {incident.punishment && (
        <div className="student-incident-punishment" style={{ color: incident.punishment.completed ? '#86efac' : '#fca5a5' }}>
          <Award size={12} />
          {incident.punishment.name} - {incident.punishment.completed ? 'Completed' : 'Pending'}
        </div>
      )}
    </div>
  );
};

const QuickActionButton = ({ icon, text, color, onClick }) => (
  <button
    className="student-action-btn"
    onClick={onClick}
    style={{
      background: `${color}10`,
      border: `1px solid ${color}30`,
      color: '#c4b5fd',
      boxShadow: `0 8px 20px -6px ${color}30`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `${color}25`;
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 12px 24px -6px ${color}50`;
      e.currentTarget.style.borderColor = `${color}60`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}10`;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default Main;