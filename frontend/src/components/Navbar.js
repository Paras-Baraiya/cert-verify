import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          CertVerify
        </Link>
        <div className="navbar-links">
          <NavLink to="/verify" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Verify
          </NavLink>
          {user && user.role !== 'admin' && (
            <NavLink to="/my-certificates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              My Certs
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          )}
          {user ? (
            <>
              <span className="nav-user">👤 {user.name.split(' ')[0]}</span>
              <button className="btn-nav" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Login
              </NavLink>
              <Link to="/register" className="btn-nav">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
