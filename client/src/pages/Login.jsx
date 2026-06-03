import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Auth.css';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]   = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate(data.user.role === 'farmer' ? '/farmer' : '/vendor');
    } catch (err) {
      setError(err.response?.data?.message || 'Wrong phone or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-top-logo">Harvo</Link>

      <div className="auth-card">

        <h1 className="auth-form-title">Sign in</h1>
        <p className="auth-form-sub">
          Enter your phone number and password to continue.
        </p>

        {error && <div className="auth-error-msg">{error}</div>}

        <form onSubmit={handle} className="auth-fields">
          <div className="auth-field">
            <label className="auth-label">Phone Number</label>
            <input
              className="auth-input"
              type="tel"
              placeholder="98XXXXXXXX"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
            />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in ↗'}
          </button>
        </form>

        <div className="auth-footer-note">
          New to Harvo?{' '}
          <Link to="/register?role=farmer" className="auth-link">Join as Farmer</Link>
          {' · '}
          <Link to="/register?role=vendor" className="auth-link">Join as Vendor</Link>
        </div>
      </div>
    </div>
  );
}
