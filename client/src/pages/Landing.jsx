import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'farmer' ? '/farmer' : '/vendor');
  }, [user]);

  return (
    <div className="land">
      <div className="land-logo">
        <img src="/images/harvo_logo.png" alt="" />
        <span>Harvo</span>
      </div>

      <div className="land-center">
        <div className="land-tagline nepali">
          किसानको बाली,<br/>सीधा बजार
        </div>
        <div className="land-sub">
          Nepal's direct farm marketplace.<br/>No middlemen. Fair prices.
        </div>

        <div className="land-btns">
          <Link to="/register?role=farmer" className="land-btn land-btn-green">
            <span className="nepali">किसान</span>
            <span className="land-btn-sub">I am a Farmer</span>
          </Link>
          <Link to="/register?role=vendor" className="land-btn land-btn-dark">
            <span className="nepali">व्यापारी</span>
            <span className="land-btn-sub">I am a Vendor</span>
          </Link>
        </div>

        <Link to="/login" className="land-login-link">Already have an account? Sign in</Link>
      </div>

      <div className="land-footer">
        <Link to="/impact" className="land-footer-link">Live Impact Board</Link>
        <span className="land-dot" />
        <span className="text-muted" style={{fontSize:13}}>47 districts · 12,000+ farmers</span>
      </div>
    </div>
  );
}
