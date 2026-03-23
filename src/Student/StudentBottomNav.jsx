import React from 'react';
import { LayoutDashboard, Shield, Users, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const StudentBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard size={20} />,
      path: '/student/dashboard',
      active: location.pathname === '/student/dashboard' || location.pathname === '/student'
    },
    {
      id: 'personal',
      label: 'My Reports',
      icon: <Shield size={20} />,
      path: '/student/incidents/personal',
      active: location.pathname === '/student/incidents/personal'
    },
    {
      id: 'class',
      label: 'Class',
      icon: <Users size={20} />,
      path: '/student/incidents/class',
      active: location.pathname === '/student/incidents/class'
    },
    {
      id: 'all',
      label: 'School',
      icon: <BookOpen size={20} />,
      path: '/student/incidents/all',
      active: location.pathname === '/student/incidents/all'
    }
  ];

  return (
    <div className="student-bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          className={`student-nav-tab ${tab.active ? 'student-nav-tab-active' : ''}`}
        >
          <div className="student-nav-icon-wrap">
            {tab.icon}
          </div>
          <span className="student-nav-label">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default StudentBottomNav;
