import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, GraduationCap, BookOpen, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

const RoleSelection = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.scrollTo(0, 0); // Scroll to top on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoints
  const isMobile = windowWidth <= 768;

  const roles = [
    {
      id: 'admin',
      title: 'School Admin',
      icon: Shield,
      desc: 'Complete school management, teacher oversight, and serious incident resolution.',
      color: '#8b5cf6', // Violet
      route: '/login/admin',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0))'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      icon: GraduationCap,
      desc: 'Mobile-first incident reporting, class behavior tracking, and analytics.',
      color: '#f59e0b', // Amber
      route: '/teacher/login',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0))'
    },
    {
      id: 'student',
      title: 'Student',
      icon: BookOpen,
      desc: 'Transparent access to personal records, behavior tracking, and accountability.',
      color: '#10b981', // Emerald
      route: '/students/login',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0))'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      color: '#f8fafc',
      fontFamily: '"Inter", -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      padding: isMobile ? '1.5rem 1rem' : '2.5rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background glow orbs for elite aesthetics */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
        background: '#8b5cf6', filter: 'blur(150px)', opacity: 0.15, zIndex: 0, borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw',
        background: '#10b981', filter: 'blur(150px)', opacity: 0.15, zIndex: 0, borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Back Button */}
      <Link to="/" style={{
        position: 'absolute', top: isMobile ? '1.5rem' : '2.5rem', left: isMobile ? '1.5rem' : '3rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none',
        fontSize: '0.95rem', fontWeight: 500, zIndex: 10, transition: 'color 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>

      <div style={{ 
        position: 'relative', zIndex: 1, maxWidth: '1200px', width: '100%', 
        display: 'flex', flexDirection: 'column', alignItems: 'center' 
      }}>
        
        {/* Header Section */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: isMobile ? '2.5rem' : '3.5rem', 
          marginTop: isMobile ? '2.5rem' : '0' 
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
          }}>
            <img src="/favicon.svg" alt="Lania" style={{ width: '48px', height: '48px' }} />
          </div>
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, 
            marginBottom: '1rem', letterSpacing: '-1px' 
          }}>
            Select Your Portal
          </h1>
          <p style={{ 
            color: '#94a3b8', fontSize: isMobile ? '1rem' : '1.15rem', 
            maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 
          }}>
            Choose the access level that matches your position in the school system to continue.
          </p>
        </div>

        {isMobile && (
          <div style={{ position: 'fixed', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <div className="scroll-indicator" style={{ marginTop: 0 }}>
              <ArrowDown size={28} color="#8b5cf6" />
            </div>
          </div>
        )}

        {/* Roles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          width: '100%',
          padding: isMobile ? '0' : '0 1rem'
        }}>
          {roles.map((role) => {
            const Icon = role.icon;
            const isHovered = hoveredCard === role.id;

            return (
              <Link
                key={role.id}
                to={role.route}
                onMouseEnter={() => setHoveredCard(role.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${isHovered ? role.color : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '24px',
                  padding: isMobile ? '2.5rem 2rem' : '3rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 20px 40px -10px ${role.color}40` : '0 10px 30px -10px rgba(0,0,0,0.3)'
                }}
              >
                {/* Gradient background overlay on hover */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: role.gradient, opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s ease', zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* Icon Block */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    background: `rgba(${parseInt(role.color.slice(1,3), 16)}, ${parseInt(role.color.slice(3,5), 16)}, ${parseInt(role.color.slice(5,7), 16)}, 0.1)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '2rem', transition: 'all 0.3s ease',
                    transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                    color: role.color,
                    border: `1px solid ${role.color}40`
                  }}>
                    <Icon size={32} />
                  </div>

                  {/* Text Content */}
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{role.title}</h3>
                  <p style={{ color: '#94a3b8', lineHeight: 1.6, flexGrow: 1, marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                    {role.desc}
                  </p>

                  {/* Action Button */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '1rem 1.25rem', borderRadius: '12px',
                    background: isHovered ? role.color : 'rgba(15, 23, 42, 0.6)',
                    color: isHovered ? '#fff' : '#f8fafc',
                    fontWeight: 600, transition: 'all 0.3s ease'
                  }}>
                    <span>Access Portal</span>
                    <ArrowRight size={18} style={{ 
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)', 
                      transition: 'transform 0.3s ease' 
                    }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;