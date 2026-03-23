import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
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
            <h1 className="hero-title text-gradient" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Terms & Conditions</h1>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Last updated: March 2026</p>

            <div style={{ color: 'var(--text-dim)', lineHeight: '1.8' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                By accessing or using the Lania Management Systems platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.
              </p>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>2. User Responsibilities</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                Users of the system (Admins, Teachers, Students) are obligated to:
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Maintain the confidentiality of their login credentials.</li>
                  <li>Ensure all submitted documentation and discipline records are accurate.</li>
                  <li>Use the system solely for its intended educational and administrative tracking purposes.</li>
                </ul>
              </div>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>3. Intellectual Property Rights</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Lania Management Systems, including its original content, features, aesthetic design, and functionality, are owned by Lania and are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>4. Limitation of Liability</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                While we strive for 100% uptime and data accuracy, Lania shall not be held liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the system.
              </p>

              <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>5. Changes to Terms</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We reserve the right to modify or replace these Terms at any time. We will notify school administrators of any significant changes to these terms prior to them taking effect.
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

export default TermsAndConditions;
