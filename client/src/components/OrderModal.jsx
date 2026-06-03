import { useState, useEffect, useRef } from 'react';
import { calcOrderCost } from '../utils/pricing';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './OrderModal.css';

const STEPS = ['quantity', 'breakdown', 'call', 'pay'];

export default function OrderModal({ listing, onClose }) {
  const { user } = useAuth();

  const [step, setStep]           = useState('quantity');
  const [quantity, setQuantity]   = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [placing, setPlacing]     = useState(false);
  const [feasibility, setFeasibility] = useState(null);
  const [aiLoading, setAiLoading]    = useState(false);
  const esewaFormRef = useRef(null);

  // Fetch AI feasibility when entering breakdown step
  useEffect(() => {
    if (step !== 'breakdown' || !listing.harvestDate) return;
    setAiLoading(true);
    api.post('/ai/feasibility', {
      crop:         listing.crop,
      harvestDate:  listing.harvestDate,
      distanceKm:   costs.distanceKm,
      fromDistrict: listing.farmer?.district || listing.district,
      quantity
    }).then(r => setFeasibility(r.data)).catch(() => {}).finally(() => setAiLoading(false));
  }, [step]);

  const costs = calcOrderCost(
    quantity,
    listing.pricePerKg,
    listing.farmer?.district || listing.district,
    user?.district
  );

  // eSewa ePay v2 — gets signed params from backend, then auto-submits form
  const handleEsewaPayment = async (orderId) => {
    try {
      const { data: params } = await api.post('/payment/esewa-params', {
        amount:  costs.grandTotal,
        orderId,
      });

      // Build and submit the eSewa form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = params.esewa_url;

      const fields = {
        amount:                  params.amount,
        tax_amount:              params.tax_amount,
        total_amount:            params.total_amount,
        transaction_uuid:        params.transaction_uuid,
        product_code:            params.product_code,
        product_service_charge:  params.product_service_charge,
        product_delivery_charge: params.product_delivery_charge,
        signed_field_names:      params.signed_field_names,
        signature:               params.signature,
        success_url: `${window.location.origin}/payment-success?oid=${orderId}`,
        failure_url: `${window.location.origin}/payment-failed`,
      };

      Object.entries(fields).forEach(([k, v]) => {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = k; inp.value = v;
        form.appendChild(inp);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      alert('Payment initialization failed. Please try again.');
      setPlacing(false);
    }
  };

  const placeOrderAndPay = async () => {
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        listingId: listing._id,
        quantity,
      });
      await handleEsewaPayment(data._id);
    } catch (e) {
      alert('Order failed. Please try again.');
      setPlacing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title">{listing.cropPhoto} {listing.crop} — Order</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-steps">
          {['Quantity','Cost','Call Farmer','Pay'].map((s, i) => (
            <div key={s} className={`mstep ${STEPS.indexOf(step) >= i ? 'active' : ''}`}>{i+1}. {s}</div>
          ))}
        </div>

        {/* ── STEP 1: QUANTITY ── */}
        {step === 'quantity' && (
          <div className="modal-body fade-in-up">
            <h3>कति किलो चाहिन्छ? <span className="text-muted" style={{fontSize:14}}>How many kg?</span></h3>
            <div className="qty-row">
              <button className="qty-btn minus" onClick={() => setQuantity(q => Math.max(1, q-1))}>−</button>
              <div className="qty-display">
                <div className="qty-num">{quantity}</div>
                <div className="qty-unit">kg</div>
              </div>
              <button className="qty-btn plus" onClick={() => setQuantity(q => Math.min(listing.quantity, q+1))}>+</button>
            </div>
            <div className="avail-note">Available: <strong>{listing.quantity} kg</strong> · From {listing.farmer?.district}</div>
            <div className="base-price-box">
              <div className="bp-row"><span>Base Price</span><strong>Rs {listing.pricePerKg}/kg</strong></div>
              <div className="bp-row"><span>Goods Subtotal</span><strong>Rs {(quantity * listing.pricePerKg).toLocaleString()}</strong></div>
              <p className="text-muted" style={{fontSize:12,marginTop:8}}>Full cost (logistics + commission) shown next.</p>
            </div>
            <button className="btn btn-primary" style={{width:'100%',marginTop:16}} onClick={() => setStep('breakdown')}>
              See Full Cost →
            </button>
          </div>
        )}

        {/* ── STEP 2: BREAKDOWN ── */}
        {step === 'breakdown' && (
          <div className="modal-body fade-in-up">
            <h3>Total Cost Breakdown</h3>
            <div className="breakdown-table">
              <div className="bt-row">
                <span>🌾 Goods ({quantity} kg × Rs {listing.pricePerKg})</span>
                <strong>Rs {costs.goodsTotal.toLocaleString()}</strong>
              </div>
              <div className="bt-row">
                <div>
                  <div>🚛 Logistics (~{costs.distanceKm} km)</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>Rs {costs.logisticsPerKg}/kg · {quantity} kg</div>
                </div>
                <strong>Rs {costs.logisticsTotal.toLocaleString()}</strong>
              </div>
              <div className="bt-row">
                <div>
                  <div>🏢 Platform Fee (4%)</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>Supports direct farmer connection</div>
                </div>
                <strong>Rs {costs.commission.toLocaleString()}</strong>
              </div>
              <div className="bt-row total-row">
                <span>💰 Total Payable</span>
                <strong style={{color:'var(--success)',fontSize:20}}>Rs {costs.grandTotal.toLocaleString()}</strong>
              </div>
            </div>

            <div className="deposit-box">
              <div className="deposit-title">💳 Full Payment via eSewa</div>
              <div className="deposit-amount">Rs {costs.grandTotal.toLocaleString()}</div>
              <p className="text-muted" style={{fontSize:13}}>
                Full amount paid upfront via eSewa. Farmer is notified once payment is confirmed.
              </p>
            </div>

            <div className="logistics-note">
              <strong>📦 Logistics Pricing Explained</strong>
              <ul>
                <li>Distance: <strong>{costs.distanceKm} km</strong> between your district and farmer</li>
                <li>Rate: <strong>Rs {costs.logisticsPerKg}/kg</strong> (lower for bulk orders)</li>
                <li>Ordering more = lower per-kg logistics cost</li>
              </ul>
            </div>

            {/* AI FEASIBILITY */}
            {aiLoading && (
              <div className="ai-loading">🤖 AI is analyzing freshness &amp; transport feasibility...</div>
            )}
            {feasibility && !aiLoading && (
              <div className={`ai-card ai-${feasibility.status}`}>
                <div className="ai-header">
                  <span className="ai-icon">{feasibility.status==='feasible'?'✅':feasibility.status==='risky'?'⚠️':'❌'}</span>
                  <span className="ai-title">AI Freshness Analysis</span>
                  <span className={`badge ${feasibility.status==='feasible'?'badge-green':feasibility.status==='risky'?'badge-orange':'badge-red'}`}>{feasibility.status.replace('_',' ')}</span>
                </div>
                <p className="ai-msg">{feasibility.vendorMessage}</p>
                <div className="ai-stats">
                  <span>🕐 Delivery: ~{feasibility.deliveryHours}h</span>
                  <span>📦 Shelf left after delivery: {feasibility.daysRemaining} days</span>
                </div>
                {feasibility.status === 'not_feasible' && (
                  <button className="btn btn-danger btn-sm" style={{width:'100%',marginTop:8}} onClick={onClose}>
                    ❌ Cancel — Goods may spoil
                  </button>
                )}
              </div>
            )}

            <div style={{display:'flex',gap:12}}>
              <button className="btn btn-ghost" onClick={() => setStep('quantity')}>← Back</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={() => setStep('call')}>
                Next: Call Farmer →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CALL FARMER ── */}
        {step === 'call' && (
          <div className="modal-body fade-in-up">
            <h3>📞 किसानलाई फोन गर्नुस्</h3>
            <p className="text-muted">Call the farmer to confirm quantity and arrange pickup before paying.</p>

            <div className="farmer-call-card card">
              <div className="fc-avatar">🧑‍🌾</div>
              <div className="fc-info">
                <div className="fc-name">{listing.farmer?.name}</div>
                <div className="fc-district text-muted">📍 {listing.farmer?.district}</div>
                <a href={`tel:${listing.farmer?.phone}`} className="btn btn-primary" style={{marginTop:12,display:'inline-flex'}}>
                  📱 Call {listing.farmer?.phone}
                </a>
              </div>
            </div>

            <div className="call-script card">
              <div className="cs-title">📋 Script (say this):</div>
              <p>"Namaste, ma KrishiDirect bata. Tapai ko <strong>{listing.crop}</strong> — <strong>{quantity} kg</strong> kinnu cha. Timings ra pickup milaunus."</p>
            </div>

            <div className="confirm-check" onClick={() => setConfirmed(c => !c)}>
              <div className={`check-box ${confirmed ? 'checked' : ''}`}>{confirmed ? '✓' : ''}</div>
              <span>
                मैले किसानसँग फोनमा कुरा गरेँ र सहमति भयो।<br/>
                <small className="text-muted">I've called and confirmed with the farmer.</small>
              </span>
            </div>

            <div className="no-purchase-warning">
              ⚠️ Full payment is non-refundable if you fail to collect goods without 48hr notice.
            </div>

            <div style={{display:'flex',gap:12,marginTop:8}}>
              <button className="btn btn-ghost" onClick={() => setStep('breakdown')}>← Back</button>
              <button className="btn btn-primary" style={{flex:1}} disabled={!confirmed} onClick={() => setStep('pay')}>
                Proceed to Pay →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PAY ── */}
        {step === 'pay' && (
          <div className="modal-body fade-in-up">
            <h3>💳 Pay via eSewa</h3>

            <div className="pay-summary card">
              <div className="ps-row"><span className="text-muted">Crop</span><strong>{listing.cropPhoto} {listing.crop}</strong></div>
              <div className="ps-row"><span className="text-muted">Quantity</span><strong>{quantity} kg</strong></div>
              <div className="ps-row"><span className="text-muted">Goods</span><strong>Rs {costs.goodsTotal.toLocaleString()}</strong></div>
              <div className="ps-row"><span className="text-muted">Logistics</span><strong>Rs {costs.logisticsTotal.toLocaleString()}</strong></div>
              <div className="ps-row"><span className="text-muted">Platform (4%)</span><strong>Rs {costs.commission.toLocaleString()}</strong></div>
              <div className="ps-row highlight-row">
                <span><strong>Total Payable</strong></span>
                <strong style={{color:'var(--success)',fontSize:22}}>Rs {costs.grandTotal.toLocaleString()}</strong>
              </div>
            </div>

            <div className="esewa-logo-box">
              <div className="esewa-logo">eSewa</div>
              <p className="text-muted" style={{fontSize:13,marginTop:4}}>You'll be redirected to eSewa to complete payment securely.</p>
            </div>

            <div className="esewa-test-note">
              🧪 <strong>Test credentials:</strong> eSewa ID: 9711111111 · Password: Nepal@123 · OTP: 123456
            </div>

            <div style={{display:'flex',gap:12}}>
              <button className="btn btn-ghost" onClick={() => setStep('call')}>← Back</button>
              <button className="btn btn-primary" style={{flex:1, background:'#60BB46', color:'#fff'}}
                onClick={placeOrderAndPay} disabled={placing}>
                {placing ? 'Redirecting to eSewa...' : `Pay Rs ${costs.grandTotal.toLocaleString()} →`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
