// Teacher/TeacherLists.jsx
import React, { useState, useEffect } from 'react';
import { useTeacher } from './TeacherContext';
import {
  Users, AlertTriangle, School, Search,
  ChevronLeft, ChevronRight, Eye, Trash2,
  Image, Loader2, FileText, Shield, ArrowLeft,
} from 'lucide-react';
import './Teacher.css';

const TeacherLists = ({ listType, onOpenModal, onNavigateToDashboard }) => {
  const {
    students,
    myIncidents,
    classIncidents,
    schoolIncidents,
    classLevelIncidents,
    schoolClassIncidents,
    loading,
    fetchClassStudents,
    fetchClassIncidents,
    fetchMyIncidents,
    fetchSchoolIncidents,
    fetchClassLevelIncidents,
    fetchSchoolClassIncidents,
    deleteIncident,
    deleteClassIncident,
    removeStudent,
  } = useTeacher();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [viewFilter, setViewFilter] = useState('class');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
    setViewFilter('class');
    setSearchQuery('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listType]);

  useEffect(() => {
    filterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, viewFilter, listType, students, classIncidents, myIncidents, schoolIncidents, classLevelIncidents, schoolClassIncidents]);

  const loadData = async () => {
    try {
      switch (listType) {
        case 'students':
          await fetchClassStudents();
          break;
        case 'incidents':
          await Promise.all([fetchClassIncidents(), fetchMyIncidents(), fetchSchoolIncidents()]);
          break;
        case 'classIncidentsList':
          await Promise.all([fetchClassLevelIncidents(), fetchSchoolClassIncidents()]);
          break;
        case 'myIncidents':
          await fetchMyIncidents();
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  };

  const getCurrentData = () => {
    switch (listType) {
      case 'students': return students;
      case 'incidents':
        return viewFilter === 'school' ? schoolIncidents : classIncidents;
      case 'classIncidentsList':
        return viewFilter === 'school' ? schoolClassIncidents : classLevelIncidents;
      case 'myIncidents': return myIncidents;
      default: return [];
    }
  };

  const filterData = () => {
    let data = getCurrentData();
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(item =>
        listType === 'students'
          ? item.first_name?.toLowerCase().includes(q) ||
            item.last_name?.toLowerCase().includes(q) ||
            item.admission_number?.toLowerCase().includes(q)
          : item.description?.toLowerCase().includes(q) ||
            item.class_name?.toLowerCase().includes(q) ||
            item.reported_by_teacher?.toLowerCase().includes(q) ||
            item.first_name?.toLowerCase().includes(q) ||
            item.last_name?.toLowerCase().includes(q)
      );
    }
    setFilteredData(data);
    setCurrentPage(1);
  };

  const getSeverityColor = (s) => {
    if (s === 'A') return '#10b981'; // Green to match SchAdmn
    if (s === 'B') return '#f59e0b'; // Yellow
    if (s === 'S') return '#8b5cf6'; // Purple (Highest)
    return '#94a3b8';
  };

  const formatDate = (ds) => {
    if (!ds) return '';
    return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (type === 'incident') await deleteIncident(id);
      else if (type === 'classIncident') await deleteClassIncident(id);
      else if (type === 'student') await removeStudent(id);
      await loadData();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // ── List items ───────────────────────────────────────────────────────────
  if (loading.incidents || loading.students) {
    return (
      <div className="teacher-loading-container">
        <Loader2 size={40} className="teacher-spin" />
        <p className="teacher-loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Sticky Header Container ── */}
      <div className="teacher-sticky-header">
        <div className="teacher-header">
        <div className="teacher-header-left">
          <button className="teacher-back-btn" onClick={onNavigateToDashboard}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="teacher-name">
            {listType === 'students' ? 'Students' :
             listType === 'incidents' ? 'Recent Incidents' :
             listType === 'myIncidents' ? 'My Reports' : 'Class Incidents'}
          </h1>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="teacher-controls-bar">
        <div className="teacher-search-wrap">
          <Search size={14} className="teacher-search-icon-pos" />
          <input
            className="teacher-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {(listType === 'incidents' || listType === 'classIncidentsList') && (
          <div className="teacher-filter-group">
            <button
              className={viewFilter === 'class' ? "teacher-filter-active" : "teacher-filter-btn"}
              onClick={() => setViewFilter('class')}
            >My Class</button>
            <button
              className={viewFilter === 'school' ? "teacher-filter-active" : "teacher-filter-btn"}
              onClick={() => setViewFilter('school')}
            >School</button>
          </div>
        )}
      </div>
      </div>

      {/* ── Results count ── */}
      <p className="teacher-count-text">{filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}</p>

      {/* ── Empty ── */}
      {filteredData.length === 0 ? (
        <div className="teacher-empty-state">
          <div className="teacher-empty-icon-box">
            {listType === 'students' ? <Users size={48} /> : <AlertTriangle size={48} />}
          </div>
          <h3 className="teacher-empty-title">No items found</h3>
          <p className="teacher-empty-desc">{searchQuery ? 'Try adjusting your search' : 'Nothing to show here yet'}</p>
        </div>
      ) : (
        <>
          {listType === 'students' && <StudentsList data={paginatedData} onOpenModal={onOpenModal} onDelete={handleDelete} />}
          {(listType === 'incidents' || listType === 'myIncidents') && (
            <IncidentsList data={paginatedData} onOpenModal={onOpenModal} onDelete={handleDelete} getSeverityColor={getSeverityColor} formatDate={formatDate} />
          )}
          {listType === 'classIncidentsList' && (
            <ClassIncidentsList data={paginatedData} onOpenModal={onOpenModal} onDelete={handleDelete} getSeverityColor={getSeverityColor} formatDate={formatDate} />
          )}
          {totalPages > 1 && (
            <div className="teacher-pagination">
              <button className="teacher-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft size={16} />
              </button>
              <span className="teacher-page-info">Page {currentPage} of {totalPages}</span>
              <button className="teacher-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Students sub-list ─────────────────────────────────────────────────────────
const StudentsList = ({ data, onOpenModal, onDelete }) => (
  <div className="teacher-cards-grid">
    {data.map(student => (
      <div key={student.student_id || student.admission_number} className="teacher-student-item">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', width: '100%' }}>
          <div className="teacher-student-avatar">
            <span className="teacher-student-avatar-text">{student.first_name?.charAt(0) || 'S'}</span>
          </div>
          <div className="teacher-student-info">
            <div className="teacher-student-name">{student.first_name} {student.last_name}</div>
            <div className="teacher-student-admission">{student.admission_number}</div>
          </div>
        </div>

        {student.incident_count > 0 && (
          <div className="teacher-incident-badge teacher-badge-flex">
            <AlertTriangle size={12} color="var(--teacher-error-light)" />
            <span className="teacher-incident-count">
              {student.incident_count} incident{student.incident_count > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {student.latest_incident_date && (
          <div className="teacher-date-text">
            Last incident: {new Date(student.latest_incident_date).toLocaleDateString()}
          </div>
        )}

        <div className="teacher-item-actions-v2">
          <button className="teacher-action-btn teacher-btn-secondary-sm" onClick={() => onOpenModal('studentDetails', student.admission_number)}>
            <Eye size={14} /> View
          </button>
          <button className="teacher-action-btn teacher-btn-secondary-sm" onClick={() => onOpenModal('reportIncident', student.admission_number)}>
            <AlertTriangle size={14} color="var(--teacher-primary)" /> Report
          </button>
          <button
            className="teacher-action-btn teacher-btn-danger-sm"
            onClick={() => onDelete(student.admission_number, 'student')}
          >
            <Trash2 size={14} color="var(--teacher-error)" /> <span>Remove</span>
          </button>
        </div>
      </div>
    ))}
  </div>
);

// ── Student incidents sub-list ────────────────────────────────────────────────
const IncidentsList = ({ data, onOpenModal, onDelete, getSeverityColor, formatDate }) => (
  <div className="teacher-list">
    {data.map(inc => (
      <div key={inc.incident_id} className="teacher-incident-item">
        <div className="teacher-incident-header">
          <div className="teacher-severity-row">
            <div className="teacher-severity-dot" style={{ background: getSeverityColor(inc.severity) }} />
            <span className="teacher-severity-text">Tier {inc.severity}</span>
            {inc.reported_by_me && <span className="teacher-my-badge">My Report</span>}
          </div>
          <span className="teacher-date-text">{formatDate(inc.created_at)}</span>
        </div>

        <div className="teacher-incident-student-row">
          <div className="teacher-small-avatar">
            <span className="teacher-small-avatar-text">{inc.first_name?.charAt(0) || 'S'}</span>
          </div>
          <div className="teacher-student-info">
            <div className="teacher-incident-student-name">{inc.first_name} {inc.last_name}</div>
            <div className="teacher-incident-admission">{inc.class_name} • {inc.admission_number}</div>
          </div>
        </div>

        <div className="teacher-incident-desc">
          {inc.description?.substring(0, 100)}{inc.description?.length > 100 ? '…' : ''}
        </div>

        {inc.reported_by_teacher && (
          <div className="teacher-reported-by">
            <FileText size={13} color="#64748b" />
            <span>Reported by: {inc.reported_by_teacher}</span>
          </div>
        )}

        {inc.punishment_name && (
          <div className="teacher-punishment-badge">
            <Shield size={13} color="#10b981" />
            <span>{inc.punishment_name}</span>
          </div>
        )}

        <div className="teacher-item-footer-v2">
          <div className="teacher-evidence-line">
            <Image size={13} color="var(--teacher-text-muted)" />
            <span>{inc.evidence_urls?.length || 0} evidence</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="teacher-action-btn teacher-btn-secondary-sm" onClick={() => onOpenModal('incidentDetails', inc.incident_id)}>
              <Eye size={13} /> View
            </button>
            {inc.reported_by_me && (
              <>
                <button className="teacher-action-btn teacher-btn-secondary-sm" onClick={() => onOpenModal('uploadEvidence', inc.incident_id)}>
                  <Image size={13} /> Evidence
                </button>
                <button
                  className="teacher-action-btn teacher-btn-danger-sm"
                  style={{ padding: '0.4rem 0.5rem' }}
                  onClick={() => onDelete(inc.incident_id, 'incident')}
                >
                  <Trash2 size={13} color="var(--teacher-error)" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Class incidents sub-list ──────────────────────────────────────────────────
const ClassIncidentsList = ({ data, onOpenModal, onDelete, getSeverityColor, formatDate }) => (
  <div className="teacher-list">
    {data.map(inc => (
      <div key={inc.class_incident_id} className="teacher-incident-item">
        <div className="teacher-incident-header">
          <div className="teacher-severity-row">
            <div className="teacher-severity-dot" style={{ background: getSeverityColor(inc.severity) }} />
            <span className="teacher-severity-text">Tier {inc.severity}</span>
            {inc.reported_by_me && <span className="teacher-my-badge">My Report</span>}
          </div>
          <span className="teacher-date-text">{formatDate(inc.created_at)}</span>
        </div>

        <div className="teacher-incident-class-row">
          <School size={14} color="#8b5cf6" />
          <span className="teacher-incident-class-name">{inc.class_name}</span>
        </div>

        <div className="teacher-incident-desc">
          {inc.description?.substring(0, 100)}{inc.description?.length > 100 ? '…' : ''}
        </div>

        {inc.reported_by_teacher && (
          <div className="teacher-reported-by">
            <FileText size={13} color="#64748b" />
            <span>Reported by: {inc.reported_by_teacher}</span>
          </div>
        )}

        {inc.punishment_name && (
          <div className="teacher-punishment-badge">
            <Shield size={13} color="#10b981" />
            <span>{inc.punishment_name}</span>
          </div>
        )}

        <div className="teacher-item-footer-v2">
          <div className="teacher-evidence-line">
            <Image size={13} color="var(--teacher-text-muted)" />
            <span>{inc.evidence_urls?.length || 0} evidence</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="teacher-action-btn teacher-btn-secondary-sm" onClick={() => onOpenModal('classIncidentDetails', inc.class_incident_id)}>
              <Eye size={13} /> View
            </button>
            {inc.reported_by_me && (
              <button
                className="teacher-action-btn teacher-btn-danger-sm"
                style={{ padding: '0.4rem 0.5rem' }}
                onClick={() => onDelete(inc.class_incident_id, 'classIncident')}
              >
                <Trash2 size={13} color="var(--teacher-error)" />
              </button>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default TeacherLists;
