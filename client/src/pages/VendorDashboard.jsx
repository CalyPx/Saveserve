import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import OrderModal from '../components/OrderModal';
import { CROPS } from '../components/CropPicker';
import './VendorDashboard.css';

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings]         = useState([]);
  const [myOrders, setMyOrders]         = useState([]);
  const [view, setView]                 = useState('browse');
  const [activeListing, setActiveListing] = useState(null);
  const [search, setSearch]             = useState('');
  const [kalimatiRates, setKalimatiRates] = useState({});

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

  const filtered = listings.filter(l =>
    !search ||
    l.crop.toLowerCase().includes(search.toLowerCase()) ||
    l.farmer?.district?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = myOrders.filter(o => ['pending','deposit_paid'].includes(o.status)).length;

  return (
    <div className="vd-page">
      <nav className="harvo-nav">
        <div className="nav-logo">
          <img src="/images/harvo_logo.png" alt="Harvo" />
          Harvo
        </div>
        <div className="nav-links">
          <button className={`nav-link ${view==='browse'?'nav-link-active':''}`} onClick={() => setView('browse')}>Browse</button>
          <button className={`nav-link ${view==='orders'?'nav-link-active':''}`} onClick={() => setView('orders')}>
            Orders {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </button>
          <Link to="/impact" className="nav-link">Impact</Link>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
        </div>
      </nav>

      <div className="vd-body">

        {/* ── BROWSE ── */}
        {view === 'browse' && (
          <div className="fade-in-up">
            <div className="vd-search-row">
              <input className="input vd-search" placeholder="Search crops or district..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0
              ? <div className="vd-empty">No produce available right now.</div>
              : (
                <div className="vd-grid">
                  {filtered.map(l => {
                    const crop    = getCrop(l.crop);
                    const km      = kalimatiRates[l.crop];
                    const savings = km?.available ? km.kalimatiAvg - l.pricePerKg : null;
                    return (
                      <div key={l._id} className="vd-card card" onClick={() => setActiveListing(l)}>
                        <div className="vd-img-wrap">
                          {crop?.img
                            ? <img src={crop.img} alt={l.crop} className="vd-img"
                                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                            : null}
                          <div className="vd-fallback" style={{background: crop?.fallback||'#333', display: crop?.img ? 'none' : 'flex'}}>
                            {l.cropPhoto || l.crop[0]}
                          </div>
                          {savings > 0 && (
                            <div className="vd-save-tag">−Rs {savings}/kg</div>
                          )}
                          {l.status === 'partially_sold' && (
                            <div className="vd-partial-tag">{l.quantity}kg left</div>
                          )}
                        </div>
                        <div className="vd-card-info">
                          <div className="vd-card-row">
                            <span className="vd-crop-nep nepali">{crop?.nepali || l.crop}</span>
                            <span className="vd-price">Rs {l.pricePerKg}<small>/kg</small></span>
                          </div>
                          <div className="vd-card-meta">
                            {l.farmer?.district} &nbsp;·&nbsp; {l.quantity} kg
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── ORDERS ── */}
        {view === 'orders' && (
          <div className="fade-in-up vd-orders-wrap">
            <h2 style={{marginBottom:20}}>My Orders</h2>
            {myOrders.length === 0
              ? <div className="vd-empty">No orders yet.</div>
              : myOrders.map(o => {
                  const crop = getCrop(o.listing?.crop);
                  return (
                    <div key={o._id} className="vdo-card card">
                      <div className="vdo-img-wrap" style={{background:(crop?.fallback||'#333')+'22'}}>
                        {crop?.img
                          ? <img src={crop.img} alt="" className="vdo-img" />
                          : <div className="vdo-fallback" style={{background:crop?.fallback||'#444'}}>{o.listing?.crop?.[0]}</div>}
                      </div>
                      <div className="vdo-info">
                        <div className="vdo-crop nepali">{crop?.nepali || o.listing?.crop}</div>
                        <div className="vdo-detail text-muted">{o.quantity} kg &nbsp;·&nbsp; Rs {o.agreedPrice}/kg</div>
                        <div className="vdo-farmer text-muted">
                          {o.farmer?.name}
                          {o.status === 'deposit_paid' && (
                            <a href={`tel:${o.farmer?.phone}`} className="vdo-call"> &nbsp;{o.farmer?.phone}</a>
                          )}
                        </div>
                      </div>
                      <div className="vdo-right">
                        <span className={`badge badge-${o.status==='completed'?'green':o.status==='deposit_paid'?'orange':'gray'}`}>
                          {o.status.replace('_',' ')}
                        </span>
                        <div className="vdo-total">Rs {o.totalAmount?.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      {activeListing && (
        <OrderModal listing={activeListing} onClose={() => { setActiveListing(null); fetchData(); }} />
      )}
    </div>
  );
}
