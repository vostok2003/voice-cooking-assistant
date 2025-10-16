import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import '../auth.css';

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
      // Backend returns { token, user }
      login(res.data.token, res.data.user);
      nav('/app');
    } catch (err) {
      // show a friendly message
      const msg = err?.response?.data?.message || 'Login failed. Please check credentials and try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <div className='auth-wrapper'>
        <form onSubmit={submit} className="auth-form" aria-labelledby="login-heading">
        <h2 id="login-heading">Login</h2>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          aria-required="true"
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-required="true"
        />

        <button
          className="btn-primary"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Logging in…' : 'Login'}
        </button>

        <p>
          New to app? <Link to="/register">Create account</Link>
        </p>
      </form>

      </div>
    </div>
  );
}
