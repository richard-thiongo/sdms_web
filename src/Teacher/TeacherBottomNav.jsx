import React from 'react';
import { LayoutDashboard, Users, History, AlertTriangle } from 'lucide-react';

const TeacherBottomNav = ({ currentView, listType, onNavigateToDashboard, onNavigateToLists }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard size={20} />,
      active: currentView === 'dashboard',
      onClick: onNavigateToDashboard
    },
    {
      id: 'students',
      label: 'Students',
      icon: <Users size={20} />,
      active: currentView === 'lists' && listType === 'students',
      onClick: () => onNavigateToLists('students')
    },
    {
      id: 'classIncidents',
      label: 'Class',
      icon: <History size={20} />,
      active: currentView === 'lists' && listType === 'classIncidentsList',
      onClick: () => onNavigateToLists('classIncidentsList')
    },
    {
      id: 'schoolIncidents',
      label: 'School',
      icon: <AlertTriangle size={20} />,
      active: currentView === 'lists' && listType === 'incidents',
      onClick: () => onNavigateToLists('incidents')
    }
  ];

  return (
    <div className="teacher-bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={tab.onClick}
          className={`teacher-nav-tab ${tab.active ? 'teacher-nav-tab-active' : ''}`}
        >
          <div className="teacher-nav-icon-wrap">
            {tab.icon}
          </div>
          <span className="teacher-nav-label">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TeacherBottomNav;
