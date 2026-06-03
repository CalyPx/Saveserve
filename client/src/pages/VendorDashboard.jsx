import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import OrderModal from '../components/OrderModal';
import './VendorDashboard.css';

const CROP_FILTERS = ['All','🍅 Tomato','🥔 Potato','🥬 Cabbage','🥕 Carrot','🧅 Onion','🌽 Corn','🍊 Orange','🥦 Cauliflower','🍆 Eggplant','🌾 Rice'];

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings]   = useState([]);
  const [myOrders, setMyOrders]   = useState([]);
  const [filter, setFilter]       = useState('All');
  const [view, setView]           = useState('browse');
  const [activeListing, setActiveListing] = useState(null); // for OrderModal
  const [success, setSuccess]     = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [lRes, oRes] = await Promise.all([
        api.get('/listings'),
        api.get('/orders/my')
      ]);
      setListings(lRes.data);
      setMyOrders(oRes.data);
    } catch (e) {}
  };

  const filtered = filter === 'All'
    ? listings
    : listings.filter(l => l.crop.toLowerCase() === filter.split(' ').pop().toLowerCase());



  return (
    <div className="vendor-page">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">🌾 KrishiDirect</div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${view === 'browse' ? 'active' : ''}`} onClick={() => setView('browse')}>
            🛒 Browse Produce
          </button>
          <button className={`sidebar-link ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>
            📦 My Orders {myOrders.filter(o => o.status === 'confirmed').length > 0 && <span className="notif-dot" />}
          </button>
          <Link to="/impact" className="sidebar-link">📊 Impact Board</Link>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">🏪</div>
          <div>
            <div className="sidebar-name">{user?.name}</div>
            <div className="sidebar-district text-muted">{user?.district}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }} style={{ marginTop: 12 }}>Logout</button>
        </div>
      </aside>

      <main className="vendor-main">
        {success && <div className="toast-success">{success}</div>}

        {/* ── BROWSE ── */}
        {view === 'browse' && (
          <div className="fade-in-up">
            <div className="page-header">
              <div>
                <h1>Fresh Produce Available</h1>
                <p className="text-muted">Buy directly from farmers — no middlemen</p>
              </div>
            </div>

            {/* FILTERS */}
            <div className="filter-bar">
              {CROP_FILTERS.map(f => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>

            {/* LISTINGS GRID */}
            {filtered.length === 0
              ? <div className="empty-state">No listings available right now. Check back soon! 🌱</div>
              : (
                <div className="vendor-grid">
                  {filtered.map(l => (
                    <div className="vendor-card card" key={l._id}>
                      <div className="vendor-crop-emoji">{l.cropPhoto}</div>
                      <div className="vendor-crop-name">{l.crop}</div>

                      <div className="vendor-meta">
                        <div className="vm-row">
                          <span className="text-muted">Quantity</span>
                          <strong>{l.quantity} kg</strong>
                        </div>
                        <div className="vm-row">
                          <span className="text-muted">Price</span>
                          <strong style={{ color: 'var(--green-light)' }}>Rs {l.pricePerKg}/kg</strong>
                        </div>
                        <div className="vm-row">
                          <span className="text-muted">From</span>
                          <strong>{l.farmer?.district}</strong>
                        </div>
                        <div className="vm-row">
                          <span className="text-muted">Farmer</span>
                          <strong>{l.farmer?.name}</strong>
                        </div>
                      </div>

                      <div className="savings-tag">
                        💡 Save ~Rs {Math.max(0, 100 - l.pricePerKg)}/kg vs Kalimati
                      </div>

                      <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}
                        onClick={() => setActiveListing(l)}>
                        🛒 Order Now
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── ORDERS ── */}
        {view === 'orders' && (
          <div className="fade-in-up">
            <div className="page-header">
              <div><h1>My Orders</h1><p className="text-muted">Track your purchases</p></div>
            </div>
            {myOrders.length === 0
              ? <div className="empty-state">No orders yet. Browse produce and place your first order! 🛒</div>
              : (
                <div className="orders-list">
                  {myOrders.map(o => (
                    <div className="order-card card" key={o._id}>
                      <div className="order-emoji">{o.listing?.cropPhoto || '🌾'}</div>
                      <div className="order-info">
                        <div className="order-crop">{o.listing?.crop}</div>
                        <div className="text-muted">{o.quantity} kg · Rs {o.agreedPrice}/kg</div>
                        <div className="text-muted">Farmer: <strong style={{ color: 'var(--text)' }}>{o.farmer?.name}</strong></div>
                        <div className="text-muted">📞 Call: <a href={`tel:${o.farmer?.phone}`} style={{ color: 'var(--green-light)' }}>{o.farmer?.phone}</a></div>
                        <div className="text-muted">📍 From: {o.farmer?.district}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="order-total">Rs {o.totalAmount?.toLocaleString()}</div>
                        <span className={`badge ${o.status === 'completed' ? 'badge-green' : o.status === 'confirmed' ? 'badge-orange' : 'badge-red'}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      {activeListing && (
        <OrderModal
          listing={activeListing}
          onClose={() => { setActiveListing(null); fetchData(); }}
        />
      )}
      </main>
    </div>
  );
}
