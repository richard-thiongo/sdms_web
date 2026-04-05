"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _lucideReact = require("lucide-react");
var _AandBincidentModal = _interopRequireDefault(require("./AandBincidentModal"));
var _incidentUtils = require("./utils/incidentUtils");
var _errorUtils = require("../utils/errorUtils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const AandBincidents = () => {
  const [incidents, setIncidents] = (0, _react.useState)([]);
  const [filteredIncidents, setFilteredIncidents] = (0, _react.useState)([]);
  const [loading, setLoading] = (0, _react.useState)({
    initial: true,
    refresh: false,
    action: false
  });
  const [error, setError] = (0, _react.useState)(null);
  const [selectedIncident, setSelectedIncident] = (0, _react.useState)(null);
  const [isModalOpen, setIsModalOpen] = (0, _react.useState)(false);
  const [modalView, setModalView] = (0, _react.useState)('details');
  const [filters, setFilters] = (0, _react.useState)({
    search: '',
    severityFilter: 'all',
    statusFilter: 'all',
    punishmentFilter: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [expandedFilters, setExpandedFilters] = (0, _react.useState)(false);
  const [toasts, setToasts] = (0, _react.useState)([]);
  const toastIdCounter = (0, _react.useRef)(0);
  const statsGridRef = (0, _react.useRef)(null);
  const addToast = (0, _react.useCallback)((message, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
    return id;
  }, []);
  const removeToast = (0, _react.useCallback)(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  const computedFilteredIncidents = (0, _react.useMemo)(() => {
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
        case 'with_punishment':
          result = result.filter(i => i.punishment_id);
          break;
        case 'without_punishment':
          result = result.filter(i => !i.punishment_id);
          break;
        case 'active':
          result = result.filter(i => {
            if (!i.punishment_id || i.punishment_completed) return false;
            if (!i.punishment_end_date) return true;
            return new Date(i.punishment_end_date) >= new Date();
          });
          break;
        case 'completed':
          result = result.filter(i => i.punishment_completed);
          break;
        case 'overdue':
          result = result.filter(i => {
            if (!i.punishment_id || i.punishment_completed) return false;
            if (!i.punishment_end_date) return false;
            return new Date(i.punishment_end_date) < new Date();
          });
          break;
        default:
          break;
      }
    }
    result.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'severity':
          aValue = a.severity === 'A' ? 0 : 1;
          bValue = b.severity === 'A' ? 0 : 1;
          break;
        case 'status':
          const so = {
            'pending': 0,
            'rejected': 1
          };
          aValue = so[a.status] || 2;
          bValue = so[b.status] || 2;
          break;
        case 'student':
          aValue = `${a.student_first_name || ''} ${a.student_last_name || ''}`.toLowerCase();
          bValue = `${b.student_first_name || ''} ${b.student_last_name || ''}`.toLowerCase();
          break;
        case 'class':
          aValue = a.class_name?.toLowerCase() || '';
          bValue = b.class_name?.toLowerCase() || '';
          break;
        default:
          aValue = new Date(a.incident_created_at || a.created_at || 0);
          bValue = new Date(b.incident_created_at || b.created_at || 0);
          break;
      }
      return filters.sortOrder === 'asc' ? aValue > bValue ? 1 : -1 : aValue < bValue ? 1 : -1;
    });
    return result;
  }, [incidents, filters]);
  (0, _react.useEffect)(() => {
    setFilteredIncidents(computedFilteredIncidents);
  }, [computedFilteredIncidents]);
  const fetchIncidents = (0, _react.useCallback)(async (showLoading = true) => {
    if (showLoading) setLoading(prev => ({
      ...prev,
      initial: true
    }));
    setError(null);
    try {
      const data = await _incidentUtils.incidentAPI.getIncidents({
        severity: filters.severityFilter !== 'all' ? filters.severityFilter : undefined
      });
      if (data.success) {
        setIncidents(data.data.incidents || []);
        if (showLoading) addToast('A/B incidents loaded successfully', 'success');
      } else {
        setError((0, _errorUtils.sanitizeErrorMessage)(data.message, 'Failed to load incidents'));
        addToast((0, _errorUtils.sanitizeErrorMessage)(data.message, 'Failed to load incidents'), 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({
        ...prev,
        initial: false,
        refresh: false
      }));
    }
  }, [filters.severityFilter, addToast]);
  const handleFilterChange = (0, _react.useCallback)((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  const handleSearch = (0, _react.useCallback)(value => {
    handleFilterChange('search', value);
  }, [handleFilterChange]);
  const handleRefresh = (0, _react.useCallback)(() => {
    setLoading(prev => ({
      ...prev,
      refresh: true
    }));
    fetchIncidents(false);
  }, [fetchIncidents]);
  const openIncidentModal = (0, _react.useCallback)((incident, view = 'details') => {
    setSelectedIncident(incident);
    setModalView(view);
    setIsModalOpen(true);
  }, []);
  const closeIncidentModal = (0, _react.useCallback)(() => {
    setIsModalOpen(false);
    setSelectedIncident(null);
    setModalView('details');
  }, []);
  const handleStatusUpdate = (0, _react.useCallback)(async (incidentId, status) => {
    setLoading(prev => ({
      ...prev,
      action: true
    }));
    try {
      const result = await _incidentUtils.incidentAPI.updateIncidentStatus(incidentId, status);
      if (result.success) {
        setIncidents(prev => prev.map(i => i.incident_id === incidentId ? {
          ...i,
          status,
          updated_at: new Date().toISOString()
        } : i));
        addToast(`Incident ${status === 'approved' ? 'approved' : 'rejected'} successfully`, 'success');
        closeIncidentModal();
      } else {
        addToast((0, _errorUtils.sanitizeErrorMessage)(result.message, 'Failed to update incident status'), 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({
        ...prev,
        action: false
      }));
    }
  }, [addToast, closeIncidentModal]);
  const stats = (0, _incidentUtils.calculateIncidentStats)(incidents);
  (0, _react.useEffect)(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // New Toast Component
  const Toast = ({
    message,
    type = 'success',
    onClose
  }) => {
    const [leaving, setLeaving] = (0, _react.useState)(false);
    (0, _react.useEffect)(() => {
      const t1 = setTimeout(() => setLeaving(true), 3800);
      const t2 = setTimeout(() => {
        if (onClose) onClose();
      }, 4300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [onClose]);
    const isSuccess = type === 'success';
    return /*#__PURE__*/_react.default.createElement("div", {
      style: {
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
        background: isSuccess ? 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.22))' : 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(185,28,28,0.22))',
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isSuccess ? '0 8px 32px rgba(16,185,129,0.18),0 2px 8px rgba(0,0,0,0.25)' : '0 8px 32px rgba(239,68,68,0.18),0 2px 8px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',
        maxWidth: '90vw'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`
      }
    }, isSuccess ? /*#__PURE__*/_react.default.createElement(_lucideReact.CheckCircle, {
      size: 14,
      color: "#34d399"
    }) : /*#__PURE__*/_react.default.createElement(_lucideReact.AlertCircle, {
      size: 14,
      color: "#f87171"
    })), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        fontSize: '0.875rem',
        fontWeight: '500',
        color: isSuccess ? '#a7f3d0' : '#fca5a5',
        letterSpacing: '0.01em'
      }
    }, message), /*#__PURE__*/_react.default.createElement("button", {
      onClick: () => {
        setLeaving(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 450);
      },
      style: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0 0 0 0.25rem',
        display: 'flex',
        alignItems: 'center',
        color: isSuccess ? '#6ee7b7' : '#fca5a5',
        opacity: 0.7
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.XCircle, {
      size: 14
    })));
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
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("style", null, styles), toasts.map(toast => /*#__PURE__*/_react.default.createElement(Toast, {
    key: toast.id,
    message: toast.message,
    type: toast.type,
    onClose: () => removeToast(toast.id)
  })), isModalOpen && selectedIncident && /*#__PURE__*/_react.default.createElement(_AandBincidentModal.default, {
    incidentData: selectedIncident,
    isOpen: isModalOpen,
    onClose: closeIncidentModal,
    onUpdate: handleStatusUpdate,
    view: modalView
  }), /*#__PURE__*/_react.default.createElement("div", {
    className: "incidents-page-content",
    style: {
      animation: 'fadeIn 0.3s ease'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      marginBottom: '2rem',
      animation: 'fadeIn 0.5s ease'
    }
  }, /*#__PURE__*/_react.default.createElement("h1", {
    style: {
      fontSize: 'clamp(1.75rem,5vw,2.5rem)',
      fontWeight: '800',
      color: '#f8fafc',
      marginBottom: '0.5rem'
    }
  }, "A/B Incidents Management"), /*#__PURE__*/_react.default.createElement("p", {
    style: {
      fontSize: 'clamp(0.9rem,2vw,1rem)',
      color: '#94a3b8',
      marginBottom: '1.5rem'
    }
  }, "Monitor and manage A & B tier incidents across your school with detailed analytics"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#94a3b8',
      fontSize: '0.9rem'
    }
  }, /*#__PURE__*/_react.default.createElement("span", null, "Showing ", filteredIncidents.length, " of ", incidents.length, " incidents"), loading.refresh && /*#__PURE__*/_react.default.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Loader2, {
    size: 12,
    style: {
      animation: 'spin 1s linear infinite'
    }
  }), "Refreshing...")), /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleRefresh,
    disabled: loading.refresh,
    style: {
      background: 'rgba(30,41,59,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
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
    },
    onMouseEnter: e => {
      if (!loading.refresh) {
        e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
        e.currentTarget.style.color = '#f1f5f9';
      }
    },
    onMouseLeave: e => {
      if (!loading.refresh) {
        e.currentTarget.style.background = 'rgba(30,41,59,0.8)';
        e.currentTarget.style.color = '#cbd5e1';
      }
    }
  }, loading.refresh ? /*#__PURE__*/_react.default.createElement(_lucideReact.Loader2, {
    size: 16,
    style: {
      animation: 'spin 1s linear infinite'
    }
  }) : /*#__PURE__*/_react.default.createElement(_lucideReact.RefreshCw, {
    size: 16
  }), "Refresh Data"))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      marginBottom: '2rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "stats-grid",
    ref: statsGridRef
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(139,92,246,0.2))',
      borderRadius: '10px',
      padding: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertTriangle, {
    size: 24,
    color: "#8b5cf6"
  })), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '1rem',
      color: '#94a3b8',
      marginBottom: '0.25rem'
    }
  }, "Total A/B Incidents"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#f8fafc'
    }
  }, stats.totalIncidents))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      color: '#94a3b8',
      fontSize: '0.85rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#10b981'
    }
  }), /*#__PURE__*/_react.default.createElement("span", null, "A-Tier: ", stats.aTierCount)), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#f59e0b'
    }
  }), /*#__PURE__*/_react.default.createElement("span", null, "B-Tier: ", stats.bTierCount)))), /*#__PURE__*/_react.default.createElement("div", {
    className: "stat-card",
    onClick: () => handleFilterChange('statusFilter', 'pending')
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.2))',
      borderRadius: '10px',
      padding: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Clock, {
    size: 24,
    color: "#f59e0b"
  })), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '1rem',
      color: '#94a3b8',
      marginBottom: '0.25rem'
    }
  }, "Pending Review"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#f8fafc'
    }
  }, stats.pendingCount))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      color: '#94a3b8',
      fontSize: '0.85rem'
    }
  }, stats.pendingCount > 0 ? `${Math.round(stats.pendingCount / stats.totalIncidents * 100)}% of total` : 'Click to view')), /*#__PURE__*/_react.default.createElement("div", {
    className: "stat-card",
    onClick: () => handleFilterChange('punishmentFilter', 'with_punishment')
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.2))',
      borderRadius: '10px',
      padding: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.ShieldAlert, {
    size: 24,
    color: "#3b82f6"
  })), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '1rem',
      color: '#94a3b8',
      marginBottom: '0.25rem'
    }
  }, "With Punishment"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#f8fafc'
    }
  }, stats.withPunishment))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      color: '#94a3b8',
      fontSize: '0.85rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#10b981'
    }
  }), /*#__PURE__*/_react.default.createElement("span", null, "Active: ", stats.activePunishments)), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ef4444'
    }
  }), /*#__PURE__*/_react.default.createElement("span", null, "Overdue: ", stats.overduePunishments)))), /*#__PURE__*/_react.default.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.2))',
      borderRadius: '10px',
      padding: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.BarChart3, {
    size: 24,
    color: "#10b981"
  })), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '1rem',
      color: '#94a3b8',
      marginBottom: '0.25rem'
    }
  }, "Status Distribution"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#f8fafc'
    }
  }, stats.rejectedCount))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      color: '#94a3b8',
      fontSize: '0.85rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#f59e0b'
    }
  }), /*#__PURE__*/_react.default.createElement("span", null, "Pending: ", stats.pendingCount)), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ef4444'
    }
  }), /*#__PURE__*/_react.default.createElement("span", null, "Rejected: ", stats.rejectedCount)))))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      background: 'rgba(30,41,59,0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(148,163,184,0.1)',
      overflow: 'hidden',
      animation: 'fadeIn 0.5s ease-out'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid rgba(148,163,184,0.08)'
    }
  }, /*#__PURE__*/_react.default.createElement("button", {
    onClick: () => setExpandedFilters(!expandedFilters),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(30,41,59,0.4)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '12px',
      padding: '0.875rem 1.25rem',
      color: '#cbd5e1',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'rgba(30,41,59,0.6)';
      e.currentTarget.style.color = '#f8fafc';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'rgba(30,41,59,0.4)';
      e.currentTarget.style.color = '#cbd5e1';
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Filter, {
    size: 16
  }), expandedFilters ? 'Hide Filters' : 'Show Filters', expandedFilters ? /*#__PURE__*/_react.default.createElement(_lucideReact.ChevronUp, {
    size: 16
  }) : /*#__PURE__*/_react.default.createElement(_lucideReact.ChevronDown, {
    size: 16
  })), expandedFilters && /*#__PURE__*/_react.default.createElement("div", {
    style: {
      marginTop: '1rem',
      background: 'rgba(15,23,42,0.4)',
      borderRadius: '12px',
      padding: '1.25rem',
      border: '1px solid rgba(148,163,184,0.1)',
      animation: 'fadeIn 0.3s ease'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", {
    style: {
      display: 'block',
      color: '#cbd5e1',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500'
    }
  }, "Severity"), /*#__PURE__*/_react.default.createElement("select", {
    value: filters.severityFilter,
    onChange: e => handleFilterChange('severityFilter', e.target.value),
    style: {
      width: '100%',
      padding: '0.75rem',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/_react.default.createElement("option", {
    value: "all"
  }, "All Severities (A & B)"), /*#__PURE__*/_react.default.createElement("option", {
    value: "A"
  }, "A-Tier Only (Green)"), /*#__PURE__*/_react.default.createElement("option", {
    value: "B"
  }, "B-Tier Only (Yellow)"))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", {
    style: {
      display: 'block',
      color: '#cbd5e1',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500'
    }
  }, "Status"), /*#__PURE__*/_react.default.createElement("select", {
    value: filters.statusFilter,
    onChange: e => handleFilterChange('statusFilter', e.target.value),
    style: {
      width: '100%',
      padding: '0.75rem',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/_react.default.createElement("option", {
    value: "all"
  }, "All Statuses"), /*#__PURE__*/_react.default.createElement("option", {
    value: "pending"
  }, "Pending Review"), /*#__PURE__*/_react.default.createElement("option", {
    value: "rejected"
  }, "Rejected"))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", {
    style: {
      display: 'block',
      color: '#cbd5e1',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500'
    }
  }, "Punishment Status"), /*#__PURE__*/_react.default.createElement("select", {
    value: filters.punishmentFilter,
    onChange: e => handleFilterChange('punishmentFilter', e.target.value),
    style: {
      width: '100%',
      padding: '0.75rem',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/_react.default.createElement("option", {
    value: "all"
  }, "All Incidents"), /*#__PURE__*/_react.default.createElement("option", {
    value: "with_punishment"
  }, "With Punishment"), /*#__PURE__*/_react.default.createElement("option", {
    value: "without_punishment"
  }, "Without Punishment"), /*#__PURE__*/_react.default.createElement("option", {
    value: "active"
  }, "Active Punishments"), /*#__PURE__*/_react.default.createElement("option", {
    value: "completed"
  }, "Completed Punishments"), /*#__PURE__*/_react.default.createElement("option", {
    value: "overdue"
  }, "Overdue Punishments"))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", {
    style: {
      display: 'block',
      color: '#cbd5e1',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500'
    }
  }, "Sort By"), /*#__PURE__*/_react.default.createElement("select", {
    value: filters.sortBy,
    onChange: e => handleFilterChange('sortBy', e.target.value),
    style: {
      width: '100%',
      padding: '0.75rem',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/_react.default.createElement("option", {
    value: "date"
  }, "Date (Newest First)"), /*#__PURE__*/_react.default.createElement("option", {
    value: "severity"
  }, "Severity"), /*#__PURE__*/_react.default.createElement("option", {
    value: "status"
  }, "Status"), /*#__PURE__*/_react.default.createElement("option", {
    value: "student"
  }, "Student Name"), /*#__PURE__*/_react.default.createElement("option", {
    value: "class"
  }, "Class Name"))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("label", {
    style: {
      display: 'block',
      color: '#cbd5e1',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500'
    }
  }, "Order"), /*#__PURE__*/_react.default.createElement("select", {
    value: filters.sortOrder,
    onChange: e => handleFilterChange('sortOrder', e.target.value),
    style: {
      width: '100%',
      padding: '0.75rem',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/_react.default.createElement("option", {
    value: "desc"
  }, "Descending"), /*#__PURE__*/_react.default.createElement("option", {
    value: "asc"
  }, "Ascending")))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      alignItems: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement("span", {
    style: {
      color: '#94a3b8',
      fontSize: '0.85rem'
    }
  }, "Active filters:"), filters.search && /*#__PURE__*/_react.default.createElement("span", {
    style: {
      background: 'rgba(139,92,246,0.2)',
      color: '#c4b5fd',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Search, {
    size: 10
  }), "Search: \"", filters.search, "\""), filters.severityFilter !== 'all' && /*#__PURE__*/_react.default.createElement("span", {
    style: {
      background: filters.severityFilter === 'A' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
      color: filters.severityFilter === 'A' ? '#86efac' : '#fcd34d',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertTriangle, {
    size: 10
  }), filters.severityFilter === 'A' ? 'A-Tier Only' : 'B-Tier Only'), filters.statusFilter !== 'all' && /*#__PURE__*/_react.default.createElement("span", {
    style: {
      background: filters.statusFilter === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
      color: filters.statusFilter === 'pending' ? '#fcd34d' : '#fca5a5',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Shield, {
    size: 10
  }), filters.statusFilter === 'pending' ? 'Pending Review' : 'Rejected'), filters.punishmentFilter !== 'all' && /*#__PURE__*/_react.default.createElement("span", {
    style: {
      background: 'rgba(59,130,246,0.2)',
      color: '#93c5fd',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Award, {
    size: 10
  }), filters.punishmentFilter === 'with_punishment' ? 'With Punishment' : filters.punishmentFilter === 'without_punishment' ? 'Without Punishment' : filters.punishmentFilter === 'active' ? 'Active Punishments' : filters.punishmentFilter === 'completed' ? 'Completed' : 'Overdue'), /*#__PURE__*/_react.default.createElement("button", {
    onClick: () => setFilters({
      search: '',
      severityFilter: 'all',
      statusFilter: 'all',
      punishmentFilter: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    }),
    style: {
      background: 'rgba(148,163,184,0.1)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '6px',
      padding: '0.25rem 0.75rem',
      color: '#94a3b8',
      fontSize: '0.8rem',
      cursor: 'pointer'
    }
  }, "Clear all")))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      padding: '1.25rem 1.5rem',
      borderBottom: '1px solid rgba(148,163,184,0.1)',
      background: 'rgba(15,23,42,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/_react.default.createElement("h2", {
    style: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      margin: 0
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertTriangle, {
    size: 20
  }), "A/B Incidents"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Search, {
    size: 16,
    style: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#94a3b8'
    }
  }), /*#__PURE__*/_react.default.createElement("input", {
    type: "text",
    placeholder: "Filter incidents...",
    value: filters.search,
    onChange: e => handleSearch(e.target.value),
    className: "search-input-integrated"
  }))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#94a3b8',
      fontSize: '0.9rem'
    }
  }, loading.initial ? /*#__PURE__*/_react.default.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Loader2, {
    size: 14,
    style: {
      animation: 'spin 1s linear infinite'
    }
  }), "Loading incidents...") : error ? /*#__PURE__*/_react.default.createElement("span", {
    style: {
      color: '#fca5a5'
    }
  }, error) : /*#__PURE__*/_react.default.createElement("span", null, filteredIncidents.length, " incident", filteredIncidents.length !== 1 ? 's' : '', " found"))), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      overflowX: 'auto',
      overflowY: 'auto',
      maxHeight: '520px'
    }
  }, loading.initial ? /*#__PURE__*/_react.default.createElement("div", {
    style: {
      padding: '3rem',
      textAlign: 'center',
      color: '#94a3b8'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.Loader2, {
    size: 32,
    style: {
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    }
  }), /*#__PURE__*/_react.default.createElement("p", null, "Loading A/B incidents...")) : error ? /*#__PURE__*/_react.default.createElement("div", {
    style: {
      padding: '3rem',
      textAlign: 'center',
      color: '#94a3b8'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertCircle, {
    size: 48,
    style: {
      margin: '0 auto 1rem',
      opacity: 0.5
    }
  }), /*#__PURE__*/_react.default.createElement("p", {
    style: {
      fontSize: '1rem',
      marginBottom: '0.5rem',
      color: '#fca5a5'
    }
  }, error), /*#__PURE__*/_react.default.createElement("button", {
    onClick: () => fetchIncidents(),
    style: {
      background: 'rgba(30,41,59,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      padding: '0.75rem 1.5rem',
      color: '#cbd5e1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '1rem auto 0'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.RefreshCw, {
    size: 16
  }), "Try Again")) : filteredIncidents.length === 0 ? /*#__PURE__*/_react.default.createElement("div", {
    style: {
      padding: '3rem',
      textAlign: 'center',
      color: '#94a3b8'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertTriangle, {
    size: 48,
    style: {
      margin: '0 auto 1rem',
      opacity: 0.5
    }
  }), /*#__PURE__*/_react.default.createElement("p", {
    style: {
      fontSize: '1rem',
      marginBottom: '0.5rem'
    }
  }, "No A/B incidents found"), /*#__PURE__*/_react.default.createElement("p", {
    style: {
      fontSize: '0.85rem',
      opacity: 0.8
    }
  }, filters.search || filters.severityFilter !== 'all' || filters.statusFilter !== 'all' || filters.punishmentFilter !== 'all' ? 'Try changing your filters or search query' : 'No A or B tier incidents have been reported yet'), (filters.search || filters.severityFilter !== 'all' || filters.statusFilter !== 'all' || filters.punishmentFilter !== 'all') && /*#__PURE__*/_react.default.createElement("button", {
    onClick: () => setFilters({
      search: '',
      severityFilter: 'all',
      statusFilter: 'all',
      punishmentFilter: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    }),
    style: {
      background: 'rgba(30,41,59,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px',
      padding: '0.75rem 1.5rem',
      color: '#cbd5e1',
      cursor: 'pointer',
      marginTop: '1rem'
    }
  }, "Clear filters")) : /*#__PURE__*/_react.default.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1200px'
    }
  }, /*#__PURE__*/_react.default.createElement("thead", null, /*#__PURE__*/_react.default.createElement("tr", {
    style: {
      background: 'rgba(15,23,42,0.3)',
      borderBottom: '1px solid rgba(148,163,184,0.1)'
    }
  }, ['Incident Details', 'Student & Class', 'Reporter', 'Punishment', 'Date', 'Actions'].map(col => /*#__PURE__*/_react.default.createElement("th", {
    key: col,
    style: {
      padding: '1rem',
      textAlign: 'left',
      color: '#cbd5e1',
      fontWeight: '600',
      fontSize: '0.9rem',
      whiteSpace: 'nowrap'
    }
  }, col)))), /*#__PURE__*/_react.default.createElement("tbody", null, filteredIncidents.map((incident, index) => {
    const severityBadge = (0, _incidentUtils.getSeverityBadge)(incident.severity);
    const statusBadge = (0, _incidentUtils.getStatusBadge)(incident.status);
    const punishmentStatus = (0, _incidentUtils.getPunishmentStatus)({
      completed: incident.punishment_completed,
      end_date: incident.punishment_end_date
    });
    const evidenceUrls = (0, _incidentUtils.processEvidenceUrls)(incident.evidence_url);
    return /*#__PURE__*/_react.default.createElement("tr", {
      key: incident.incident_id,
      className: "table-row",
      style: {
        borderBottom: '1px solid rgba(148,163,184,0.05)',
        cursor: 'pointer',
        background: index % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.15)'
      },
      onClick: () => openIncidentModal(incident, 'details'),
      onMouseEnter: e => {
        e.currentTarget.style.background = 'rgba(15,23,42,0.3)';
      },
      onMouseLeave: e => {
        e.currentTarget.style.background = 'transparent';
      }
    }, /*#__PURE__*/_react.default.createElement("td", {
      style: {
        padding: '1rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: severityBadge.bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertTriangle, {
      size: 20,
      color: severityBadge.color
    })), /*#__PURE__*/_react.default.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        color: '#f1f5f9',
        fontWeight: '600',
        marginBottom: '4px'
      }
    }, (0, _incidentUtils.truncateText)(incident.description, 60) || 'No description'), /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/_react.default.createElement("span", {
      style: {
        padding: '0.25rem 0.75rem',
        background: severityBadge.bgColor,
        color: severityBadge.color,
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }
    }, severityBadge.label), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        padding: '0.25rem 0.75rem',
        background: statusBadge.bgColor,
        color: statusBadge.color,
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }
    }, statusBadge.label)))), evidenceUrls.length > 0 && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: '#94a3b8'
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.FileText, {
      size: 12
    }), /*#__PURE__*/_react.default.createElement("span", null, evidenceUrls.length, " evidence file", evidenceUrls.length !== 1 ? 's' : '')))), /*#__PURE__*/_react.default.createElement("td", {
      style: {
        padding: '1rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        width: '36px',
        height: '36px',
        background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        flexShrink: 0
      }
    }, (0, _incidentUtils.getStudentInitials)(incident.student_first_name, incident.student_last_name)), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        color: '#f1f5f9',
        fontWeight: '500',
        marginBottom: '2px'
      }
    }, incident.student_first_name, " ", incident.student_last_name), /*#__PURE__*/_react.default.createElement("div", {
      style: {
        fontSize: '0.8rem',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.GraduationCap, {
      size: 12
    }), incident.admission_number))), incident.class_name && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        width: '24px',
        height: '24px',
        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    }, incident.class_name?.substring(0, 1)), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        color: '#cbd5e1',
        fontSize: '0.9rem'
      }
    }, incident.class_name)))), /*#__PURE__*/_react.default.createElement("td", {
      style: {
        padding: '1rem'
      }
    }, incident.reporter_first_name ? /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        width: '36px',
        height: '36px',
        background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        flexShrink: 0
      }
    }, (0, _incidentUtils.getStudentInitials)(incident.reporter_first_name, incident.reporter_last_name)), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        color: '#f1f5f9',
        fontWeight: '500',
        marginBottom: '2px'
      }
    }, incident.reporter_first_name, " ", incident.reporter_last_name), incident.reporter_email && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        fontSize: '0.8rem',
        color: '#94a3b8'
      }
    }, incident.reporter_email))) : /*#__PURE__*/_react.default.createElement("div", {
      style: {
        color: '#94a3b8',
        fontStyle: 'italic',
        fontSize: '0.9rem'
      }
    }, "Reporter not specified")), /*#__PURE__*/_react.default.createElement("td", {
      style: {
        padding: '1rem'
      }
    }, incident.punishment_name ? /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.Award, {
      size: 16,
      color: punishmentStatus.color
    }), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        color: '#f1f5f9',
        fontWeight: '500',
        fontSize: '0.9rem'
      }
    }, incident.punishment_name)), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        padding: '0.25rem 0.5rem',
        background: punishmentStatus.bgColor,
        color: punishmentStatus.color,
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        width: 'fit-content'
      }
    }, punishmentStatus.label), incident.punishment_end_date && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        fontSize: '0.8rem',
        color: '#94a3b8'
      }
    }, "Until ", (0, _incidentUtils.formatPunishmentDate)(incident.punishment_end_date))) : /*#__PURE__*/_react.default.createElement("div", {
      style: {
        color: '#94a3b8',
        fontStyle: 'italic',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.Award, {
      size: 16
    }), "No punishment assigned")), /*#__PURE__*/_react.default.createElement("td", {
      style: {
        padding: '1rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.Calendar, {
      size: 14,
      color: "#94a3b8"
    }), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        color: '#e2e8f0',
        fontSize: '0.9rem'
      }
    }, (0, _incidentUtils.formatIncidentDate)(incident.incident_created_at || incident.created_at))), /*#__PURE__*/_react.default.createElement("div", {
      style: {
        fontSize: '0.8rem',
        color: '#94a3b8'
      }
    }, "ID: ", incident.incident_id?.substring(0, 8), "..."))), /*#__PURE__*/_react.default.createElement("td", {
      style: {
        padding: '1rem'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        openIncidentModal(incident, 'details');
      },
      style: {
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: '6px',
        padding: '0.5rem 0.75rem',
        color: '#cbd5e1',
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s ease'
      },
      onMouseEnter: e => {
        e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
        e.currentTarget.style.color = '#f1f5f9';
      },
      onMouseLeave: e => {
        e.currentTarget.style.background = 'rgba(30,41,59,0.8)';
        e.currentTarget.style.color = '#cbd5e1';
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.Eye, {
      size: 12
    }), "View"), incident.status === 'pending' && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        if (window.confirm('Approve this incident?')) handleStatusUpdate(incident.incident_id, 'approved');
      },
      disabled: loading.action,
      style: {
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '6px',
        padding: '0.5rem 0.75rem',
        color: '#86efac',
        fontSize: '0.85rem',
        cursor: loading.action ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        opacity: loading.action ? 0.7 : 1,
        transition: 'all 0.2s ease'
      },
      onMouseEnter: e => {
        if (!loading.action) {
          e.currentTarget.style.background = 'rgba(16,185,129,0.2)';
          e.currentTarget.style.color = '#bbf7d0';
        }
      },
      onMouseLeave: e => {
        if (!loading.action) {
          e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
          e.currentTarget.style.color = '#86efac';
        }
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.CheckCircle, {
      size: 12
    }), "Approve"), /*#__PURE__*/_react.default.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        if (window.confirm('Reject this incident?')) handleStatusUpdate(incident.incident_id, 'rejected');
      },
      disabled: loading.action,
      style: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '6px',
        padding: '0.5rem 0.75rem',
        color: '#fca5a5',
        fontSize: '0.85rem',
        cursor: loading.action ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        opacity: loading.action ? 0.7 : 1,
        transition: 'all 0.2s ease'
      },
      onMouseEnter: e => {
        if (!loading.action) {
          e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
          e.currentTarget.style.color = '#fecaca';
        }
      },
      onMouseLeave: e => {
        if (!loading.action) {
          e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
          e.currentTarget.style.color = '#fca5a5';
        }
      }
    }, /*#__PURE__*/_react.default.createElement(_lucideReact.XCircle, {
      size: 12
    }), "Reject")))));
  })))), !loading.initial && !error && filteredIncidents.length > 0 && /*#__PURE__*/_react.default.createElement("div", {
    style: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid rgba(148,163,184,0.1)',
      background: 'rgba(15,23,42,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#94a3b8',
      fontSize: '0.85rem'
    }
  }, /*#__PURE__*/_react.default.createElement("div", null, "Showing ", filteredIncidents.length, " of ", incidents.length, " incidents"), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/_react.default.createElement("span", null, "Sorted by:"), /*#__PURE__*/_react.default.createElement("span", {
    style: {
      color: '#cbd5e1',
      fontWeight: '500'
    }
  }, filters.sortBy === 'date' ? 'Date' : filters.sortBy === 'severity' ? 'Severity' : filters.sortBy === 'status' ? 'Status' : filters.sortBy === 'student' ? 'Student Name' : 'Class Name', ' ', "(", filters.sortOrder === 'desc' ? 'Newest First' : 'Oldest First', ")")))), !loading.initial && incidents.length === 0 && !error && /*#__PURE__*/_react.default.createElement("div", {
    style: {
      marginTop: '2rem',
      padding: '2rem',
      background: 'rgba(15,23,42,0.3)',
      borderRadius: '12px',
      border: '1px dashed rgba(148,163,184,0.2)',
      textAlign: 'center',
      color: '#94a3b8'
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.AlertTriangle, {
    size: 48,
    style: {
      margin: '0 auto 1rem',
      opacity: 0.5
    }
  }), /*#__PURE__*/_react.default.createElement("h3", {
    style: {
      fontSize: '1.25rem',
      color: '#cbd5e1',
      marginBottom: '0.5rem'
    }
  }, "No A/B Incidents Yet"), /*#__PURE__*/_react.default.createElement("p", {
    style: {
      maxWidth: '500px',
      margin: '0 auto 1rem'
    }
  }, "No A or B tier incidents have been reported in your school yet."), /*#__PURE__*/_react.default.createElement("div", {
    style: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleRefresh,
    style: {
      background: 'rgba(30,41,59,0.8)',
      border: '1px solid rgba(148,163,184,0.2)',
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
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'rgba(30,41,59,0.8)';
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.RefreshCw, {
    size: 16
  }), "Refresh"), /*#__PURE__*/_react.default.createElement("button", {
    onClick: () => window.open('/admin/dashboard', '_blank'),
    style: {
      background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
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
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'translateY(0)';
    }
  }, /*#__PURE__*/_react.default.createElement(_lucideReact.BarChart3, {
    size: 16
  }), "Go to Dashboard")))));
};
var _default = exports.default = AandBincidents;