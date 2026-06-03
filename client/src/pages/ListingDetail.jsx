import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { CROPS } from '../components/CropPicker';
import OrderModal from '../components/OrderModal';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing,  setListing]  = useState(null);
  const [kalimati, setKalimati] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(r => { setListing(r.data); return api.get(`/kalimati/${r.data.crop}`); })
      .then(r => setKalimati(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="ld-loading">Loading...</div>;
  if (error || !listing) return (
    <div className="ld-loading" style={{flexDirection:'column',gap:16}}>
      <div style={{fontSize:40}}>⚠️</div>
      <div>Could not load this listing.</div>
      <button className="btn btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  const crop     = CROPS.find(c => c.name === listing.crop);
  const km       = kalimati;
  const savings  = km?.available ? Math.round(km.kalimatiAvg - listing.pricePerKg) : null;
  const harvestAge = listing.harvestDate
    ? Math.floor((Date.now() - new Date(listing.harvestDate)) / 86400000) : null;

  const freshColor = harvestAge === null ? 'gray' : harvestAge <= 2 ? 'green' : harvestAge <= 5 ? 'orange' : 'red';
  const freshLabel = harvestAge === null ? 'Unknown' : harvestAge === 0 ? 'Harvested today' : `${harvestAge} days ago`;

  return (
    <div className="ld-page">
      <button className="ld-back" onClick={() => navigate(-1)}>← Back</button>

      {/* HERO IMAGE */}
      <div className="ld-img-wrap">
        {crop?.img
          ? <img src={crop.img} alt={listing.crop} className="ld-img" />
          : <div className="ld-img-fallback" style={{background: crop?.fallback || '#333'}}>{listing.crop[0]}</div>}
        {savings > 0 && <div className="ld-save-badge">Save Rs {savings}/kg vs market</div>}
      </div>

      <div className="ld-body">
        {/* NAME + PRICE */}
        <div className="ld-top">
          <div>
            <div className="ld-crop-nep nepali">{crop?.nepali || listing.crop}</div>
            <div className="ld-crop-en">{listing.crop}</div>
          </div>
          <div className="ld-price-block">
            <div className="ld-price">Rs {listing.pricePerKg}</div>
            <div className="ld-per">/kg</div>
          </div>
        </div>

        {/* GRADE BADGE */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface2)', borderRadius: 100, border: '1px solid var(--border)', marginBottom: 20 }}>
          <span style={{fontSize:18}}>
            {listing.grade === 'A' ? '✨' : listing.grade === 'B' ? '👍' : '🧃'}
          </span>
          <span style={{fontWeight:600, fontSize:13, color:'var(--text)'}}>
            {listing.grade === 'A' ? 'Grade A (Premium/Export)' : listing.grade === 'B' ? 'Grade B (Standard Market)' : 'Grade C (Juice/Processing)'}
          </span>
        </div>

        {/* MARKET COMPARISON */}
        {km?.available && (
          <div className="ld-market card">
            <div className="ld-market-title">Kalimati Market Today</div>
            <div className="ld-market-row">
              <span>Market range</span>
              <strong>Rs {km.kalimatiMin} – Rs {km.kalimatiMax}/kg</strong>
            </div>
            <div className="ld-market-row">
              <span>Market average</span>
              <strong>Rs {km.kalimatiAvg}/kg</strong>
            </div>
            {savings > 0 && (
              <div className="ld-market-row ld-market-save">
                <span>You save</span>
                <strong className="ld-save-val">Rs {savings}/kg · {Math.round(savings/km.kalimatiAvg*100)}% below market</strong>
              </div>
            )}
          </div>
        )}

        {/* DETAILS GRID */}
        <div className="ld-details-grid">
          <div className="ld-detail-item">
            <div className="ld-detail-icon">📍</div>
            <div>
              <div className="ld-detail-label">From</div>
              <div className="ld-detail-val">{listing.farmer?.district}</div>
            </div>
          </div>
          <div className="ld-detail-item">
            <div className="ld-detail-icon">⚖️</div>
            <div>
              <div className="ld-detail-label">Available</div>
              <div className="ld-detail-val">{listing.quantity} kg</div>
            </div>
          </div>
          <div className={`ld-detail-item ld-fresh-${freshColor}`}>
            <div className="ld-detail-icon">🌱</div>
            <div>
              <div className="ld-detail-label">Harvested</div>
              <div className="ld-detail-val">{freshLabel}</div>
            </div>
          </div>
          <div className="ld-detail-item">
            <div className="ld-detail-icon">👤</div>
            <div>
              <div className="ld-detail-label">Farmer</div>
              <div className="ld-detail-val">{listing.farmer?.name}</div>
            </div>
          </div>
        </div>

        {/* FRESHNESS BAR */}
        {harvestAge !== null && (
          <div className="ld-fresh-bar-wrap">
            <div className="ld-fresh-bar-label">
              <span>Freshness</span>
              <span className={`ld-fresh-tag fresh-${freshColor}`}>
                {freshColor === 'green' ? 'Very Fresh' : freshColor === 'orange' ? 'Fresh' : 'Check Before Ordering'}
              </span>
            </div>
            <div className="ld-fresh-track">
              <div className="ld-fresh-fill"
                style={{
                  width: `${Math.max(5, 100 - harvestAge * 14)}%`,
                  background: freshColor === 'green' ? 'var(--green)' : freshColor === 'orange' ? 'var(--orange)' : 'var(--red)'
                }} />
            </div>
          </div>
        )}

        {/* ORDER BUTTON */}
        {user?.role === 'vendor' && listing.status !== 'sold' && (
          <button className="ld-order-btn btn btn-primary btn-lg" onClick={() => setOrdering(true)}>
            Order Now — Rs {listing.pricePerKg}/kg
          </button>
        )}
      </div>

      {ordering && (
        <OrderModal listing={listing} onClose={() => { setOrdering(false); navigate(-1); }} />
      )}
    </div>
  );
}
