import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import OrderModal from '../components/OrderModal';
import BottomNav from '../components/BottomNav';
import { CROPS } from '../components/CropPicker';
import './VendorDashboard.css';

const GRADE_MAP = {
  A: { label: 'Grade A', emoji: '✨', color: '#22C55E' },
  B: { label: 'Grade B', emoji: '👍', color: '#F97316' },
  C: { label: 'Grade C', emoji: '🧃', color: '#9CA3AF' },
};

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [listings,      setListings]      = useState([]);
  const [myOrders,      setMyOrders]      = useState([]);
  const [tab,           setTab]           = useState('browse');
  const [activeListing, setActiveListing] = useState(null);
  const [search,        setSearch]        = useState('');
  const [kalimatiRates, setKalimatiRates] = useState({});
  const [menuOpen,      setMenuOpen]      = useState(false);

  // Support ?tab=orders deep link from bottom nav
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('tab') === 'orders') setTab('orders');
  }, [location.search]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [lRes, oRes] = await Promise.all([api.get('/listings'), api.get('/orders/my')]);
      setListings(lRes.data);
      setMyOrders(oRes.data);
      const crops = [...new Set(lRes.data.map(l => l.crop))];
      const rates = {};
      await Promise.all(crops.map(async c => {
        try { const r = await api.get(`/kalimati/${c}`); rates[c] = r.data; } catch {}
      }));
      setKalimatiRates(rates);
    } catch {}
  };

  const getCrop = name => CROPS.find(c => c.name === name);

  const filtered = listings.filter(l => {
    if (!search) return true;
    const q    = search.toLowerCase();
    const crop = CROPS.find(c => c.name === l.crop);
    return (
      l.crop.toLowerCase().includes(q) ||
      l.farmer?.district?.toLowerCase().includes(q) ||
      (crop?.nepali && crop.nepali.includes(search))
    );
  });

  const pendingCount = myOrders.filter(o => ['pending','deposit_paid'].includes(o.status)).length;

  const statusLabel = s => ({
    pending:      'Pending',
    deposit_paid: 'Advance Paid',
    completed:    'Delivered',
    cancelled:    'Cancelled',
  }[s] || s);

  const statusClass = s => ({
    pending:      'badge-gray',
    deposit_paid: 'badge-orange',
    completed:    'badge-green',
    cancelled:    'badge-red',
  }[s] || 'badge-gray');

  return (
    <div className="vd-page page-with-bottom-nav">

      {/* TOP NAV */}
      <nav className="harvo-nav">
        <div className="nav-logo">
          <img src="/images/harvo_logo.png" alt="Harvo" />
          Harvo
        </div>
        <div className="nav-links">
          <button className={`nav-link ${tab==='browse'?'nav-link-active':''}`} onClick={() => setTab('browse')}>Browse</button>
          <button className={`nav-link ${tab==='orders'?'nav-link-active':''}`} onClick={() => setTab('orders')}>
            Orders {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </button>
          <Link to="/impact" className="nav-link">Impact</Link>
        </div>
        <div className="nav-actions">
          <div className="vd-user-pill" onClick={() => setMenuOpen(o => !o)}>
            <div className="vd-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span className="vd-username">{user?.name}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {menuOpen && (
            <div className="vd-dropdown">
              <div className="vd-dropdown-user">
                <div className="vd-dd-name">{user?.name}</div>
                <div className="vd-dd-meta">{user?.district} · Vendor</div>
              </div>
              <button className="vd-dd-item vd-dd-red" onClick={() => { logout(); navigate('/'); }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="vd-body">

        {/* ── BROWSE ── */}
        {tab === 'browse' && (
          <div className="fade-in-up">
            <div className="vd-browse-header">
              <div>
                <h2 className="vd-browse-title">Fresh Produce</h2>
                <p className="vd-browse-sub">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} available · Direct from farmers</p>
              </div>
            </div>

            <div className="vd-search-wrap">
              <svg className="vd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="vd-search"
                placeholder="Search crops or district..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="vd-search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="vd-empty">
                <div className="vd-empty-icon">🌾</div>
                <div className="vd-empty-text">No produce found</div>
                <div className="vd-empty-sub">Try a different search</div>
              </div>
            ) : (
              <div className="vd-grid">
                {filtered.map(l => {
                  const crop    = getCrop(l.crop);
                  const km      = kalimatiRates[l.crop];
                  const savings = km?.available ? Math.round(km.kalimatiAvg - l.pricePerKg) : null;
                  const grade   = GRADE_MAP[l.grade] || GRADE_MAP['B'];
                  const daysOld = l.harvestDate
                    ? Math.floor((Date.now() - new Date(l.harvestDate)) / 86400000)
                    : null;
                  const isFresh = daysOld !== null && daysOld <= 2;

                  return (
                    <div
                      key={l._id}
                      className="vd-card"
                      onClick={() => navigate(`/listing/${l._id}`)}
                    >
                      {/* IMAGE */}
                      <div className="vd-img-wrap">
                        {crop?.img
                          ? <img src={crop.img} alt={l.crop} className="vd-img"
                              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                          : null}
                        <div className="vd-fallback" style={{ background: crop?.fallback || '#333', display: crop?.img ? 'none' : 'flex' }}>
                          {l.cropPhoto || l.crop[0]}
                        </div>

                        {/* Top badges */}
                        {savings > 0 && <div className="vd-badge-save">−Rs {savings}/kg</div>}
                        {isFresh && <div className="vd-badge-fresh">🌱 Fresh</div>}
                      </div>

                      {/* INFO */}
                      <div className="vd-card-body">
                        <div className="vd-card-top">
                          <div className="vd-card-name nepali">{crop?.nepali || l.crop}</div>
                          <div className="vd-card-price">
                            Rs {l.pricePerKg}<span>/kg</span>
                          </div>
                        </div>

                        <div className="vd-card-meta-row">
                          <span className="vd-grade-tag" style={{ color: grade.color }}>
                            {grade.emoji} {grade.label}
                          </span>
                          <span className="vd-meta-text">{l.quantity} kg · {l.farmer?.district}</span>
                        </div>

                        {km?.available && savings > 0 && (
                          <div className="vd-saving-bar">
                            <span>Market: Rs {km.kalimatiAvg}/kg</span>
                            <span className="vd-saving-pct">Save {Math.round(savings/km.kalimatiAvg*100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === 'orders' && (
          <div className="fade-in-up">
            <div className="vd-browse-header">
              <div>
                <h2 className="vd-browse-title">My Orders</h2>
                <p className="vd-browse-sub">{myOrders.length} order{myOrders.length !== 1 ? 's' : ''} total</p>
              </div>
            </div>

            {myOrders.length === 0 ? (
              <div className="vd-empty">
                <div className="vd-empty-icon">📋</div>
                <div className="vd-empty-text">No orders yet</div>
                <div className="vd-empty-sub">Browse produce and place your first order</div>
                <button className="btn btn-primary" style={{marginTop:16}} onClick={() => setTab('browse')}>Browse Produce</button>
              </div>
            ) : (
              <div className="vdo-list">
                {myOrders.map(o => {
                  const crop    = getCrop(o.listing?.crop);
                  const grade   = GRADE_MAP[o.listing?.grade] || GRADE_MAP['B'];
                  const deposit = Math.max(50, Math.round((o.totalAmount || 0) * 0.10));
                  const cod     = (o.totalAmount || 0) - deposit;
                  return (
                    <div key={o._id} className="vdo-card">
                      <div className="vdo-img-wrap" style={{ background: (crop?.fallback || '#333') + '22' }}>
                        {crop?.img
                          ? <img src={crop.img} alt="" className="vdo-img" />
                          : <div className="vdo-fallback" style={{ background: crop?.fallback || '#444' }}>{o.listing?.crop?.[0]}</div>
                        }
                      </div>

                      <div className="vdo-info">
                        <div className="vdo-crop-row">
                          <span className="vdo-crop nepali">{crop?.nepali || o.listing?.crop}</span>
                          <span className={`badge ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
                        </div>
                        <div className="vdo-details">
                          <span>{o.quantity} kg · Rs {o.agreedPrice}/kg</span>
                          <span className="vdo-grade" style={{ color: grade.color }}>{grade.emoji} {grade.label}</span>
                        </div>
                        <div className="vdo-payment-row">
                          <span className="text-muted" style={{fontSize:13}}>
                            Advance paid: <strong style={{color:'var(--green)'}}>Rs {deposit.toLocaleString()}</strong>
                          </span>
                          <span className="text-muted" style={{fontSize:13}}>
                            On delivery: <strong>Rs {cod.toLocaleString()}</strong>
                          </span>
                        </div>
                        {o.status === 'deposit_paid' && o.farmer?.phone && (
                          <a href={`tel:${o.farmer.phone}`} className="vdo-call-btn">
                            📞 Call Farmer: {o.farmer.name} ({o.farmer.phone})
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {activeListing && (
        <OrderModal listing={activeListing} onClose={() => { setActiveListing(null); fetchData(); }} />
      )}

      <BottomNav ordersCount={pendingCount} />
    </div>
  );
}
