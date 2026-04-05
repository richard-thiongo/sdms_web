// Teacher/TeacherContext.jsx
/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { sanitizeErrorMessage } from '../utils/errorUtils';

const TeacherContext = createContext();

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) throw new Error('useTeacher must be used within TeacherProvider');
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const TeacherProvider = ({ children }) => {
  // ========== STATE ==========
  const [loading, setLoading] = useState({
    dashboard: false,
    students: false,
    incidents: false,
    search: false,
    assign: false,
    remove: false, // Bug #8 fixed: was missing, caused loading.remove to always be undefined
    report: false,
    reportClass: false,
    delete: false,
    upload: false,
    schoolClasses: false,
    password: false,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [dashboardStats, setDashboardStats] = useState({
    total_students: 0,
    total_class_incidents: 0,
    class_incidents: 0,
    my_incidents: 0,
    my_incidents_pending: 0,
    my_class_incidents: 0,
    my_school_incidents: 0,
    my_school_incidents_pending: 0,
    class_name: '',
    school_name: ''
  });

  const [students, setStudents] = useState([]);
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);

  // Incident states
  const [myIncidents, setMyIncidents] = useState([]);
  const [classIncidents, setClassIncidents] = useState([]);
  const [schoolIncidents, setSchoolIncidents] = useState([]);
  const [classLevelIncidents, setClassLevelIncidents] = useState([]);
  const [schoolClassIncidents, setSchoolClassIncidents] = useState([]);

  // Selected items for modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedClassIncident, setSelectedClassIncident] = useState(null);

  // ========== TOKEN MANAGEMENT ==========
  const getToken = () => localStorage.getItem('access_token');
  const getRefreshToken = () => localStorage.getItem('refresh_token');

  const isTokenExpired = (token) => {
    try {
      if (!token) return true;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      return Date.now() >= (expiryTime - 5 * 60 * 1000);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const response = await fetch(`${API_URL}/teacher/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${refreshToken}` }
      });

      const result = await response.json();
      if (result.success) {
        localStorage.setItem('access_token', result.data.access_token);
        return result.data.access_token;
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh error:', error);
      handleLogout();
      throw error;
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    let token = getToken();

    if (isTokenExpired(token)) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
        throw new Error('Session expired. Please login again.');
      }
    }

    // Bug #7 fixed: never manually set Content-Type for FormData.
    // The browser must set it automatically to include the multipart boundary.
    const isFormData = options.body instanceof FormData;
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      try {
        token = await refreshAccessToken();
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${token}`,
        };
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
        return await retryResponse.json();
      } catch (error) {
        throw new Error('Session expired. Please login again.');
      }
    }

    return await response.json();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.location.href = '/teacher/login';
  };

  // ========== UTILITY FUNCTIONS ==========
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showToast = (message, type = 'success') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(clearMessages, 5000);
  };

  // ========== DASHBOARD API ==========
  const fetchDashboardStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/dashboard/stats`);
      if (result.success) {
        setDashboardStats(result.data);
        return result.data;
      }
      throw new Error(result.message || 'Failed to load dashboard stats');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  // ========== STUDENT API ==========
  const fetchClassStudents = useCallback(async () => {
    setLoading(prev => ({ ...prev, students: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/class/students`);
      if (result.success) {
        setStudents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch students');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, []);

  const searchStudents = useCallback(async (admissionNumber) => {
    setLoading(prev => ({ ...prev, search: true }));
    try {
      const result = await fetchWithAuth(
        `${API_URL}/teacher/students/search?admission_number=${encodeURIComponent(admissionNumber)}`
      );
      if (result.success) {
        setSearchedStudents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Search failed');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  }, []);

  const fetchStudentDetails = useCallback(async (admissionNumber) => {
    setLoading(prev => ({ ...prev, students: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/students/${admissionNumber}`);
      if (result.success) return result.data;
      throw new Error(result.message || 'Failed to fetch student details');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, []);

  const assignStudent = useCallback(async (studentData) => {
    setLoading(prev => ({ ...prev, assign: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/students/assign`, {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
      if (result.success) {
        showToast(result.message);
        await Promise.all([fetchDashboardStats(), fetchClassStudents()]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to assign student');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, assign: false }));
    }
  }, []);

  const removeStudent = useCallback(async (admissionNumber) => {
    setLoading(prev => ({ ...prev, remove: true })); // Bug #8 fixed: now uses correct 'remove' key
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/students/remove`, {
        method: 'POST',
        body: JSON.stringify({ admission_number: admissionNumber }),
      });
      if (result.success) {
        showToast(result.message);
        await Promise.all([fetchDashboardStats(), fetchClassStudents()]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to remove student');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, remove: false }));
    }
  }, []);

  // ========== INCIDENT API ==========
  const reportIncident = useCallback(async (incidentData) => {
    setLoading(prev => ({ ...prev, report: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/incidents`, {
        method: 'POST',
        body: JSON.stringify(incidentData),
      });
      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassIncidents(),
          fetchMyIncidents(),
          fetchSchoolIncidents(),
          fetchDashboardStats()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to report incident');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, report: false }));
    }
  }, []);

  const fetchClassIncidents = useCallback(async () => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/class/incidents`);
      if (result.success) {
        setClassIncidents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch class incidents');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const fetchSchoolIncidents = useCallback(async () => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/school/incidents`);
      if (result.success) {
        setSchoolIncidents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch school incidents');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const fetchMyIncidents = useCallback(async () => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/incidents/my`);
      if (result.success) {
        setMyIncidents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch your incidents');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const fetchIncidentDetails = useCallback(async (incidentId) => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/incidents/${incidentId}/details`);
      if (result.success) return result.data;
      throw new Error(result.message || 'Failed to fetch incident details');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const deleteIncident = useCallback(async (incidentId) => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/incidents/${incidentId}`, {
        method: 'DELETE',
      });
      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassIncidents(),
          fetchMyIncidents(),
          fetchSchoolIncidents(),
          fetchDashboardStats()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to delete incident');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  }, []);

  // ========== CLASS INCIDENT API ==========
  const reportClassIncident = useCallback(async (incidentData) => {
    setLoading(prev => ({ ...prev, reportClass: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/class/report`, {
        method: 'POST',
        body: JSON.stringify(incidentData),
      });
      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassLevelIncidents(),
          fetchSchoolClassIncidents(),
          fetchDashboardStats()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to report class incident');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, reportClass: false }));
    }
  }, []);

  const fetchClassLevelIncidents = useCallback(async () => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/class/level-incidents`);
      if (result.success) {
        setClassLevelIncidents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch class-level incidents');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const fetchSchoolClassIncidents = useCallback(async () => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/school/class-incidents`);
      if (result.success) {
        setSchoolClassIncidents(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch school class incidents');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const fetchClassIncidentDetails = useCallback(async (classIncidentId) => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/class/incidents/${classIncidentId}/details`);
      if (result.success) return result.data;
      throw new Error(result.message || 'Failed to fetch class incident details');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);

  const deleteClassIncident = useCallback(async (classIncidentId) => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/class/incidents/${classIncidentId}`, {
        method: 'DELETE',
      });
      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassLevelIncidents(),
          fetchSchoolClassIncidents(),
          fetchDashboardStats()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to delete class incident');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  }, []);

  // ========== EVIDENCE API ==========
  const uploadEvidence = useCallback(async (incidentId, files) => {
    setLoading(prev => ({ ...prev, upload: true }));
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('evidence', file);
      });

      // Bug #7 fixed: fetchWithAuth now correctly omits Content-Type for FormData
      const result = await fetchWithAuth(`${API_URL}/teacher/incidents/${incidentId}/evidence`, {
        method: 'POST',
        body: formData,
      });

      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassIncidents(),
          fetchMyIncidents(),
          fetchSchoolIncidents()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to upload evidence');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  }, []);

  const uploadClassIncidentEvidence = useCallback(async (classIncidentId, files) => {
    setLoading(prev => ({ ...prev, upload: true }));
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('evidence', file);
      });

      const result = await fetchWithAuth(`${API_URL}/teacher/class/incidents/${classIncidentId}/evidence`, {
        method: 'POST',
        body: formData,
      });

      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassLevelIncidents(),
          fetchSchoolClassIncidents()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to upload evidence');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  }, []);

  const removeEvidence = useCallback(async (incidentId, evidenceUrl) => {
    setLoading(prev => ({ ...prev, upload: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/incidents/${incidentId}/evidence`, {
        method: 'DELETE',
        body: JSON.stringify({ evidence_url: evidenceUrl }),
      });

      if (result.success) {
        showToast(result.message);
        await Promise.all([
          fetchClassIncidents(),
          fetchMyIncidents(),
          fetchSchoolIncidents()
        ]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to remove evidence');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  }, []);

  // ========== SCHOOL CLASSES ==========
  const fetchSchoolClasses = useCallback(async () => {
    setLoading(prev => ({ ...prev, schoolClasses: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/school/classes`);
      if (result.success) {
        setSchoolClasses(result.data || []);
        return result.data;
      }
      throw new Error(result.message || 'Failed to load school classes');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, schoolClasses: false }));
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchClassStudents(),
        fetchSchoolClasses(),
        fetchClassIncidents(),
        fetchSchoolIncidents(),
        fetchMyIncidents(),
        fetchClassLevelIncidents(),
        fetchSchoolClassIncidents(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, []);

  // ========== SETTINGS API ==========
  const changeTeacherPassword = useCallback(async (passwordData) => {
    setLoading(prev => ({ ...prev, password: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/teacher/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
      if (result.success) {
        showToast(result.message);
        return result;
      }
      throw new Error(result.message || 'Failed to change password');
    } catch (error) {
      setError(sanitizeErrorMessage(error.message, 'Operation failed'));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const value = {
    loading,
    error,
    success,
    dashboardStats,
    students,
    searchedStudents,
    schoolClasses,
    // Bug #9 fix support: expose classIncidents directly so Dashboard can use it
    classIncidents,
    myIncidents,
    schoolIncidents,
    classLevelIncidents,
    schoolClassIncidents,
    selectedStudent,
    selectedIncident,
    selectedClassIncident,

    setSelectedStudent,
    setSelectedIncident,
    setSelectedClassIncident,

    fetchDashboardStats,
    fetchClassStudents,
    searchStudents,
    fetchStudentDetails,
    assignStudent,
    removeStudent,

    reportIncident,
    fetchClassIncidents,
    fetchSchoolIncidents,
    fetchMyIncidents,
    fetchIncidentDetails,
    deleteIncident,

    reportClassIncident,
    fetchClassLevelIncidents,
    fetchSchoolClassIncidents,
    fetchClassIncidentDetails,
    deleteClassIncident,

    uploadEvidence,
    uploadClassIncidentEvidence,
    removeEvidence,

    fetchSchoolClasses,

    clearMessages,
    loadInitialData,
    handleLogout,
    changeTeacherPassword,
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export default TeacherContext;
