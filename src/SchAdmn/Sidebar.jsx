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
  Users,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';


// Enhanced theme colors for better UI/UX (Student Module Match)
const themeColors = {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryLighter: '#c4b5fd',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: 'rgba(30, 41, 59, 0.4)', // Glassmorphic surface
  gray800: '#1e293b',
  gray900: '#0a0f1c', // Deep blue/black
  gray950: '#020617',
  error: '#ef4444',
  errorLight: '#fee2e2',
  gradientSidebar: 'rgba(15, 23, 42, 0.6)', // Glassmorphic
};

const Sidebar = ({ onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Enhanced resize handler with better performance
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) {
          setIsMobileOpen(false);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Enhanced click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-toggle')) {
        closeSidebar();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, isMobileOpen]);

  // Navigation items with appropriate icons
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
      icon: Users,
      path:'/admin/teachers',
      description:'Manage Teachers'
    },

    {
      id: 'Classes',
      label: 'Classes',
      icon: BookOpen,
      path: '/admin/classes',
      description: 'Manage Classes'
    },

    {
      id: 'Students',
      label: 'Students',
      icon: GraduationCap,
      path: '/admin/students',
      description: 'Manage Students'
    },

    {
      id: 'A/B Incidents',
      label: 'A/B Incidents',
      icon: AlertTriangle,
      path: '/admin/ab-incidents',
      description: 'Manage A/B Incidents'
    },

    {
      id: 'S Incidents',
      label: 'S Incidents',
      icon: ShieldAlert,
      path: '/admin/s-incidents',
      description: 'S Incidents'
    },
  ];

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapse) {
      onCollapse(newCollapsedState);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      closeSidebar();
    }
  };

  const closeSidebar = () => {
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    navigate('/login/admin');
    if (isMobile) closeSidebar();
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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

  return (
    <>
      {/* Enhanced Mobile Toggle Button */}
      {isMobile && (
        <button
          className="mobile-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            position: 'fixed',
            top: '0.1rem',
            left: '0.01rem',
            zIndex: 50,
            backgroundColor: themeColors.primary + '20',
            backdropFilter: 'blur(2px)',
            border: `1px solid ${themeColors.primary}40`,
            borderRadius: '12px',
            padding: '0.75rem',
            color: themeColors.primaryLighter,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.2s ease',
            transform: isMobileOpen ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = themeColors.primaryDark + '20'}
          onMouseLeave={(e) => e.currentTarget.style.background = themeColors.gray900}
        >
          <Menu size={19}  />
        </button>
      )}

      {/* Enhanced Overlay for mobile */}
      {isMobile && isMobileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.9)',
            zIndex: 49,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside 
        className="sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isMobileOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)',
          width: isMobile ? '280px' : isCollapsed ? '80px' : '280px',
        }}
      >
        {/* Enhanced Sidebar Content */}
        <div style={{
          width: '100%',
          height: '100vh',
          background: themeColors.gradientSidebar,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(148, 163, 184, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

          overflow: 'hidden',
        }}>
          {/* Enhanced Header */}
          <div style={{
            padding: isMobile ? '1.25rem 1.5rem' : '1.5rem',
            borderBottom: `1px solid ${themeColors.primary}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            minHeight: '72px',
            gap: '1rem',
          }}>
            {/* Desktop Collapse Toggle */}
            {!isMobile && (
              <button
                onClick={handleCollapseToggle}
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: `1px solid ${themeColors.primary}33`,
                  color: themeColors.gray300,
                  cursor: 'pointer',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeColors.primary + '20';
                  e.currentTarget.style.borderColor = themeColors.primary + '66';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.borderColor = themeColors.primary + '33';
                }}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}

            {/* Enhanced Mobile Close Button */}
            {isMobile && (
              <button
                onClick={closeSidebar}
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: `1px solid ${themeColors.primary}33`,
                  color: themeColors.gray300,
                  cursor: 'pointer',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeColors.primary + '20';
                  e.currentTarget.style.borderColor = themeColors.primary + '66';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.borderColor = themeColors.primary + '33';
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Enhanced Navigation */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `${themeColors.primary} ${themeColors.gray800}`,
            padding: '0.5rem 0',
          }}>
            {/* Enhanced custom scrollbar styles */}
            <style>{`
              .sidebar div::-webkit-scrollbar {
                width: 6px;
              }
              .sidebar div::-webkit-scrollbar-track {
                background: ${themeColors.gray800};
                border-radius: 3px;
              }
              .sidebar div::-webkit-scrollbar-thumb {
                background: ${themeColors.primary};
                border-radius: 3px;
                transition: background 0.2s ease;
              }
              .sidebar div::-webkit-scrollbar-thumb:hover {
                background: ${themeColors.primaryLight};
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
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
                        color: active ? themeColors.primaryLighter : themeColors.gray400,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        width: '100%',
                        textAlign: 'left',
                        background: active 
                          ? `linear-gradient(90deg, ${themeColors.primary}20 0%, ${themeColors.primary}10 100%)`
                          : 'transparent',
                        border: 'none',
                        borderRight: active ? `3px solid ${themeColors.primary}` : 'none',
                        borderRadius: '0 12px 12px 0',
                        marginRight: '8px',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = themeColors.primary + '10';
                          e.currentTarget.style.color = themeColors.primaryLighter;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = themeColors.gray400;
                        }
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
                        transition: 'color 0.2s ease',
                      }}>
                        <Icon size={20} />
                      </div>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        opacity: isCollapsed && !isMobile ? 0 : 1,
                        transition: 'opacity 0.3s ease, transform 0.2s ease',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        transform: isCollapsed && !isMobile ? 'translateX(-20px)' : 'translateX(0)',
                      }}>
                        {item.label}
                      </span>
                      
                      {/* Enhanced active indicator for collapsed state */}
                      {active && isCollapsed && !isMobile && (
                        <div style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: themeColors.primary,
                          boxShadow: `0 0 12px ${themeColors.primary}`,
                          animation: 'pulse 2s infinite',
                        }} />
                      )}
                    </button>
                    
                    {/* Enhanced Tooltip for collapsed state */}
                    {isCollapsed && !isMobile && hoveredItem === item.id && (
                      <div style={{
                        position: 'absolute',
                        left: 'calc(100% + 12px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: themeColors.gray800,
                        color: themeColors.gray50,
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                        border: `1px solid ${themeColors.primary}33`,
                        minWidth: '180px',
                        backdropFilter: 'blur(10px)',
                        animation: 'fadeIn 0.15s ease',
                        pointerEvents: 'none',
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

          {/* Enhanced Footer */}
          <div style={{
            padding: isCollapsed && !isMobile ? '1rem 0.5rem' : '1rem 1.5rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Enhanced User Info */}
            {(!isCollapsed || isMobile) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                border: `1px solid ${themeColors.primary}33`,
                marginBottom: '1rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.primary + '10';
                e.currentTarget.style.borderColor = themeColors.primary + '66';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                e.currentTarget.style.borderColor = themeColors.primary + '33';
              }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryDark})`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeColors.gray50,
                  fontWeight: 'bold',
                  fontSize: '16px',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${themeColors.primary}40`,
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
            
            {/* Enhanced Change Password Button */}
            <button
              onClick={() => setPasswordModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                gap: '0.75rem',
                width: '100%',
                padding: isCollapsed && !isMobile ? '0.875rem 0.5rem' : '0.875rem 1rem',
                background: 'rgba(139, 92, 246, 0.1)',
                border: `1px solid rgba(139, 92, 246, 0.2)`,
                borderRadius: '12px',
                color: themeColors.primaryLighter,
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeColors.primary + '20';
                e.currentTarget.style.borderColor = themeColors.primary + '40';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
              }}
              title={isCollapsed && !isMobile ? "Change Password" : ""}
            >
              <Lock size={18} />
              {(!isCollapsed || isMobile) && (
                <span style={{ opacity: 1, transition: 'opacity 0.3s ease', flex: 1, textAlign: 'left' }}>
                  Change Password
                </span>
              )}
            </button>

            {/* Enhanced Logout Button */}
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
                border: `1px solid rgba(239, 68, 68, 0.2)`,
                borderRadius: '12px',
                color: themeColors.error,
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeColors.error + '20';
                e.currentTarget.style.borderColor = themeColors.error + '40';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
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
      
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;