import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import './StaticPage.css';

export default function AboutUs() {
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);

  return (
    <div className="sp-page">
      <div className="sp-bg" style={{ backgroundImage: "url('https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg?auto=compress&cs=tinysrgb&w=1920')" }} />
      <div className="sp-overlay" />

      {/* NAV */}
      <nav className="land-nav sp-nav">
        <Link to="/" className="land-logo sp-logo">Harvo</Link>
        <div className="land-nav-pills">
          <Link to="/"        className="lnp" onClick={close}>Home</Link>
          <Link to="/impact"  className="lnp" onClick={close}>Impact</Link>
          <Link to="/about"   className="lnp sp-active" onClick={close}>About Us</Link>
          <Link to="/contact" className="lnp" onClick={close}>Contact</Link>
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

      <div className="sp-content">
        <div className="sp-tag">Our Story</div>
        <h1 className="sp-title">Built for Nepal's farmers</h1>
        <p className="sp-body">
          Harvo was born from a simple observation: a farmer in Sindhupalchok earns
          Rs 12 per kg of tomatoes. By the time those same tomatoes reach a Kathmandu
          vendor, the price is Rs 80/kg. The Rs 68 difference disappears into a chain
          of middlemen — brokers, transporters, agents — none of whom grew anything.
        </p>
        <p className="sp-body">
          We built Harvo to collapse that chain. Farmers list their produce in 2 minutes
          using voice and photos — no reading required. Vendors browse, order, and pay a
          10% advance via eSewa. Logistics partners like Upaya CityCargo handle delivery.
          The farmer receives 90% of the agreed price directly on delivery.
        </p>
        <div className="sp-stats">
          <div className="sp-stat">
            <div className="sp-stat-val">Rs 0</div>
            <div className="sp-stat-lbl">Commission charged to farmers</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-val">38%</div>
            <div className="sp-stat-lbl">Average income increase</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-val">2 min</div>
            <div className="sp-stat-lbl">To list a crop via voice</div>
          </div>
        </div>
        <div className="sp-actions">
          <Link to="/register?role=farmer" className="sp-btn sp-btn-primary">Join as Farmer →</Link>
          <Link to="/register?role=vendor" className="sp-btn sp-btn-outline">Join as Vendor →</Link>
        </div>
      </div>

      <Link to="/" className="sp-back">← Back to Home</Link>
    </div>
  );
}
