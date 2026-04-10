import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import CertificateCard from '../components/CertificateCard';

const VerifyCertificate = () => {
  const [certId, setCertId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const id = certId.trim().toUpperCase();
    if (!id) return toast.error('Please enter a Certificate ID');

    setLoading(true);
    setCertificate(null);
    setNotFound(false);

    try {
      const res = await axios.get(`/api/certificates/verify/${id}`);
      setCertificate(res.data.certificate);
      toast.success('Certificate found!');
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
        toast.error('Certificate not found. Please check the ID.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCertId('');
    setCertificate(null);
    setNotFound(false);
  };

  return (
    <div className="verify-page">
      <div className="card search-card">
        <h2>Verify Your Certificate</h2>
        <p className="subtitle">Enter your unique Certificate ID to retrieve and download your internship certificate.</p>

        <form onSubmit={handleSearch}>
          <div className="search-row">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CERT001"
              value={certId}
              onChange={e => setCertId(e.target.value.toUpperCase())}
              maxLength={30}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '🔄 Searching...' : '🔍 Search'}
            </button>
            {(certificate || notFound) && (
              <button type="button" className="btn btn-outline" onClick={handleClear}>
                ✕ Clear
              </button>
            )}
          </div>
        </form>

        {notFound && (
          <div style={{ marginTop: '32px', padding: '24px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#991b1b', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>😕</div>
            <strong>Certificate Not Found</strong>
            <p style={{ marginTop: '6px', fontSize: '0.9rem' }}>
              No certificate found for ID <strong>"{certId}"</strong>. Please double-check the ID provided to you.
            </p>
          </div>
        )}
      </div>

      {certificate && <CertificateCard cert={certificate} />}
    </div>
  );
};

export default VerifyCertificate;
