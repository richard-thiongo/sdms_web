import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';
import { 
  Users, 
  GraduationCap, 
  Shield, 
  Zap, 
  TrendingUp, 
  Smartphone, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  const roles = [
    {
      id: 'admin',
      title: 'Admin Portal',
      icon: Shield,
      description: 'Main dashboard for school heads. Monitor discipline trends, manage staff, and see school-wide accountability.',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      route: '/login/admin'
    },
    {
      id: 'teacher',
      title: 'Teacher Portal',
      icon: GraduationCap,
      description: 'The easiest way for teachers to record incidents. Log student behavior fast and keep classroom records organized.',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      route: '/teacher/login'
    },
    {
      id: 'student',
      title: 'Student Portal',
      icon: Users,
      description: 'Transparency for students and guardians. See discipline records and track behavioral progress over time.',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      route: '/students/login'
    }
  ];

  const features = [
    {
      title: 'Light Recording',
      desc: 'Our fast process helps you record incidents in seconds without breaking your classroom flow.',
      icon: Zap
    },
    {
      title: 'Cross-platform',
      desc: 'Teachers, admins, students, and guardians can all access the system on mobile or desktop.',
      icon: TrendingUp
    },
    {
      title: 'Data Insights',
      desc: 'Once enough data is collected, Lania shows you clear insights to help improve school discipline.',
      icon: Smartphone
    }
  ];

  return (
    <div className="landing-elite">
      {/* Visual background context */}
      <div className="glow-mesh">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container-fluid">
          <div className="nav-content">
            <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/Lania-removebg-preview.png" alt="Lania" />
            </div>

            <div className="nav-links">
              <button onClick={() => scrollToSection('capabilities')} className="nav-link">Functionalities</button>
              <button onClick={() => scrollToSection('portals')} className="nav-link">Portals</button>
              <button onClick={() => scrollToSection('impact')} className="nav-link">Impact</button>
            </div>

            <div className="nav-actions">
              <Link to="/role" className="btn-nav">
                <span>Portals</span>
                <span>   </span>
                <ArrowRight size={12} />
              </Link>
              <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
                <Menu />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}>
        <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
          <X size={40} />
        </button>
        <div className="mobile-links">
          <button onClick={() => scrollToSection('capabilities')} className="mobile-link">Functionality</button>
          <button onClick={() => scrollToSection('impact')} className="mobile-link">Metrics</button>
          <Link to="/role" className="mobile-link" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>Portals</Link>
        </div>
      </div>

      {/* Hero Section */}
      <header className="hero">
        <div className="container-fluid">
          <div className="hero-content animate-fade-in">
            <h1 className="hero-title text-gradient">
              Digitizing School <br />
              Discipline in Kenya
            </h1>
            <p className="hero-desc">
              Lania helps Kenyan schools record and digitize discipline records. 
              We ease the process of tracking behavior and increasing 
              accountability across the entire school.
            </p>
          </div>
        </div>
      </header>

      {/* Metrics Section */}
      <section id="impact" className="section-padding">
        <div className="container-fluid">
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value text-gradient">8x</div>
              <div className="metric-label">Efficiency</div>
            </div>
            <div className="metric-item">
              <div className="metric-value text-gradient">100%</div>
              <div className="metric-label">Transparency</div>
            </div>
            <div className="metric-item">
              <div className="metric-value text-gradient">24/7</div>
              <div className="metric-label">Readiness</div>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="section-padding">
        <div className="container-fluid">
          <div className="section-head">
            <h2>System Portals</h2>
            <p className="section-subtitle">Scroll horizontally to discover specialized entry points for every stakeholder.</p>
          </div>

          <div className="portals-wrap">
            <button className="carousel-btn btn-prev" onClick={() => carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' })}>
              <ChevronLeft size={24} />
            </button>
            
            <div className="portal-carousel" ref={carouselRef}>
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Link key={role.id} to={role.route} className="portal-card" style={{ '--role-color': role.color }}>
                    <div className="portal-icon-box">
                      <Icon size={40} />
                    </div>
                    <h3 className="portal-title">{role.title}</h3>
                    <p className="portal-desc">{role.description}</p>
                    <div className="portal-btn" style={{ background: role.color }}>
                      Enter Portal <ArrowRight size={20} />
                    </div>
                  </Link>
                );
              })}
            </div>

            <button className="carousel-btn btn-next" onClick={() => carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' })}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="capabilities" className="section-padding">
        <div className="container-fluid">
          <div className="section-head">
            <h2>How Lania Works</h2>
            <p>A simple and effective way to manage discipline and increase accountability.</p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="luxury-card">
                  <div className="card-icon">
                    <Icon size={32} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container-fluid">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/Lania-removebg-preview.png" alt="Lania" />
              <p className="footer-desc">
                Digitizing school discipline records for Kenyan schools. Increasing accountability and easing the tracking process.
              </p>
            </div>
            <div>
              <h4 className="footer-head">Platform</h4>
              <div className="footer-links">
                <button onClick={() => scrollToSection('capabilities')} className="footer-link">Capabilities</button>
                <button onClick={() => scrollToSection('portals')} className="footer-link">Portals</button>
                <Link to="/role" className="footer-link">Authentication</Link>
              </div>
            </div>
            <div>
              <h4 className="footer-head">System</h4>
              <div className="footer-links">
                <Link to="/terms-and-conditions" className="footer-link">Terms & Conditions</Link>
                <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
                <Link to="/" className="footer-link">Elite Support</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; 2026 Lania Management Systems. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;