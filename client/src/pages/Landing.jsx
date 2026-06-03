import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'farmer' ? '/farmer' : '/vendor');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [user]);

  const close = () => setMenu(false);

  return (
    <div className="land">
      <div className="land-bg" />
      <div className="land-overlay" />

      {/* ── NAV ── */}
      <nav className="land-nav">
        <div className="land-logo">Harvo</div>

        {/* Desktop pills */}
        <div className="land-nav-pills">
          <Link to="/"        className="lnp">Home</Link>
          <Link to="/impact"  className="lnp">Impact</Link>
          <Link to="/about"   className="lnp">About Us</Link>
          <Link to="/contact" className="lnp">Contact</Link>
        </div>

        <div className="land-nav-right">
          <Link to="/login" className="land-nav-cta">
            Sign In <span className="land-cta-arrow">↗</span>
          </Link>
          {/* Hamburger — mobile only */}
          <button className="land-hamburger" onClick={() => setMenu(v => !v)} aria-label="Menu">
            <span className={menu ? 'hb-x' : ''}></span>
            <span className={menu ? 'hb-x' : ''}></span>
            <span className={menu ? 'hb-x' : ''}></span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menu && (
        <div className="land-mobile-menu">
          <Link to="/"        className="lmm-link" onClick={close}>Home</Link>
          <Link to="/impact"  className="lmm-link" onClick={close}>Impact</Link>
          <Link to="/about"   className="lmm-link" onClick={close}>About Us</Link>
          <Link to="/contact" className="lmm-link" onClick={close}>Contact</Link>
          <Link to="/login"   className="lmm-link lmm-signin" onClick={close}>Sign In ↗</Link>
        </div>
      )}

      {/* ── HERO ── */}
      <main className="land-hero">
        <div className="land-tag">
          <span className="land-tag-dot" />
          Empowering Farmers
        </div>

        <h1 className="land-headline">
          Grow your income<br />
          with fair trade.
        </h1>

        <p className="land-sub">
          Zero middlemen. Zero hidden fees.<br />
          Farmers earn more. Vendors pay less.<br />
          Direct deals, honest prices — the way it should have always been.
        </p>

        <div className="land-role-section">
          <div className="land-i-am">I am a —</div>
          <div className="land-role-btns">
            <Link to="/register?role=farmer" className="land-rb land-rb-farmer">
              <span className="land-rb-en">Farmer</span>
              <span className="land-rb-np nepali"> · किसान</span>
              <span className="land-rb-arrow">↗</span>
            </Link>
            <Link to="/register?role=vendor" className="land-rb land-rb-vendor">
              <span className="land-rb-en">Vendor</span>
              <span className="land-rb-np nepali"> · व्यापारी</span>
              <span className="land-rb-arrow">↗</span>
            </Link>
          </div>
          <div className="land-login-hint">
            Have an account? <Link to="/login" className="land-login-link">Sign in →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
