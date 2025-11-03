import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
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

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', { name, email, password });
      nav('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Register failed. Please try again.';
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
            <span className="auth-badge-icon">✨</span>
            <span>Join Us</span>
          </motion.div>

          <motion.h2 className="auth-title" variants={fadeIn}>
            Create Account
          </motion.h2>

          <motion.p className="auth-subtitle" variants={fadeIn}>
            Start your personalized cooking experience
          </motion.p>

          <motion.form 
            onSubmit={submit} 
            className="auth-form-glass"
            variants={fadeIn}
          >
            <div className="form-group">
              <label htmlFor="register-name" className="form-label">
                <span className="label-icon">👤</span>
                Full Name
              </label>
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                className="form-input-glass"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email" className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                className="form-input-glass"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password" className="form-label">
                <span className="label-icon">🔑</span>
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="form-input-glass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password"
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
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up
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
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Login</Link>
            </p>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
