import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Auth.css';

const DISTRICTS = [
  'Bhaktapur','Chitwan','Dhading','Dhankuta','Dhanusha','Dolakha',
  'Gorkha','Ilam','Jhapa','Jumla','Kaski','Kathmandu','Kavrepalanchok',
  'Lalitpur','Lamjung','Makwanpur','Morang','Mustang','Nawalpur',
  'Nuwakot','Palpa','Parbat','Parsa','Rupandehi','Salyan','Sindhuli',
  'Sindhupalchok','Solukhumbu','Sunsari','Syangja','Tanahu',
].sort();

export default function Register() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();

  const [form, setForm] = useState({
    name: '', phone: '', password: '',
    role: params.get('role') || 'farmer',
    district: 'Kathmandu',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isFarmer = form.role === 'farmer';

  const handle = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);
      navigate(data.user.role === 'farmer' ? '/farmer' : '/vendor');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-top-logo">Harvo</Link>

      <div className="auth-card">

        {/* Role tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-rt ${isFarmer ? 'auth-rt-active' : ''}`}
            onClick={() => set('role', 'farmer')}
          >
            Farmer <span className="nepali">· किसान</span>
          </button>
          <button
            type="button"
            className={`auth-rt ${!isFarmer ? 'auth-rt-active' : ''}`}
            onClick={() => set('role', 'vendor')}
          >
            Vendor <span className="nepali">· व्यापारी</span>
          </button>
        </div>

        <h1 className="auth-form-title">Create account</h1>
        <p className="auth-form-sub">
          {isFarmer
            ? 'List your crops. Earn fair prices directly.'
            : "Buy fresh produce directly from Nepal's farmers."}
        </p>

        {error && <div className="auth-error-msg">{error}</div>}

        <form onSubmit={handle} className="auth-fields">
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              className="auth-input"
              placeholder="Ram Bahadur Thapa"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>
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
            <label className="auth-label">District</label>
            <select
              className="auth-input auth-select"
              value={form.district}
              onChange={e => set('district', e.target.value)}
            >
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : `Join as ${isFarmer ? 'Farmer' : 'Vendor'} ↗`}
          </button>
        </form>

        <div className="auth-footer-note">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
