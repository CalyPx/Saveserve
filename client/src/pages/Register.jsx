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
    name:'', phone:'', password:'',
    role: params.get('role') || 'farmer',
    district:'Kathmandu',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handle = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);                    // ← correct call
      navigate(data.user.role === 'farmer' ? '/farmer' : '/vendor');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
        <h2 className="auth-title">Create account</h2>

        {/* Role Toggle */}
        <div className="auth-role-row">
          <button type="button"
            className={`auth-role-btn ${form.role==='farmer'?'active-green':''}`}
            onClick={() => set('role','farmer')}>
            <span className="nepali" style={{fontSize:22}}>किसान</span>
            <span style={{fontSize:12}}>Farmer</span>
          </button>
          <button type="button"
            className={`auth-role-btn ${form.role==='vendor'?'active-orange':''}`}
            onClick={() => set('role','vendor')}>
            <span className="nepali" style={{fontSize:22}}>व्यापारी</span>
            <span style={{fontSize:12}}>Vendor</span>
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handle} className="auth-form">
          <div>
            <label className="input-label">Full Name</label>
            <input className="input" placeholder="Your name"
              value={form.name} onChange={e => set('name',e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <input className="input" type="tel" placeholder="98XXXXXXXX"
              value={form.phone} onChange={e => set('phone',e.target.value)} required />
          </div>
          <div>
            <label className="input-label">District</label>
            <select className="input" value={form.district} onChange={e => set('district',e.target.value)}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters"
              value={form.password} onChange={e => set('password',e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Creating...' : `Join as ${form.role === 'farmer' ? 'Farmer' : 'Vendor'}`}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
