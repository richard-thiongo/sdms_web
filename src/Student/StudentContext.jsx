// Student/StudentContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';

const StudentContext = createContext();

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) throw new Error('useStudent must be used within StudentProvider');
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const StudentProvider = ({ children }) => {
  const [loading, setLoading] = useState({
    dashboard: false,
    incidents: false,
    details: false
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1
  });
  const [selectedIncident, setSelectedIncident] = useState(null);

  const getToken = () => localStorage.getItem('access_token');
  const getRefreshToken = () => localStorage.getItem('refresh_token');

  const isTokenExpired = (token) => {
    try {
      if (!token) return true;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      // Buffer of 5 minutes
      return Date.now() >= (expiryTime - 5 * 60 * 1000);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/students/login';
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const response = await fetch(`${API_URL}/student/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${refreshToken}` }
      });

      const result = await response.json();
      if (result.success) {
        localStorage.setItem('access_token', result.data.access_token);
        // Also update sessionStorage if it exists
        if (sessionStorage.getItem('access_token')) {
          sessionStorage.setItem('access_token', result.data.access_token);
        }
        return result.data.access_token;
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh error:', error);
      handleLogout();
      throw error;
    }
  }, [handleLogout]);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    let token = getToken();

    if (isTokenExpired(token)) {
      try {
        token = await refreshAccessToken();
      } catch (error) {
        throw new Error('Session expired. Please login again.');
      }
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
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
  }, [refreshAccessToken]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showToast = (message, type = 'success') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(clearMessages, 5000);
  };

  // API Methods
  const fetchDashboard = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/student/dashboard`);
      if (result.success) {
        setDashboardData(result.data);
        localStorage.setItem('full_name', result.data.student_info.full_name);
        localStorage.setItem('class_name', result.data.student_info.class?.class_name || 'Not Assigned');
        return result.data;
      }
      throw new Error(result.message || 'Failed to load dashboard');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [fetchWithAuth]);

  const fetchIncidents = useCallback(async (type = 'personal', filters = {}) => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const params = new URLSearchParams({
        page: filters.page || 1,
        per_page: filters.perPage || 20
      });
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.search) params.append('q', filters.search);

      const endpoint = `${API_URL}/student/incidents/${type}`;
      const result = await fetchWithAuth(`${endpoint}?${params}`);
      
      if (result.success) {
        setIncidents(result.data.incidents || []);
        setPagination(result.data.pagination || {
          page: filters.page || 1,
          perPage: filters.perPage || 20,
          total: 0,
          totalPages: 1
        });
        return result.data;
      }
      throw new Error(result.message || 'Failed to load incidents');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, [fetchWithAuth]);

  const fetchIncidentDetails = useCallback(async (incidentId, type = 'personal') => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const result = await fetchWithAuth(`${API_URL}/student/incidents/${incidentId}?type=${type}`);
      if (result.success) {
        setSelectedIncident(result.data);
        return result.data;
      }
      throw new Error(result.message || 'Failed to load incident details');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  }, [fetchWithAuth]);

  const value = {
    loading,
    error,
    success,
    dashboardData,
    incidents,
    pagination,
    selectedIncident,
    fetchDashboard,
    fetchIncidents,
    fetchIncidentDetails,
    handleLogout,
    clearMessages,
    showToast
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export default StudentContext;
