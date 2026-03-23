import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on load
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-elite">
      <div className="glow-mesh">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container-fluid">
          <div className="nav-content">
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              <ArrowLeft size={20} />
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="section-padding" style={{ paddingTop: '120px', paddingBottom: '4rem', minHeight: '100vh' }}>
        <div className="container-fluid" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="luxury-card terms-card">
            <h1 className="hero-title text-gradient" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Privacy Policy</h1>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Last updated: March 2026</p>

            <div style={{ color: 'var(--text-dim)', lineHeight: '1.8' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>1. Introduction</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Welcome to Lania Management Systems. We are committed to protecting the privacy and security of the schools, teachers, students, and guardians who use our platform to digitize school discipline records in Kenya.
              </p>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>2. Information We Collect</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                We collect personal information necessary to provide our services, which may include:
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Account credentials (names, emails, roles).</li>
                  <li>Discipline and behavior records as inputted by authorized school personnel.</li>
                  <li>System usage data to improve application performance.</li>
                </ul>
              </div>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>3. How We Use Information</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                The data collected on Lania is strictly used to facilitate the tracking of student behavior, enhance accountability, and provide analytics for school administrators. We do not sell or share student data with third-party marketers.
              </p>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>4. Data Security</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We employ industry-standard encryption, secure servers, and role-based access controls to guarantee that sensitive discipline records are only accessible to authorized individuals (e.g., specific teachers, admins, and the student's guardians).
              </p>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>5. Contact Us</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                If you have questions regarding this Privacy Policy or how your data is handled, please contact us through the Elite Support portal or your school administrator.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" style={{ padding: '2rem 0' }}>
        <div className="container-fluid" style={{ textAlign: 'center', color: 'var(--text-dark)', fontSize: '0.85rem' }}>
          &copy; 2026 Lania Management Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
