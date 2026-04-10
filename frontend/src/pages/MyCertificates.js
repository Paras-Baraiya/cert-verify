import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CertificateCard from '../components/CertificateCard';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const MyCertificates = () => {
  const { API, user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/certificates/my');
        setCertificates(res.data.certificates);
      } catch {
        toast.error('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [API]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="my-certs-page">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: 'var(--navy)' }}>
          My Certificates
        </h2>
        <p style={{ color: 'var(--gray-600)', marginTop: '6px' }}>
          Certificates linked to <strong>{user.email}</strong>
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Certificates Found</h3>
            <p>No certificates are linked to your email address yet. Contact your administrator if you believe this is an error.</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '16px', marginBottom: selected ? '32px' : '0' }}>
            {certificates.map(cert => (
              <div key={cert._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', cursor: 'pointer' }}
                onClick={() => setSelected(selected?._id === cert._id ? null : cert)}>
                <div>
                  <span style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', marginRight: '10px' }}>
                    {cert.certificateId}
                  </span>
                  <strong>{cert.studentName}</strong>
                  <div style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginTop: '4px' }}>
                    {cert.internshipDomain} · {formatDate(cert.startDate)} – {formatDate(cert.endDate)}
                  </div>
                </div>
                <button className="btn btn-gold btn-sm" onClick={e => { e.stopPropagation(); setSelected(cert); }}>
                  View Certificate
                </button>
              </div>
            ))}
          </div>

          {selected && <CertificateCard cert={selected} />}
        </>
      )}
    </div>
  );
};

export default MyCertificates;
