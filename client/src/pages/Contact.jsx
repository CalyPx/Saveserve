import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import './StaticPage.css';

export default function Contact() {
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const close = () => setMenu(false);
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = e => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="sp-page">
      <div className="sp-bg" style={{ backgroundImage: "url('https://images.pexels.com/photos/235725/pexels-photo-235725.jpeg?auto=compress&cs=tinysrgb&w=1920')" }} />
      <div className="sp-overlay" style={{ background: 'linear-gradient(135deg, rgba(2,18,8,0.85) 0%, rgba(5,30,14,0.65) 50%, rgba(0,0,0,0.35) 100%)' }} />

      {/* NAV */}
      <nav className="land-nav sp-nav">
        <Link to="/" className="land-logo sp-logo">Harvo</Link>
        <div className="land-nav-pills">
          <Link to="/"        className="lnp" onClick={close}>Home</Link>
          <Link to="/impact"  className="lnp" onClick={close}>Impact</Link>
          <Link to="/about"   className="lnp" onClick={close}>About Us</Link>
          <Link to="/contact" className="lnp sp-active" onClick={close}>Contact</Link>
        </div>
        <div className="land-nav-right">
          <Link to="/login" className="land-nav-cta">Sign In <span className="land-cta-arrow">↗</span></Link>
          <button className="land-hamburger" onClick={() => setMenu(v => !v)}>
            <span className={menu ? 'hb-x' : ''}></span>
            <span className={menu ? 'hb-x' : ''}></span>
            <span className={menu ? 'hb-x' : ''}></span>
          </button>
        </div>
      </nav>

      {menu && (
        <div className="land-mobile-menu" style={{ position: 'fixed', top: 72 }}>
          <Link to="/"        className="lmm-link" onClick={close}>Home</Link>
          <Link to="/impact"  className="lmm-link" onClick={close}>Impact</Link>
          <Link to="/about"   className="lmm-link" onClick={close}>About Us</Link>
          <Link to="/contact" className="lmm-link" onClick={close}>Contact</Link>
          <Link to="/login"   className="lmm-link lmm-signin" onClick={close}>Sign In ↗</Link>
        </div>
      )}

      <div className="sp-content sp-contact-layout">
        <div className="sp-contact-left">
          <div className="sp-tag">Get in Touch</div>
          <h1 className="sp-title">We'd love to hear from you</h1>
          <p className="sp-body">
            Whether you're a farmer wanting to join, a vendor with questions,
            or a logistics partner — reach out. We respond within 24 hours.
          </p>
          <div className="sp-contact-info">
            <div className="sp-ci-row">📧 <span>hello@harvo.com.np</span></div>
            <div className="sp-ci-row">📞 <span>+977-1-HARVO (42786)</span></div>
            <div className="sp-ci-row">📍 <span>Kalimati, Kathmandu, Nepal</span></div>
          </div>
        </div>

        <div className="sp-contact-right">
          {sent ? (
            <div className="sp-sent">
              <div style={{ fontSize: 48 }}>✓</div>
              <div className="sp-sent-title">Message sent!</div>
              <div className="sp-sent-sub">We'll reply within 24 hours.</div>
              <Link to="/" className="sp-btn sp-btn-primary" style={{ marginTop: 20 }}>Back to Home</Link>
            </div>
          ) : (
            <form className="sp-form" onSubmit={handle}>
              <div className="sp-field">
                <label className="sp-label">Your Name</label>
                <input className="sp-input" placeholder="Ram Bahadur" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="sp-field">
                <label className="sp-label">Email or Phone</label>
                <input className="sp-input" placeholder="98XXXXXXXX or email@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="sp-field">
                <label className="sp-label">Message</label>
                <textarea className="sp-input sp-textarea" placeholder="How can we help you?" rows={4} value={form.message} onChange={e => set('message', e.target.value)} required />
              </div>
              <button className="sp-btn sp-btn-primary" type="submit" style={{ width: '100%' }}>Send Message ↗</button>
            </form>
          )}
        </div>
      </div>

      <Link to="/" className="sp-back">← Back to Home</Link>
    </div>
  );
}
