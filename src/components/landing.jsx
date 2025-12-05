import React, { useEffect, useState } from 'react';
import CountUp from '../components/CountUp';
import ClickSpark from '../components/ClickSpark';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  BookOpen, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Eye,
  TrendingUp,
  MessageSquare,
  Smartphone,
  Globe,
  Zap,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking on a link
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleNavLinkClick = (e, sectionId) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <ClickSpark
        sparkColor='#fcfbfdff'
        sparkSize={30}
        sparkRadius={30}
        sparkCount={6}
        duration={500}
      >
        <div className="wazi-landing min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]">
          {/* Navigation */}
          <nav 
            className={`wazi-nav flex items-center justify-between px-4 md:px-8 py-4 fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
              scrolled ? 'bg-[#1e1b4b]/90 backdrop-blur-sm py-3' : 'bg-transparent py-4'
            }`}
          >
            <div className="nav-brand flex items-center gap-2">
              <Shield className="wazi-logo w-8 h-8 text-white" />
              <span className="wazi-brand-text text-xl font-bold text-white">Wazi</span>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="nav-links hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                className="nav-link text-white hover:text-purple-300 transition-colors"
                onClick={(e) => handleNavLinkClick(e, 'features')}
              >
                Features
              </a>
              <a 
                href="#roles" 
                className="nav-link text-white hover:text-purple-300 transition-colors"
                onClick={(e) => handleNavLinkClick(e, 'roles')}
              >
                Roles
              </a>
              <a 
                href="#about" 
                className="nav-link text-white hover:text-purple-300 transition-colors"
                onClick={(e) => handleNavLinkClick(e, 'footer')}
              >
                About
              </a>
            </div>

            {/* Desktop CTA */}
            <Link to="/role?" className="wazi-nav-cta hidden md:flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
              <UserCheck size={18} />
              <span>Sign In</span>
            </Link>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-toggle md:hidden flex items-center justify-center w-10 h-10 text-white z-50 relative"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              style={{
                position: 'relative',
                zIndex: 1001
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </nav>

          {/* Mobile Menu Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(30, 27, 75, 0.98)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 999,
              opacity: mobileMenuOpen ? 1 : 0,
              visibility: mobileMenuOpen ? 'visible' : 'hidden',
              transition: 'opacity 300ms ease-in-out, visibility 300ms ease-in-out',
              overflowY: 'auto'
            }}
            className="mobile-menu-overlay"
          >
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '1.5rem',
                paddingTop: '5rem'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 1002
              }}>
                <button 
                  onClick={toggleMobileMenu}
                  aria-label="Close menu"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    padding: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <X size={28} />
                </button>
              </div>
              
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  flex: 1
                }}
              >
                <a 
                  href="#features" 
                  style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    padding: '1rem 0',
                    borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
                    textDecoration: 'none',
                    transition: 'color 200ms ease-in-out'
                  }}
                  className="hover:text-purple-300"
                  onClick={(e) => handleNavLinkClick(e, 'features')}
                >
                  Features
                </a>
                <a 
                  href="#roles" 
                  style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    padding: '1rem 0',
                    borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
                    textDecoration: 'none',
                    transition: 'color 200ms ease-in-out'
                  }}
                  className="hover:text-purple-300"
                  onClick={(e) => handleNavLinkClick(e, 'roles')}
                >
                  Roles
                </a>
                <a 
                  href="#about" 
                  style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    padding: '1rem 0',
                    borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
                    textDecoration: 'none',
                    transition: 'color 200ms ease-in-out'
                  }}
                  className="hover:text-purple-300"
                  onClick={(e) => handleNavLinkClick(e, 'footer')}
                >
                  About
                </a>
                
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '2rem'
                }}>
                  <Link 
                    to="/role?" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      backgroundColor: 'white',
                      color: '#6d28d9',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'background-color 200ms ease-in-out'
                    }}
                    className="hover:bg-purple-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCheck size={24} />
                    <span>Sign In</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <section className="wazi-hero flex items-center justify-center min-h-screen px-4 py-16 pt-20">
            <div className="wazi-hero-content flex flex-col items-center text-center max-w-4xl">
              <div className="wazi-hero-badge flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-8">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Transforming School Discipline</span>
              </div>
              <h1 className="wazi-hero-title text-4xl md:text-6xl font-bold text-white mb-6">
                Welcome to
                <span className="wazi-accent text-purple-300"> Wazi</span>
              </h1>
              <p className="wazi-hero-subtitle text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
                The intelligent discipline management system that brings clarity and efficiency 
                to student behavior tracking and classroom management.
              </p>
              
              <div className="wazi-hero-actions flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/role?" className="wazi-btn wazi-btn-primary flex items-center justify-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                  <UserCheck size={20} />
                  <span>Open Portal</span>
                </Link>
                <button 
                  className="wazi-btn wazi-btn-secondary flex items-center justify-center gap-2 bg-transparent border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                  onClick={() => scrollToSection('features')}
                >
                  <BookOpen size={20} />
                  <span>Learn More</span>
                </button>
              </div>

              {/* Stats */}
              <div className="wazi-stats-grid grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 w-full max-w-2xl">
                <div className="wazi-stat-card flex flex-col items-center text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                  <Clock className="wazi-stat-icon w-8 h-8 text-purple-300 mb-2" />
                  <div className="wazi-stat-number text-2xl font-bold text-white mb-1">
                    <CountUp
                      from={0}
                      to={95}
                      separator=","
                      direction="up"
                      duration={1}
                      className="count-up-text"
                    />%
                  </div>
                  <div className="wazi-stat-label text-sm text-gray-300">Faster Reporting</div>
                </div>
                <div className="wazi-stat-card flex flex-col items-center text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="wazi-stat-icon w-8 h-8 text-purple-300 mb-2" />
                  <div className="wazi-stat-number text-2xl font-bold text-white mb-1">
                    <CountUp
                      from={0}
                      to={360}
                      separator=","
                      direction="up"
                      duration={1}
                      className="count-up-text"
                    />°
                  </div>
                  <div className="wazi-stat-label text-sm text-gray-300">Full Visibility</div>
                </div>
                <div className="wazi-stat-card flex flex-col items-center text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="wazi-stat-icon w-8 h-8 text-purple-300 mb-2" />
                  <div className="wazi-stat-number text-2xl font-bold text-white mb-1">
                    <CountUp
                      from={0}
                      to={24}
                      separator=","
                      direction="up"
                      duration={1}
                      className="count-up-text"
                    />/
                    <CountUp
                      from={0}
                      to={7}
                      separator=","
                      direction="up"
                      duration={1}
                      className="count-up-text"
                    />
                  </div>
                  <div className="wazi-stat-label text-sm text-gray-300">Always Accessible</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="wazi-section wazi-features py-16 px-4">
            <div className="wazi-container max-w-6xl mx-auto">
              <div className="wazi-section-header flex flex-col items-center text-center mb-12">
                <h2 className="wazi-section-title text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Wazi?</h2>
                <p className="wazi-section-subtitle text-lg text-gray-300 max-w-2xl">
                  Built with educators in mind, Wazi provides comprehensive tools for modern school discipline management.
                </p>
              </div>

              <div className="wazi-features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="wazi-feature-card flex flex-col items-center text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="wazi-feature-icon w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-purple-300" />
                  </div>
                  <h3 className="wazi-feature-title text-xl font-semibold text-white mb-3">Smart Incident Reporting</h3>
                  <p className="wazi-feature-description text-gray-300">
                    Quick A, B, S-tier categorization with intelligent routing. Serious cases automatically escalate to administrators.
                  </p>
                </div>

                <div className="wazi-feature-card flex flex-col items-center text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="wazi-feature-icon w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Users size={32} className="text-blue-300" />
                  </div>
                  <h3 className="wazi-feature-title text-xl font-semibold text-white mb-3">Class Analytics</h3>
                  <p className="wazi-feature-description text-gray-300">
                    Track overall class behavior patterns and identify trends for proactive intervention and support.
                  </p>
                </div>

                <div className="wazi-feature-card flex flex-col items-center text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="wazi-feature-icon w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 size={32} className="text-green-300" />
                  </div>
                  <h3 className="wazi-feature-title text-xl font-semibold text-white mb-3">Real-time Insights</h3>
                  <p className="wazi-feature-description text-gray-300">
                    Generate comprehensive reports and dashboards with real-time data for informed decision-making.
                  </p>
                </div>

                <div className="wazi-feature-card flex flex-col items-center text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="wazi-feature-icon w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                    <Eye size={32} className="text-cyan-300" />
                  </div>
                  <h3 className="wazi-feature-title text-xl font-semibold text-white mb-3">Transparent Process</h3>
                  <p className="wazi-feature-description text-gray-300">
                    Students can view their records, understand consequences, and submit appeals when needed.
                  </p>
                </div>

                <div className="wazi-feature-card flex flex-col items-center text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="wazi-feature-icon w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={32} className="text-yellow-300" />
                  </div>
                  <h3 className="wazi-feature-title text-xl font-semibold text-white mb-3">Instant Notifications</h3>
                  <p className="wazi-feature-description text-gray-300">
                    Automated alerts keep administrators, teachers, and students informed about important updates.
                  </p>
                </div>

                <div className="wazi-feature-card flex flex-col items-center text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="wazi-feature-icon w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
                    <Smartphone size={32} className="text-gray-300" />
                  </div>
                  <h3 className="wazi-feature-title text-xl font-semibold text-white mb-3">Mobile First</h3>
                  <p className="wazi-feature-description text-gray-300">
                    Designed for mobile devices, allowing teachers to report incidents from anywhere in the school.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Role-based Access Section */}
          <section id="roles" className="wazi-section wazi-roles py-16 px-4">
            <div className="wazi-container max-w-6xl mx-auto">
              <div className="wazi-section-header flex flex-col items-center text-center mb-12">
                <h2 className="wazi-section-title text-3xl md:text-4xl font-bold text-white mb-4">Built for Every Role</h2>
                <p className="wazi-section-subtitle text-lg text-gray-300 max-w-2xl">
                  Customized interfaces designed specifically for each stakeholder in your school.
                </p>
              </div>

              <div className="wazi-roles-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* School Admin */}
                <div className="wazi-role-card flex flex-col p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-purple-500/20">
                  <div className="wazi-role-icon flex justify-center mb-4">
                    <Users size={48} className="text-purple-300" />
                  </div>
                  <h3 className="wazi-role-title text-xl font-semibold text-white mb-3 text-center">School Admin</h3>
                  <p className="wazi-role-description text-gray-300 mb-4 text-center">
                    Complete school management, teacher oversight, and serious incident resolution with full reporting capabilities.
                  </p>
                  <ul className="wazi-role-features flex flex-col gap-2 mb-6">
                    <li className="text-gray-300 text-sm">• Teacher Management</li>
                    <li className="text-gray-300 text-sm">• S-tier Case Review</li>
                    <li className="text-gray-300 text-sm">• School Analytics</li>
                    <li className="text-gray-300 text-sm">• Report Generation</li>
                  </ul>
                  <Link to="/role?" className="wazi-btn wazi-btn-primary flex items-center justify-center bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors mt-auto">
                    Access Portal
                  </Link>
                </div>

                {/* Teacher */}
                <div className="wazi-role-card flex flex-col p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-blue-500/20">
                  <div className="wazi-role-icon flex justify-center mb-4">
                    <GraduationCap size={48} className="text-blue-300" />
                  </div>
                  <h3 className="wazi-role-title text-xl font-semibold text-white mb-3 text-center">Teacher</h3>
                  <p className="wazi-role-description text-gray-300 mb-4 text-center">
                    Mobile-first incident reporting, class behavior tracking, and student management with real-time analytics.
                  </p>
                  <ul className="wazi-role-features flex flex-col gap-2 mb-6">
                    <li className="text-gray-300 text-sm">• Incident Reporting (A/B/S-tier)</li>
                    <li className="text-gray-300 text-sm">• Class Behavior Tracking</li>
                    <li className="text-gray-300 text-sm">• Student Management</li>
                    <li className="text-gray-300 text-sm">• Real-time Analytics</li>
                  </ul>
                  <Link to="/role?" className="wazi-btn wazi-btn-info flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-auto">
                    Access Portal
                  </Link>
                </div>

                {/* Student */}
                <div className="wazi-role-card flex flex-col p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-green-500/20">
                  <div className="wazi-role-icon flex justify-center mb-4">
                    <BookOpen size={48} className="text-green-300" />
                  </div>
                  <h3 className="wazi-role-title text-xl font-semibold text-white mb-3 text-center">Student</h3>
                  <p className="wazi-role-description text-gray-300 mb-4 text-center">
                    Transparent access to personal records, behavior tracking, and appeal submission for fair process.
                  </p>
                  <ul className="wazi-role-features flex flex-col gap-2 mb-6">
                    <li className="text-gray-300 text-sm">• Incident History</li>
                    <li className="text-gray-300 text-sm">• Progress Tracking</li>
                    <li className="text-gray-300 text-sm">• Appeal System</li>
                    <li className="text-gray-300 text-sm">• Behavior Insights</li>
                  </ul>
                  <Link to="/role?" className="wazi-btn wazi-btn-success flex items-center justify-center bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors mt-auto">
                    Access Portal
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="wazi-cta py-16 px-4">
            <div className="wazi-container max-w-4xl mx-auto">
              <div className="wazi-cta-content flex flex-col items-center text-center">
                <Globe className="wazi-cta-icon w-16 h-16 text-white mb-6" />
                <h2 className="wazi-cta-title text-2xl md:text-3xl font-bold text-white mb-4">
                  Ready to Transform Your School's Discipline Management?
                </h2>
                <p className="wazi-cta-description text-lg text-gray-300 mb-8 max-w-2xl">
                  Join schools using Wazi to create safer, more transparent learning environments.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer id="footer" className="wazi-footer py-12 px-4 bg-black/20">
            <div className="wazi-container max-w-6xl mx-auto">
              <div className="wazi-footer-content flex flex-col items-center text-center mb-8">
                <div className="wazi-footer-brand flex items-center gap-2 mb-4">
                  <Shield className="wazi-logo w-8 h-8 text-white" />
                  <span className="wazi-brand-text text-xl font-bold text-white">Wazi</span>
                </div>
                <p className="wazi-footer-tagline text-gray-300 mb-6 max-w-md">
                  Bringing clarity and efficiency to school discipline management
                </p>
                <div className="wazi-footer-links flex flex-wrap justify-center gap-6">
                  <Link to="/role?" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
                  <a 
                    href="#features"
                    className="text-gray-300 hover:text-white transition-colors"
                    onClick={(e) => handleNavLinkClick(e, 'features')}
                  >
                    Features
                  </a>
                  <a 
                    href="#roles"
                    className="text-gray-300 hover:text-white transition-colors"
                    onClick={(e) => handleNavLinkClick(e, 'roles')}
                  >
                    Roles
                  </a>
                  <a 
                    href="#footer"
                    className="text-gray-300 hover:text-white transition-colors"
                    onClick={(e) => handleNavLinkClick(e, 'footer')}
                  >
                    About
                  </a>
                </div>
              </div>
              <div className="wazi-footer-bottom text-center">
                <p className="text-gray-400 text-sm">&copy; 2025 Wazi Discipline System. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </ClickSpark>
    </>
  );
};

export default Landing;