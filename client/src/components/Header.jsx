import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function Header(){
  const { theme, toggle } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header glass-header">
      <div className="header-container">
        <div className="left">
          <Link to="/app" className="logo-link">
            <span className="logo-icon">🍳</span>
            <span className="logo-text">Voice Cooking</span>
          </Link>
        </div>

        <div className="right">
          <button onClick={toggle} aria-label="toggle-theme" className="theme-toggle-btn">
            <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          {user ? (
            <>
              <span className="user-name">{user.name || user.email}</span>
              <button onClick={onLogout} className="btn-header-ghost">Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn-header-primary">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}

