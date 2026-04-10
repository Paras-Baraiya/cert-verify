import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminCreatePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', secretKey: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/admin/create', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Admin account created!');
      navigate('/admin');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.5rem' }}>🛡️</div>
        </div>
        <h2>Create Admin Account</h2>
        <p className="subtitle">First-time setup: Create an administrator account using the admin secret key.</p>

        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.85rem', color: '#92400e' }}>
          ⚠️ The default admin secret key is <strong>ADMIN_SECRET_2024</strong>. Change it in your <code>.env</code> file before going to production.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="name" type="text" className="form-control" placeholder="Admin Name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" placeholder="admin@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Secret Key</label>
            <input name="secretKey" type="password" className="form-control" placeholder="Enter secret key" value={form.secretKey} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : '🛡️ Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCreatePage;
