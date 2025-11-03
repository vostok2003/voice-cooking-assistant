import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import '../auth.css';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      nav('/app');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please check credentials and try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background gradients */}
      <div className="auth-gradient-bg">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>
      </div>

      <Header />
      
      <div className='auth-wrapper'>
        <motion.div
          className="auth-container"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <motion.div className="auth-badge" variants={fadeIn}>
            <span className="auth-badge-icon">🔐</span>
            <span>Secure Login</span>
          </motion.div>

          <motion.h2 className="auth-title" variants={fadeIn}>
            Welcome Back
          </motion.h2>

          <motion.p className="auth-subtitle" variants={fadeIn}>
            Sign in to continue your cooking journey
          </motion.p>

          <motion.form 
            onSubmit={submit} 
            className="auth-form-glass"
            variants={fadeIn}
          >
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className="form-input-glass"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                <span className="label-icon">🔑</span>
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="form-input-glass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              className="btn-auth-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-footer-text">
              New to Voice Cooking?{' '}
              <Link to="/register" className="auth-link">Create account</Link>
            </p>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
