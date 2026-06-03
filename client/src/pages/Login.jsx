import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Auth.css';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      login(data.user, data.token);                    // ← correct call
      navigate(data.user.role === 'farmer' ? '/farmer' : '/vendor');
    } catch (err) {
      setError(err.response?.data?.message || 'Wrong phone or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/" className="auth-logo-link">
          <img src="/images/harvo_logo.png" alt="Harvo" />
          Harvo
        </Link>
        <p className="auth-brand-tag nepali">किसानको बाली, सीधा बजार</p>
      </div>

      <div className="auth-box card">
        <h2 className="auth-title">Sign in</h2>
        <p className="text-muted" style={{marginBottom:24,fontSize:14}}>Enter your phone number and password</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handle} className="auth-form">
          <div>
            <label className="input-label">Phone Number</label>
            <input className="input" type="tel" placeholder="98XXXXXXXX"
              value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          New to Harvo? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
