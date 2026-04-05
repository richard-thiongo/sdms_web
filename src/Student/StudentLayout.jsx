import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import StudentBottomNav from './StudentBottomNav';
import './Student.css';

const StudentLayout = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect for nav bar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('student_data');
    localStorage.removeItem('student_id');
    localStorage.removeItem('full_name');
    localStorage.removeItem('class_name');
    sessionStorage.clear();
    navigate('/students/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const studentName = localStorage.getItem('full_name') || 'Student';
  const className = localStorage.getItem('class_name') || 'Not Assigned';

  return (
    <div className="student-app-container">
      {/* Top Navigation */}
        <nav className={`student-nav ${scrolled ? 'student-nav-scrolled' : ''}`}>
          <div className="student-nav-inner">
            {/* Logo */}
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
              onClick={() => handleNavigation('/student/dashboard')}
            >
              <span className="student-logo">Student Portal</span>
            </div>

            {/* Profile Section */}
            <div className="student-profile-section">
              <div className="student-profile-badge">
                <div className="student-profile-avatar">
                  {studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="student-desktop-only student-profile-info">
                  <div className="student-profile-name">{studentName}</div>
                  <div className="student-profile-class">{className}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="student-logout-btn"
              >
                <LogOut size={16} />
                <span className="student-desktop-only">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="student-main-content">
          <Outlet />
        </main>

        <StudentBottomNav />
    </div>
  );
};


export default StudentLayout;