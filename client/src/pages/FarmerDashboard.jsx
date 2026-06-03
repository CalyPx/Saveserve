import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import CropPicker, { CROPS } from '../components/CropPicker';
import VoiceCounter, { speakNepali } from '../components/VoiceCounter';
import './FarmerDashboard.css';

const STEPS = ['crop','unit','quantity','date','price','confirm'];
const STEP_LABELS = ['बाली','नाप','परिमाण','मिति','मूल्य','पुष्टि'];

function ask(text) {
  setTimeout(() => speakNepali(text), 350);
}

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [view,        setView]       = useState('home');
  const [step,        setStep]       = useState('crop');
  const [crop,        setCrop]       = useState(null);
  const [unit,        setUnit]       = useState('kg');
  const [quantity,    setQuantity]   = useState(1);
  const [harvestDate, setHarvestDate]= useState(() => new Date().toISOString().split('T')[0]);
  const [price,       setPrice]      = useState(20);
  const [kalimati,    setKalimati]   = useState(null);
  const [myListings,  setMyListings] = useState([]);
  const [myOrders,    setMyOrders]   = useState([]);
  const [loading,     setLoading]    = useState(false);
  const [posted,      setPosted]     = useState(false);

  useEffect(() => { fetchMyData(); }, []);

  const fetchMyData = async () => {
    try {
      const [lRes, oRes] = await Promise.all([api.get('/listings/my'), api.get('/orders/my')]);
      setMyListings(lRes.data);
      setMyOrders(oRes.data);
    } catch {}
  };

  useEffect(() => {
    if (!crop) return;
    api.get(`/kalimati/${crop.name}`).then(r => setKalimati(r.data)).catch(() => {});
  }, [crop]);

  // Voice prompt for each step — full Nepali
  useEffect(() => {
    if (view !== 'wizard') return;
    const nepaliCrop = crop?.nepali || '';
    const msgs = {
      crop:     'कुन बाली बेच्नु हुन्छ? तस्बिरमा थिचेर छान्नुस्।',
      unit:     `${nepaliCrop} — किलोमा बेच्नु हुन्छ कि क्विन्टलमा?`,
      quantity: `${nepaliCrop} कति ${unit === 'quintal' ? 'क्विन्टल' : 'किलो'} छ? माथि र तल थिचेर सेट गर्नुस्।`,
      date:     'बाली काटेको मिति कुन हो? तल क्यालेन्डरमा छान्नुस्।',
      price:    kalimati?.available
        ? `आज कालीमाटीमा ${nepaliCrop} को मूल्य ${kalimati.kalimatiMin} देखि ${kalimati.kalimatiMax} रुपैयाँ प्रति किलो छ। तपाईंले कति मूल्य राख्न चाहनुहुन्छ?`
        : `${nepaliCrop} को मूल्य प्रति ${unit === 'quintal' ? 'क्विन्टल' : 'किलो'} कति राख्नु हुन्छ?`,
      confirm:  `${unit === 'quintal' ? quantity + ' क्विन्टल' : quantity + ' किलो'} ${nepaliCrop}, ${price} रुपैयाँ प्रति ${unit === 'quintal' ? 'क्विन्टल' : 'किलो'}। सही छ भने हरियो बटन थिच्नुस्।`
    };
    if (msgs[step]) ask(msgs[step]);
  }, [step, view]);

  const maxPrice  = kalimati?.available ? (unit === 'quintal' ? kalimati.absoluteMax * 100 : kalimati.absoluteMax) : 99999;
  const minQty    = 1;
  const maxQty    = unit === 'quintal' ? 999 : 99999;

  const handlePriceChange = (val) => {
    const perKg = unit === 'quintal' ? val / 100 : val;
    if (kalimati?.available && perKg > kalimati.absoluteMax) {
      ask(`मूल्य धेरै बढी भयो। अधिकतम ${unit === 'quintal' ? kalimati.absoluteMax * 100 : kalimati.absoluteMax} रुपैयाँ राख्न सकिन्छ।`);
      return;
    }
    setPrice(val);
  };

  const handlePost = async () => {
    setLoading(true);
    try {
      const qtyKg   = unit === 'quintal' ? quantity * 100 : quantity;
      const priceKg = unit === 'quintal' ? price / 100 : price;
      await api.post('/listings', {
        crop: crop.name, cropPhoto: crop.nepali,
        unit, quantity, pricePerKg: priceKg, displayPrice: price,
        harvestDate, district: user.district,
      });
      setPosted(true);
      setView('home'); setStep('crop'); setCrop(null); setQuantity(1); setPrice(20); setKalimati(null);
      fetchMyData();
      ask('तपाईंको सूची सफलतापूर्वक राखियो। व्यापारीहरूलाई सूचना पठाइयो।');
      setTimeout(() => setPosted(false), 4000);
    } catch { ask('गल्ती भयो। फेरि प्रयास गर्नुहोस्।'); }
    finally { setLoading(false); }
  };

  const startWizard = () => { setStep('crop'); setView('wizard'); };
  const goBack      = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
    else setView('home');
  };

  const pendingOrders = myOrders.filter(o => o.status === 'deposit_paid');

  return (
    <div className="fd-page">

      {/* ── TOP NAV (farmer) ── */}
      <nav className="fd-nav">
        <div className="nav-logo">
          <img src="/images/harvo_logo.png" alt="Harvo" />
          Harvo
        </div>
        <div className="fd-nav-right">
          <Link to="/impact" className="fd-nav-link">प्रभाव</Link>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>
            बाहिर जानुस्
          </button>
        </div>
      </nav>

      {posted && <div className="toast-success nepali">सूची राखियो! व्यापारीहरूलाई सूचना पठाइयो।</div>}

      <div className="fd-body">

        {/* ── HOME ── */}
        {view === 'home' && (
          <div className="fd-home fade-in-up">

            <div className="fd-greeting">
              <div>
                <div className="fd-greeting-name nepali">नमस्ते, {user?.name}</div>
                <div className="fd-greeting-sub">{user?.district} जिल्ला</div>
              </div>
              <button className="fd-speak-btn" onClick={() => ask(`नमस्ते ${user?.name}। तपाईंसँग ${myListings.filter(l=>['available','partially_sold'].includes(l.status)).length} वटा सूची छन्।`)}>
                🔊
              </button>
            </div>

            {/* BIG POST BUTTON */}
            <button className="fd-post-btn btn-farmer-green" onClick={startWizard}>
              + नयाँ बाली राख्नुस्
            </button>

            {/* PENDING ORDERS ALERT */}
            {pendingOrders.length > 0 && (
              <div className="fd-alert">
                <div className="fd-alert-title nepali">{pendingOrders.length} वटा अर्डर आयो!</div>
                {pendingOrders.map(o => (
                  <div key={o._id} className="fd-order-row">
                    <div>
                      <div className="nepali fd-order-crop">{o.listing?.crop}</div>
                      <div className="fd-order-detail">{o.quantity} kg · {o.vendor?.name} ({o.vendor?.phone})</div>
                      <div className="fd-order-paid">Rs {o.totalAmount?.toLocaleString()} — भुक्तानी भयो</div>
                    </div>
                    <button className="btn-farmer-green" style={{width:'auto', padding:'10px 18px', fontSize:16, boxShadow:'none'}}
                      onClick={async () => { await api.patch(`/orders/${o._id}`, { status:'completed' }); fetchMyData(); ask('अर्डर पूरा भयो।'); }}>
                      पठाइयो ✓
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* MY LISTINGS */}
            <div className="fd-section-title nepali">मेरा सूचीहरू</div>
            {myListings.length === 0
              ? <div className="fd-empty nepali">अहिलेसम्म कुनै सूची छैन। माथिको बटन थिचेर सुरु गर्नुस्।</div>
              : (
                <div className="fd-listings">
                  {myListings.map(l => {
                    const cropData = CROPS.find(c => c.name === l.crop);
                    return (
                      <div key={l._id} className="fd-listing-card card">
                        <div className="fdl-img-wrap" style={{background: (cropData?.fallback || '#ccc') + '22'}}>
                          {cropData?.img
                            ? <img src={cropData.img} alt={l.crop} className="fdl-img" />
                            : <div className="fdl-fallback" style={{background: cropData?.fallback || '#888'}}>{l.cropPhoto || l.crop[0]}</div>
                          }
                        </div>
                        <div className="fdl-info">
                          <div className="fdl-name nepali">{l.cropPhoto || l.crop}</div>
                          <div className="fdl-qty">{l.quantity} किलो बाँकी</div>
                          {l.originalQty && l.quantity < l.originalQty && (
                            <div className="fdl-sold">{l.originalQty - l.quantity} किलो बिक्यो</div>
                          )}
                          <div className="fdl-price">रू {l.pricePerKg}/kg</div>
                          <span className={`badge ${l.status === 'available' ? 'badge-green' : l.status === 'partially_sold' ? 'badge-orange' : 'badge-red'}`}>
                            {l.status === 'available' ? 'उपलब्ध' : l.status === 'partially_sold' ? 'आंशिक बिक्यो' : l.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── WIZARD ── */}
        {view === 'wizard' && (
          <div className="fd-wizard fade-in-up">

            {/* Progress bar */}
            <div className="fd-progress">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className={`fd-progress-step ${STEPS.indexOf(step) >= i ? 'done' : ''}`}>
                  <div className="fd-progress-dot" />
                  <div className="fd-progress-label nepali">{label}</div>
                </div>
              ))}
            </div>

            {/* STEP 1: CROP */}
            {step === 'crop' && (
              <div className="fd-step">
                <div className="fd-step-title nepali">कुन बाली बेच्नु हुन्छ?</div>
                <button className="fd-listen-btn" onClick={() => ask('कुन बाली बेच्नु हुन्छ? तस्बिरमा थिचेर छान्नुस्।')}>🔊 सुन्नुस्</button>
                <CropPicker selected={crop} onSelect={c => { setCrop(c); ask(`${c.nepali} छान्नु भयो।`); setStep('unit'); }} />
              </div>
            )}

            {/* STEP 2: UNIT */}
            {step === 'unit' && (
              <div className="fd-step">
                <div className="fd-step-title nepali">
                  {crop?.img ? <img src={crop.img} alt={crop.name} className="fd-step-crop-img" /> : null}
                  {crop?.nepali} — कसरी नाप्ने?
                </div>
                <button className="fd-listen-btn" onClick={() => ask(`${crop?.nepali} — किलोमा बेच्नु हुन्छ कि क्विन्टलमा?`)}>🔊 सुन्नुस्</button>
                <div className="fd-unit-grid">
                  <button className="fd-unit-btn" onClick={() => { setUnit('kg'); setPrice(20); setStep('quantity'); ask('किलो छानियो।'); }}>
                    <div className="fd-unit-num nepali">किलो</div>
                    <div className="fd-unit-sub">1 किलो</div>
                    <div className="fd-unit-select-indicator" />
                  </button>
                  <button className="fd-unit-btn" onClick={() => { setUnit('quintal'); setPrice(2000); setStep('quantity'); ask('क्विन्टल छानियो।'); }}>
                    <div className="fd-unit-num nepali">क्विन्टल</div>
                    <div className="fd-unit-sub">१ क्विन्टल = १०० किलो</div>
                    <div className="fd-unit-select-indicator" />
                  </button>
                </div>
                <button className="btn-farmer-red" onClick={goBack} style={{marginTop:16}}>पछि जानुस्</button>
              </div>
            )}

            {/* STEP 3: QUANTITY */}
            {step === 'quantity' && (
              <div className="fd-step">
                <div className="fd-step-title nepali">कति {unit === 'quintal' ? 'क्विन्टल' : 'किलो'}?</div>
                <button className="fd-listen-btn" onClick={() => ask(`${crop?.nepali} कति ${unit === 'quintal' ? 'क्विन्टल' : 'किलो'} छ?`)}>🔊 सुन्नुस्</button>
                <VoiceCounter value={quantity} onChange={setQuantity} unit={unit === 'quintal' ? 'क्विन्टल' : 'किलो'} min={minQty} max={maxQty} />
                {unit === 'quintal' && <div className="fd-convert nepali">= {quantity * 100} किलो जम्मा</div>}
                <div className="fd-nav-btns">
                  <button className="btn-farmer-red" onClick={goBack}>पछि</button>
                  <button className="btn-farmer-green" onClick={() => setStep('date')}>अगाडि</button>
                </div>
              </div>
            )}

            {/* STEP 4: DATE */}
            {step === 'date' && (
              <div className="fd-step">
                <div className="fd-step-title nepali">बाली काटेको मिति?</div>
                <button className="fd-listen-btn" onClick={() => ask('बाली काटेको मिति छान्नुस्।')}>🔊 सुन्नुस्</button>
                <input type="date" className="fd-date-input"
                  value={harvestDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setHarvestDate(e.target.value)} />
                <div className="fd-date-note nepali">यसले सामानको ताजापन जाँच गर्न मद्दत गर्छ।</div>
                <div className="fd-nav-btns">
                  <button className="btn-farmer-red" onClick={goBack}>पछि</button>
                  <button className="btn-farmer-green" onClick={() => setStep('price')}>अगाडि</button>
                </div>
              </div>
            )}

            {/* STEP 5: PRICE */}
            {step === 'price' && (
              <div className="fd-step">
                <div className="fd-step-title nepali">मूल्य प्रति {unit === 'quintal' ? 'क्विन्टल' : 'किलो'}?</div>
                <button className="fd-listen-btn" onClick={() => ask(kalimati?.available
                  ? `आज कालीमाटीमा ${crop?.nepali} को मूल्य ${kalimati.kalimatiMin} देखि ${kalimati.kalimatiMax} रुपैयाँ प्रति किलो छ। सुझाव: ${unit === 'quintal' ? kalimati.suggestedMin * 100 : kalimati.suggestedMin} देखि ${unit === 'quintal' ? kalimati.suggestedMax * 100 : kalimati.suggestedMax} रुपैयाँ राख्नुस्।`
                  : 'मूल्य माथि र तल थिचेर सेट गर्नुस्।')}>
                  🔊 सुन्नुस्
                </button>

                {kalimati?.available && (
                  <div className="fd-kalimati-box">
                    <div className="fd-km-title nepali">आजको कालीमाटी बजार</div>
                    <div className="fd-km-range nepali">रू {kalimati.kalimatiMin} – रू {kalimati.kalimatiMax} <span>/किलो</span></div>
                    <div className="fd-km-suggest nepali">सुझाव: रू {unit === 'quintal' ? kalimati.suggestedMin * 100 : kalimati.suggestedMin} – रू {unit === 'quintal' ? kalimati.suggestedMax * 100 : kalimati.suggestedMax}</div>
                    <div className="fd-km-max nepali">अधिकतम: रू {unit === 'quintal' ? maxPrice : maxPrice}</div>
                  </div>
                )}

                <VoiceCounter value={price} onChange={handlePriceChange}
                  unit={`रू/${unit === 'quintal' ? 'क्विन्टल' : 'किलो'}`}
                  min={1} max={maxPrice} />

                {kalimati?.available && price > maxPrice && (
                  <div className="fd-price-warn nepali">मूल्य धेरै बढी छ! अधिकतम रू {maxPrice} मात्र राख्न मिल्छ।</div>
                )}

                <div className="fd-nav-btns">
                  <button className="btn-farmer-red" onClick={goBack}>पछि</button>
                  <button className="btn-farmer-green"
                    disabled={kalimati?.available && price > maxPrice}
                    onClick={() => setStep('confirm')}>अगाडि</button>
                </div>
              </div>
            )}

            {/* STEP 6: CONFIRM */}
            {step === 'confirm' && (
              <div className="fd-step">
                <div className="fd-step-title nepali">सही छ?</div>
                <button className="fd-listen-btn" onClick={() => ask(`${unit === 'quintal' ? quantity + ' क्विन्टल' : quantity + ' किलो'} ${crop?.nepali}, ${price} रुपैयाँ प्रति ${unit === 'quintal' ? 'क्विन्टल' : 'किलो'}। सही छ भने हरियो बटन थिच्नुस्।`)}>
                  🔊 सुन्नुस्
                </button>

                {crop && (
                  <div className="fd-confirm-card card">
                    <div className="fd-confirm-img-wrap">
                      {crop.img
                        ? <img src={crop.img} alt={crop.name} className="fd-confirm-img" />
                        : <div className="fd-confirm-fallback" style={{background: crop.fallback}}>{crop.nepali[0]}</div>
                      }
                    </div>
                    <div className="fd-confirm-details">
                      <div className="fd-confirm-row"><span className="nepali">बाली</span><strong className="nepali">{crop.nepali}</strong></div>
                      <div className="fd-confirm-row"><span className="nepali">परिमाण</span><strong className="nepali">{quantity} {unit === 'quintal' ? 'क्विन्टल' : 'किलो'}</strong></div>
                      <div className="fd-confirm-row"><span className="nepali">मूल्य</span><strong className="nepali">रू {price}/{unit === 'quintal' ? 'क्विन्टल' : 'किलो'}</strong></div>
                      <div className="fd-confirm-row"><span className="nepali">मिति</span><strong>{harvestDate}</strong></div>
                      <div className="fd-confirm-row"><span className="nepali">जिल्ला</span><strong>{user?.district}</strong></div>
                    </div>
                  </div>
                )}

                <div className="fd-nav-btns" style={{marginTop: 20}}>
                  <button className="btn-farmer-red" onClick={goBack}>गलत छ</button>
                  <button className="btn-farmer-green" onClick={handlePost} disabled={loading}>
                    {loading ? 'राखिँदैछ...' : 'सही छ, राख्नुस्'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
