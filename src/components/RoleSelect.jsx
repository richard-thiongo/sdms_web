import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BookOpen,
  Shield,
  ArrowLeft
} from 'lucide-react';

const RoleSelection = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredCard, setHoveredCard] = React.useState(null);
  const [backHovered, setBackHovered] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 100;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #2d2a6e 50%, #1e1b4b 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    paddingTop: '4rem'
  };

  const contentStyle = {
    maxWidth: '1200px',
    width: '100%',
    color: 'white',
    margin: '0 auto',
    padding: '1.5rem 1rem'
  };

  const fixedBackButtonStyle = {
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#c4b5fd',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    background: scrolled ? 'rgba(30, 27, 75, 0.95)' : 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    fontSize: '0.95rem',
    fontWeight: '500',
    zIndex: 1000,
    border: scrolled ? '1px solid rgba(139, 92, 246, 0.2)' : 'none',
    boxShadow: scrolled ? '0 4px 15px rgba(0, 0, 0, 0.3)' : 'none'
  };

  const backButtonHoverStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#faf5ff',
    transform: 'translateX(-3px)'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '3rem'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem'
  };

  const logoIconStyle = {
    width: '2.5rem',
    height: '2.5rem',
    color: '#8b5cf6'
  };

  const brandTextStyle = {
    fontSize: '2.25rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    background: 'linear-gradient(135deg, #faf5ff 0%, #ddd6fe 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '1.125rem',
    color: '#ddd6fe',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6'
  };

  const rolesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem'
  };

  const roleCardStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '14px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    color: 'inherit'
  };

  const roleCardHoverStyle = {
    transform: 'translateY(-4px)',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)'
  };

  const roleIconStyle = {
    width: '3.5rem',
    height: '3.5rem',
    margin: '0 auto 1.25rem',
    padding: '0.75rem',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const roleTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#faf5ff'
  };

  const roleDescriptionStyle = {
    color: '#c4b5fd',
    marginBottom: '1.5rem',
    lineHeight: '1.6',
    fontSize: '0.95rem'
  };

  const roleFeaturesStyle = {
    listStyle: 'none',
    marginBottom: '1.5rem',
    textAlign: 'left'
  };

  const roleFeatureItemStyle = {
    color: '#c4b5fd',
    marginBottom: '0.5rem',
    paddingLeft: '0',
    position: 'relative',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const checkIconStyle = {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: '1rem',
    flexShrink: '0'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '0.875rem 1.25rem',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none'
  };

  const footerStyle = {
    marginTop: '2.5rem',
    paddingTop: '1.5rem',
    color: '#c4b5fd',
    fontSize: '0.85rem',
    textAlign: 'center'
  };

  const roles = [
    {
      id: 'school-admin',
      title: 'School Admin',
      icon: Users,
      description: 'Complete school management, teacher oversight, and serious incident resolution with full reporting capabilities.',
      features: [
        'Teacher Management',
        'S-tier Case Review', 
        'School Analytics',
        'Report Generation'
      ],
      color: '#8b5cf6',
      buttonColor: '#8b5cf6',
      buttonHoverColor: '#7c3aed',
      route: '/login?role=admin'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      icon: GraduationCap,
      description: 'Mobile-first incident reporting, class behavior tracking, and student management with real-time analytics.',
      features: [
        'Incident Reporting (A/B/S-tier)',
        'Class Behavior Tracking',
        'Student Management', 
        'Real-time Analytics'
      ],
      color: '#60a5fa',
      buttonColor: '#60a5fa',
      buttonHoverColor: '#3b82f6',
      route: '/login?role=teacher'
    },
    {
      id: 'student',
      title: 'Student',
      icon: BookOpen,
      description: 'Transparent access to personal records, behavior tracking, and appeal submission for fair process.',
      features: [
        'Incident History',
        'Progress Tracking',
        'Appeal System',
        'Behavior Insights'
      ],
      color: '#10b981',
      buttonColor: '#10b981',
      buttonHoverColor: '#059669',
      route: '/login?role=student'
    }
  ];

  return (
    <div style={containerStyle}>
      <Link 
        to="/"
        style={{
          ...fixedBackButtonStyle,
          ...(backHovered ? backButtonHoverStyle : {})
        }}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      <div style={contentStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>
            <Shield style={logoIconStyle} />
            <span style={brandTextStyle}>Wazi</span>
          </div>
          <h1 style={titleStyle}>Select Your Role</h1>
          <p style={subtitleStyle}>
            Choose how you want to access the Wazi discipline management system
          </p>
        </div>

        <div style={rolesGridStyle}>
          {roles.map((role) => {
            const RoleIcon = role.icon;
            const isHovered = hoveredCard === role.id;
            
            return (
              <Link
                key={role.id}
                to={role.route}
                style={{
                  ...roleCardStyle,
                  ...(isHovered ? roleCardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard(role.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{
                  ...roleIconStyle,
                  background: `rgba(${parseInt(role.color.slice(1, 3), 16)}, ${parseInt(role.color.slice(3, 5), 16)}, ${parseInt(role.color.slice(5, 7), 16)}, 0.1)`,
                  color: role.color
                }}>
                  <RoleIcon size={28} />
                </div>
                
                <h3 style={roleTitleStyle}>{role.title}</h3>
                <p style={roleDescriptionStyle}>{role.description}</p>
                
                <ul style={roleFeaturesStyle}>
                  {role.features.map((feature, index) => (
                    <li key={index} style={roleFeatureItemStyle}>
                      <span style={checkIconStyle}>✓</span>
                      <span>• {feature}</span>
                    </li>
                  ))}
                </ul>

                <div style={{
                  ...buttonStyle,
                  background: isHovered ? role.buttonHoverColor : role.buttonColor,
                  color: 'white',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)'
                }}>
                  Access Portal
                </div>
              </Link>
            );
          })}
        </div>

        <div style={footerStyle}>
          <p>Select the role that matches your position in the school system</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;