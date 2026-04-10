import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const AdminDashboard = () => {
  const { API } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [stats, setStats] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [users, setUsers] = useState([]);
  const [certPage, setCertPage] = useState(1);
  const [certTotal, setCertTotal] = useState(0);
  const [certSearch, setCertSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load stats on mount
  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (activeTab === 'certificates') loadCertificates(); }, [activeTab, certPage, certSearch]);
  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab]);

  const loadStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data.stats);
    } catch { toast.error('Failed to load stats'); }
  };

  const loadCertificates = async () => {
    try {
      const res = await API.get(`/admin/certificates?page=${certPage}&limit=10&search=${certSearch}`);
      setCertificates(res.data.certificates);
      setCertTotal(res.data.pagination.total);
    } catch { toast.error('Failed to load certificates'); }
  };

  const loadUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.users);
    } catch { toast.error('Failed to load users'); }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) return toast.error('Only Excel (.xlsx, .xls) or CSV files allowed');

    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/admin/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
      toast.success(res.data.message);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDeleteCert = async (id) => {
    if (!window.confirm('Delete this certificate? This cannot be undone.')) return;
    try {
      await API.delete(`/admin/certificates/${id}`);
      toast.success('Certificate deleted');
      loadCertificates();
      loadStats();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggleUser = async (id) => {
    try {
      const res = await API.patch(`/admin/users/${id}/toggle`);
      toast.success(res.data.message);
      loadUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const downloadTemplate = () => {
    window.open('/api/admin/template', '_blank');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage certificates, users, and system data</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalCerts}</div>
            <div className="stat-label">📜 Total Certificates</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">👥 Registered Users</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#6366f1' }}>
            <div className="stat-number">{stats.topDomains?.[0]?._id || '—'}</div>
            <div className="stat-label">🏆 Top Domain</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="stat-number">{stats.recentUploads?.length || 0}</div>
            <div className="stat-label">🕐 Recent Uploads</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[['upload', '📤 Upload Data'], ['certificates', '📜 Certificates'], ['users', '👥 Users']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ color: 'var(--navy)', marginBottom: '4px' }}>Bulk Upload via Excel</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>Upload an Excel file with student certificate data</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
              ⬇️ Download Template
            </button>
          </div>

          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-icon">{uploading ? '⏳' : '📂'}</div>
            <h3>{uploading ? 'Uploading...' : 'Drop your Excel file here'}</h3>
            <p>or click to browse</p>
            <p className="upload-hint">Supported: .xlsx, .xls, .csv · Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files[0])}
              disabled={uploading}
            />
          </div>

          {uploadResult && (
            <div style={{ marginTop: '24px' }}>
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: uploadResult.results.failed === 0 ? '#d1fae5' : '#fef3c7',
                border: `1px solid ${uploadResult.results.failed === 0 ? '#6ee7b7' : '#fcd34d'}`
              }}>
                <strong style={{ color: uploadResult.results.failed === 0 ? '#065f46' : '#92400e' }}>
                  {uploadResult.message}
                </strong>
                <div style={{ marginTop: '8px', fontSize: '0.88rem', color: '#4b5563' }}>
                  ✅ {uploadResult.results.success} added/updated &nbsp;|&nbsp;
                  ❌ {uploadResult.results.failed} failed
                </div>
              </div>
              {uploadResult.results.errors.length > 0 && (
                <div style={{ marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px' }}>
                  <strong style={{ color: '#991b1b', fontSize: '0.9rem' }}>Errors:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '16px' }}>
                    {uploadResult.results.errors.map((e, i) => (
                      <li key={i} style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '4px' }}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Column guide */}
          <div style={{ marginTop: '32px' }}>
            <h4 style={{ color: 'var(--navy)', marginBottom: '16px' }}>Required Excel Columns</h4>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Column Name</th><th>Required</th><th>Example</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {[
                    ['Certificate ID', '✅ Yes', 'CERT001', 'Must be unique'],
                    ['Student Name', '✅ Yes', 'John Doe', 'Full name'],
                    ['Internship Domain', '✅ Yes', 'Web Development', 'Area of internship'],
                    ['Start Date', '✅ Yes', '2024-01-01', 'YYYY-MM-DD format'],
                    ['End Date', '✅ Yes', '2024-03-31', 'Must be after start date'],
                    ['Email', '⬜ Optional', 'john@example.com', 'Links cert to user account'],
                    ['College', '⬜ Optional', 'ABC University', 'Institution name'],
                    ['Grade', '⬜ Optional', 'Excellent', 'Excellent/Very Good/Good/Satisfactory'],
                  ].map(([col, req, ex, note]) => (
                    <tr key={col}><td><strong>{col}</strong></td><td>{req}</td><td><code>{ex}</code></td><td style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>{note}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="card">
          <div className="search-bar">
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, name or domain..."
              value={certSearch}
              onChange={e => { setCertSearch(e.target.value); setCertPage(1); }}
            />
          </div>

          {certificates.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No Certificates Found</h3><p>Upload data to get started</p></div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Cert ID</th><th>Student Name</th><th>Domain</th><th>Start</th><th>End</th><th>Grade</th><th>Downloads</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {certificates.map(c => (
                      <tr key={c._id}>
                        <td><code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>{c.certificateId}</code></td>
                        <td><strong>{c.studentName}</strong></td>
                        <td>{c.internshipDomain}</td>
                        <td>{formatDate(c.startDate)}</td>
                        <td>{formatDate(c.endDate)}</td>
                        <td><span className="badge badge-active">{c.grade}</span></td>
                        <td>{c.downloadCount || 0}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCert(c._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ color: 'var(--gray-600)', fontSize: '0.88rem' }}>
                  Showing {((certPage - 1) * 10) + 1}–{Math.min(certPage * 10, certTotal)} of {certTotal}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setCertPage(p => Math.max(1, p - 1))} disabled={certPage === 1}>← Prev</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setCertPage(p => p + 1)} disabled={certPage * 10 >= certTotal}>Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          {users.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><h3>No Users Yet</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-active'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => handleToggleUser(u._id)}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
