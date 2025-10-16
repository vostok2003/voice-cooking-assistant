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
    <header className="site-header">
      <div className="left">
        <Link to="/app" className="logo">Voice Cooking</Link>
      </div>

      <div className="right">
        <button onClick={toggle} aria-label="toggle-theme" className="theme-btn">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {user ? (
          <>
            <span className="user-name">{user.name || user.email}</span>
            <button onClick={onLogout} className="btn-ghost">Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn">Login</Link>
        )}
      </div>
    </header>
  );
}

