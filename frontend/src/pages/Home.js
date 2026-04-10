import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '📤', title: 'Bulk Upload via Excel', desc: 'Admins can upload hundreds of student records instantly using a formatted Excel file.' },
  { icon: '🔍', title: 'Instant Verification', desc: 'Students verify their certificate using a unique Certificate ID in seconds.' },
  { icon: '📜', title: 'Auto-Generated Certificates', desc: 'Certificates are beautifully generated with all details pre-filled automatically.' },
  { icon: '⬇️', title: 'PDF Download', desc: 'Download print-ready certificate PDFs with a single click.' },
  { icon: '🔒', title: 'Secure & Encrypted', desc: 'JWT authentication and role-based access keeps data safe and access controlled.' },
  { icon: '✅', title: 'Data Integrity Checks', desc: 'Validation during import prevents incomplete or corrupted data from entering the system.' },
];

const Home = () => {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🏆 Trusted Certificate Platform</span>
          <h1>Verify & Download Your <span>Internship Certificate</span></h1>
          <p>A secure, fast, and elegant system for issuing and verifying internship certificates — powered by the MERN stack.</p>
          <div className="hero-actions">
            <Link to="/verify" className="btn btn-gold">🔍 Verify Your Certificate</Link>
            {!user && <Link to="/register" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>Create Account</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>Admin Dashboard</Link>}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Everything You Need</h2>
            <p>A complete solution for certificate management — from upload to download.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--navy)', padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--gold)', fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '12px' }}>Ready to Verify?</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '28px' }}>Enter your Certificate ID to instantly retrieve and download your internship certificate.</p>
        <Link to="/verify" className="btn btn-gold">Get Started →</Link>
      </section>
    </>
  );
};

export default Home;
