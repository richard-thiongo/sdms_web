// app/admin/dashboard/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';

// Shared theme colors matching your provided styles
const themeColors = {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  gray950: '#020617',
  success: '#10b981',
  info: '#3b82f6',
  warning: '#f59e0b',
};

const Sidebar = ({ onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-toggle')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, isMobileOpen]);

  // Navigation items - Only Dashboard
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/admin/dashboard',
      description: 'Overview and analytics'
    },

    {
      id: 'Teachers',
      label: 'Teachers',
      icon: Home,
      path:'/admin/teachers',
      description:'Manage Teachers'
    }
  ];

  // Handle collapse toggle
  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapse) {
      onCollapse(newCollapsedState);
    }
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    navigate('/login/admin');
    if (isMobile) setIsMobileOpen(false);
  };

  // Check if item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const name = user.name || user.username || user.email?.split('@')[0] || 'Admin';
        const email = user.email || 'admin@school.com';
        const role = user.role || 'Administrator';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        return { name, email, role, initials };
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return {
      name: 'School Admin',
      email: 'admin@school.com',
      role: 'Administrator',
      initials: 'SA'
    };
  };

  const userInfo = getUserInfo();
  const errorColor = '#ef4444';

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          className="mobile-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '1.5rem',
            zIndex: 40,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${themeColors.primary}33`,
            borderRadius: '0.75rem',
            padding: '0.75rem',
            color: themeColors.gray300,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isMobileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 45,
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className="sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'all 0.3s ease',
          transform: isMobileOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)',
          width: isMobile ? '280px' : isCollapsed ? '80px' : '280px',
        }}
      >
        {/* Sidebar Content */}
        <div style={{
          width: '100%',
          height: '100vh',
          background: `linear-gradient(180deg, ${themeColors.gray950} 0%, ${themeColors.gray900} 100%)`,
          borderRight: `1px solid ${themeColors.primary}33`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${themeColors.primary}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            height: '72px',
          }}>
            {/* Desktop Collapse Toggle */}
            {!isMobile && (
              <button
                onClick={handleCollapseToggle}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${themeColors.primary}33`,
                  color: themeColors.gray300,
                  cursor: 'pointer',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.75rem',
                  minWidth: '3rem',
                  minHeight: '3rem',
                }}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${themeColors.primary}33`,
                  color: themeColors.gray300,
                  cursor: 'pointer',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.75rem',
                  minWidth: '3rem',
                  minHeight: '3rem',
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `${themeColors.primary} ${themeColors.gray800}`,
          }}>
            {/* Custom scrollbar styles */}
            <style>{`
              .sidebar div::-webkit-scrollbar {
                width: 4px;
              }
              .sidebar div::-webkit-scrollbar-track {
                background: ${themeColors.gray800};
              }
              .sidebar div::-webkit-scrollbar-thumb {
                background: ${themeColors.primary};
                border-radius: 2px;
              }
              .sidebar div::-webkit-scrollbar-thumb:hover {
                background: ${themeColors.primaryLight};
              }
            `}</style>
            
            <ul style={{
              listStyle: 'none',
              padding: '1rem 0',
              margin: 0,
            }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <li 
                    key={item.id} 
                    style={{
                      marginBottom: '0.25rem',
                      position: 'relative',
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => handleNavigation(item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: isCollapsed && !isMobile ? '0.875rem 0.5rem' : '0.875rem 1.5rem',
                        color: active ? themeColors.primaryLight : themeColors.gray400,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        width: '100%',
                        textAlign: 'left',
                        background: active 
                          ? `linear-gradient(90deg, ${themeColors.primary}15 0%, ${themeColors.primary}10 100%)`
                          : 'transparent',
                        border: 'none',
                        borderRight: active ? `3px solid ${themeColors.primary}` : 'none',
                      }}
                      title={isCollapsed && !isMobile ? item.label : ''}
                    >
                      <div style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? themeColors.primary : 'inherit',
                      }}>
                        <Icon size={20} />
                      </div>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        opacity: isCollapsed && !isMobile ? 0 : 1,
                        transition: 'opacity 0.3s ease',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}>
                        {item.label}
                      </span>
                      
                      {/* Active indicator dot for collapsed state */}
                      {active && isCollapsed && !isMobile && (
                        <div style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: themeColors.primary,
                          boxShadow: `0 0 8px ${themeColors.primary}`,
                        }} />
                      )}
                    </button>
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && !isMobile && hoveredItem === item.id && (
                      <div style={{
                        position: 'absolute',
                        left: 'calc(100% + 1rem)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: themeColors.gray800,
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        zIndex: 100,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                        border: `1px solid ${themeColors.primary}33`,
                        minWidth: '180px',
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {item.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: themeColors.gray400,
                          fontWeight: 'normal',
                        }}>
                          {item.description}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div style={{
            padding: isCollapsed && !isMobile ? '1rem 0.5rem' : '1rem 1.5rem',
            borderTop: `1px solid ${themeColors.primary}33`,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
          }}>
            {/* User Info */}
            {(!isCollapsed || isMobile) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: `1px solid ${themeColors.primary}33`,
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryDark})`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeColors.gray50,
                  fontWeight: 'bold',
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  {userInfo.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: themeColors.gray50,
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {userInfo.name}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: themeColors.gray400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {userInfo.email}
                  </div>
                </div>
              </div>
            )}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                gap: '0.75rem',
                width: '100%',
                padding: isCollapsed && !isMobile ? '0.875rem 0.5rem' : '0.875rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: `1px solid rgba(239, 68, 68, 0.3)`,
                borderRadius: '0.75rem',
                color: errorColor,
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
              title={isCollapsed && !isMobile ? "Logout" : ""}
            >
              <LogOut size={18} />
              {(!isCollapsed || isMobile) && (
                <span style={{
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                  flex: 1,
                  textAlign: 'left',
                }}>
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;