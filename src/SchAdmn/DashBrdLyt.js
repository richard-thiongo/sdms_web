import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './SchAdmn.css';

const DashBrdLyt = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to check if token is expired
  const isTokenExpired = useCallback((token) => {
    try {
      if (!token) return true;
      
      // Decode JWT token payload (middle part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check expiry (JWT expiry is in seconds, convert to milliseconds)
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      return currentTime >= expiryTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // If we can't decode, treat as expired
    }
  }, []);

  // Function to clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
  }, []);

  // Function to check authentication - memoized with useCallback
  const checkAuth = useCallback(() => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    // If no token or user data, not authenticated
    if (!token || !user) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Clear expired tokens
      clearAuthData();
      return false;
    }
    
    // Validate user data format
    try {
      const userData = JSON.parse(user);
      if (!userData || !userData.email) {
        clearAuthData();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error parsing user data:', error);
      clearAuthData();
      return false;
    }
  }, [isTokenExpired, clearAuthData]);

  useEffect(() => {
    const verifyAuth = () => {
      const authValid = checkAuth();
      
      if (!authValid) {
        setIsAuthenticated(false);
        navigate('/login/admin'); // Use your login path
        return;
      }
      
      setIsAuthenticated(true);
      setLoading(false);
    };

    // Initial authentication check
    verifyAuth();

    // Set up interval to check token expiry every 3 minutes
    const expiryCheckInterval = setInterval(() => {
      console.log('Checking token expiry...');
      const authValid = checkAuth();
      
      if (!authValid && isAuthenticated) {
        setIsAuthenticated(false);
        clearInterval(expiryCheckInterval);
        
        // Show expiry message before redirecting
        alert('Your session has expired. Please log in again.');
        navigate('/login/admin');
      }
    }, 3 * 60 * 1000); // 3 minutes in milliseconds

    // Clean up interval on unmount
    return () => clearInterval(expiryCheckInterval);
  }, [navigate, isAuthenticated, checkAuth]);

  // Optional: Set up activity listeners to track user activity
  useEffect(() => {
    const resetInactivityTimer = () => {
      // You could add inactivity timeout here if needed
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
    };
  }, []);

  // Calculate margin-left based on screen size and sidebar state
  const getMarginLeft = () => {
    if (isMobile) {
      return '0'; // No margin on mobile (sidebar is overlay)
    }
    return sidebarCollapsed ? '80px' : '280px';
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #2d2a6e 50%, #1e1b4b 100%)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 25px'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <h3 style={{ marginBottom: '10px', color: '#faf5ff' }}>Securing Dashboard</h3>
          <p style={{ color: '#c4b5fd', fontSize: '0.9rem' }}>Verifying your credentials...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="schadmn-app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        onCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
      />

      {/* Main content area */}
      <main
        style={{
          marginLeft: getMarginLeft(),
          padding: '1.5rem',
          width: '100%',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          overflowX: 'hidden',
          flexDirection:'column',
          display: 'flex',
          flex: 1,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default DashBrdLyt;