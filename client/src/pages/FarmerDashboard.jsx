import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import CropPicker, { CROPS } from '../components/CropPicker';
import VoiceCounter, { speakNepali } from '../components/VoiceCounter';

import './FarmerDashboard.css';

const STEPS = ['crop','grade','unit','quantity','date','price','confirm'];

function ask(text) { setTimeout(() => speakNepali(text), 300); }

// Visual sun options — brightness decreases with each day
// Farmer sees a row of suns getting dimmer and taps the one that "feels" right
const SUN_OPTIONS = [
  { days: 0, brightness: '100%', opacity: 1.0,  voice: 'आजै काटेको' },
  { days: 1, brightness: '75%',  opacity: 0.78, voice: 'हिजो काटेको' },
  { days: 2, brightness: '55%',  opacity: 0.58, voice: 'दुई दिन अघि काटेको' },
  { days: 3, brightness: '38%',  opacity: 0.42, voice: 'तीन दिन अघि काटेको' },
  { days: 4, brightness: '25%',  opacity: 0.28, voice: 'चार दिन अघि काटेको' },
  { days: 5, brightness: '15%',  opacity: 0.18, voice: 'पाँच दिन अघि काटेको' },
  { days: 7, brightness: '8%',   opacity: 0.1,  voice: 'एक हप्ता अघि काटेको' },
];

function daysAgoDate(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [view,        setView]       = useState('home');
  const [step,        setStep]       = useState('crop');
  const [crop,        setCrop]       = useState(null);
  const [grade,       setGrade]      = useState('B');
  const [unit,        setUnit]       = useState('kg');
  const [quantity,    setQuantity]   = useState(1);
  const [harvestDays, setHarvestDays]= useState(0);   // days ago
  const [price,       setPrice]      = useState(20);
  const [kalimati,    setKalimati]   = useState(null);
  const [allRates,    setAllRates]   = useState({});
  const [myListings,  setMyListings] = useState([]);
  const [myOrders,    setMyOrders]   = useState([]);
  const [loading,     setLoading]    = useState(false);
  const [posted,      setPosted]     = useState(false);


  useEffect(() => { fetchMyData(); fetchAllRates(); }, []);

  const fetchMyData = async () => {
    try {
      const [lRes, oRes] = await Promise.all([api.get('/listings/my'), api.get('/orders/my')]);
      setMyListings(lRes.data);
      setMyOrders(oRes.data);
    } catch {}
  };

  const fetchAllRates = async () => {
    try {
      const res = await api.get('/kalimati/all');
      setAllRates(res.data || {});
    } catch {}
  };

  useEffect(() => {
    if (!crop) return;
    api.get(`/kalimati/${crop.name}`).then(r => {
      setKalimati(r.data);
      if (r.data?.available) setPrice(unit === 'quintal' ? r.data.suggestedMin * 100 : r.data.suggestedMin);
    }).catch(() => {});
  }, [crop, unit]);

  // Voice per step
  useEffect(() => {
    if (view !== 'wizard') return;
    const msgs = {
      crop:    'कुन बाली बेच्नु हुन्छ? तस्बिरमा थिचेर छान्नुस्।',
      grade:   'तपाईंको बाली कुन चित्र जस्तो देखिन्छ? छान्नुस्।',
      unit:    `${crop?.nepali||''} — किलोमा बेच्नु हुन्छ कि क्विन्टलमा?`,
      quantity:`${crop?.nepali||''} कति छ? माथि थिचेर बढाउनुस्, तल थिचेर घटाउनुस्। बीचमा थिचेर सिधा नम्बर लेख्न सकिन्छ।`,
      date:    'बाली काटेको कति दिन भयो? बटन थिचेर छान्नुस्।',
      price:   kalimati?.available
        ? `आज बजारमा ${crop?.nepali||''} को मूल्य ${kalimati.kalimatiMin} देखि ${kalimati.kalimatiMax} रुपैयाँ छ।`
        : 'मूल्य राख्नुस्।',
      confirm: `${quantity} ${unit==='quintal'?'क्विन्टल':'किलो'} ${crop?.nepali||''}, ${price} रुपैयाँ। सही छ भने हरियो बटन थिच्नुस्।`,
    };
    if (msgs[step]) ask(msgs[step]);
  }, [step, view]);

  const harvestDate  = daysAgoDate(harvestDays);
  const maxPrice     = kalimati?.available ? (unit==='quintal' ? kalimati.absoluteMax*100 : kalimati.absoluteMax) : 999999;
  const priceOverMax = kalimati?.available && price > maxPrice;

  const handlePost = async () => {
    setLoading(true);
    try {
      const priceKg = unit==='quintal' ? price/100 : price;
      await api.post('/listings', {
        crop: crop.name, cropPhoto: crop.nepali,
        unit, quantity, pricePerKg: priceKg, displayPrice: price,
        harvestDate, district: user.district, grade,
      });
      setPosted(true);
      setView('home'); setStep('crop'); setCrop(null); setGrade('B'); setQuantity(1); setPrice(20); setKalimati(null);
      fetchMyData();
      ask('सूची सफलतापूर्वक राखियो।');
      setTimeout(() => setPosted(false), 4000);
    } catch { ask('गल्ती भयो, फेरि प्रयास गर्नुस्।'); }
    finally { setLoading(false); }
  };

  const goNext = () => setStep(STEPS[STEPS.indexOf(step)+1]);
  const goBack = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i-1]); else setView('home');
  };

  const pendingOrders = myOrders.filter(o => o.status === 'deposit_paid');
  const activeListings = myListings.filter(l => ['available','partially_sold'].includes(l.status));

  return (
    <div className="fd-page">
      {/* NAV */}
      <nav className="fd-nav">
        <div className="fd-nav-logo">Harvo</div>
        <div className="fd-nav-right">
          <span className="fd-nav-user">{user?.name}</span>
          <button className="fd-speak-btn" onClick={() => ask(`Hello ${user?.name}`)}>🔊</button>
          <button className="fd-signout-btn" onClick={() => { logout(); navigate('/'); }}>Sign Out ↗</button>
        </div>
      </nav>

      {posted && <div className="toast-success nepali">✓ सूची राखियो!</div>}

      <div className="fd-body">

        {/* ── HOME ── */}
        {view === 'home' && (
          <div className="fd-home fade-in-up">
            <div className="fd-home-grid">
            <div className="fd-greeting">
              <div className="fd-greeting-name">Hello, {user?.name}</div>
              <div className="fd-greeting-sub">{user?.district} · {activeListings.length} active listings</div>
            </div>

            {/* PENDING ORDERS */}
            {pendingOrders.length > 0 && (
              <div className="fd-alert">
              <div className="fd-alert-title">🔔 {pendingOrders.length} order{pendingOrders.length > 1 ? 's' : ''} ready!</div>
                {pendingOrders.map(o => (
                  <div key={o._id} className="fd-order-row">
                    <div>
                      <div className="nepali" style={{fontSize:17,fontWeight:700}}>{o.listing?.cropPhoto || o.listing?.crop}</div>
                      <div style={{fontSize:13,color:'var(--text-muted)'}}>{o.quantity} किलो · {o.vendor?.name} · {o.vendor?.phone}</div>
                      <div style={{fontSize:14,color:'var(--green)',fontWeight:700,marginTop:4}}>रू {o.totalAmount?.toLocaleString()} — भुक्तानी भयो</div>
                    </div>
                    <button className="btn-farmer-green" style={{width:'auto',padding:'12px 16px',fontSize:16,boxShadow:'none'}}
                      onClick={async () => { await api.patch(`/orders/${o._id}`,{status:'completed'}); fetchMyData(); ask('Order marked as shipped.'); }}>
                      Shipped ✓
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-farmer-green fd-post-main" onClick={() => { setStep('crop'); setView('wizard'); }}>
              + Add New Listing
            </button>

            </div>{/* end fd-home-grid left */}

            {/* RIGHT COLUMN — Listings grid */}
            <div className="fd-home-right">
              <div className="fd-section-title">My Listings</div>
              {myListings.length === 0 ? (
                <div className="fd-empty">No listings yet.<br/>Click the button to get started!</div>
              ) : (
                <div className="fd-listings-grid">
                  {myListings.map(l => {
                    const cd = CROPS.find(c => c.name === l.crop);
                    return (
                      <div key={l._id} className="fd-listing-card">
                        <div className="fdl-img-wrap">
                          {cd?.img
                            ? <img src={cd.img} alt={l.crop} className="fdl-img" />
                            : <div className="fdl-img-placeholder" style={{background: cd?.fallback || '#333'}} />}
                          <span className={`fdl-badge ${l.status==='available'?'fdl-badge-green':l.status==='partially_sold'?'fdl-badge-orange':'fdl-badge-gray'}`}>
                            {l.status==='available' ? 'Available' : l.status==='partially_sold' ? 'Partial' : l.status}
                          </span>
                        </div>
                        <div className="fdl-info">
                          <div className="fdl-name nepali">{l.cropPhoto || l.crop}</div>
                          <div className="fdl-row">
                            <span className="fdl-qty">{l.quantity} kg left</span>
                            {l.originalQty > l.quantity && <span className="fdl-sold">{l.originalQty - l.quantity} sold ✓</span>}
                          </div>
                          <div className="fdl-price">Rs {l.pricePerKg}/kg</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WIZARD ── */}
        {view === 'wizard' && (
          <div className="fd-wizard fade-in-up">
            {/* PROGRESS */}
            <div className="fd-progress">
              {STEPS.map((s,i) => (
                <div key={s} className={`fd-pdot ${STEPS.indexOf(step)>=i?'fd-pdot-done':''}`} />
              ))}
            </div>

            {/* STEP 1: CROP */}
            {step === 'crop' && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div className="fd-step-title nepali">कुन बाली?</div>
                  <button className="fd-listen" onClick={() => ask('कुन बाली बेच्नु हुन्छ? छान्नुस्।')}>🔊</button>
                </div>
                <CropPicker selected={crop} onSelect={c=>{setCrop(c);ask(`${c.nepali} छानियो।`);setStep('grade');}} kalimatiRates={allRates} />
              </div>
            )}

            {/* STEP 1.5: GRADE (VISUAL) */}
            {step === 'grade' && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div className="fd-step-title nepali">कस्तो गुणस्तर? (Quality)</div>
                  <button className="fd-listen" onClick={() => ask('तपाईंको बाली कुन चित्र जस्तो देखिन्छ? छान्नुस्।')}>🔊</button>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:16, marginTop: 16}}>
                  <button className={`fd-unit-btn ${grade==='A'?'fd-unit-active':''}`} onClick={()=>{setGrade('A'); goNext();}} style={{flexDirection:'row', textAlign:'left', gap:16, padding:20, background:grade==='A'?'var(--surface2)':'var(--bg)'}}>
                    <div style={{fontSize:40}}>✨</div>
                    <div>
                      <div className="nepali" style={{fontSize:20, fontWeight:'bold', color:'var(--text)'}}>ठूलो र सफा (Grade A)</div>
                      <div style={{color:'var(--text-muted)'}}>Premium export quality</div>
                    </div>
                  </button>
                  <button className={`fd-unit-btn ${grade==='B'?'fd-unit-active':''}`} onClick={()=>{setGrade('B'); goNext();}} style={{flexDirection:'row', textAlign:'left', gap:16, padding:20, background:grade==='B'?'var(--surface2)':'var(--bg)'}}>
                    <div style={{fontSize:40}}>👍</div>
                    <div>
                      <div className="nepali" style={{fontSize:20, fontWeight:'bold', color:'var(--text)'}}>सामान्य (Grade B)</div>
                      <div style={{color:'var(--text-muted)'}}>Standard market size</div>
                    </div>
                  </button>
                  <button className={`fd-unit-btn ${grade==='C'?'fd-unit-active':''}`} onClick={()=>{setGrade('C'); goNext();}} style={{flexDirection:'row', textAlign:'left', gap:16, padding:20, background:grade==='C'?'var(--surface2)':'var(--bg)'}}>
                    <div style={{fontSize:40}}>🧃</div>
                    <div>
                      <div className="nepali" style={{fontSize:20, fontWeight:'bold', color:'var(--text)'}}>सानो वा दाग भएको (Grade C)</div>
                      <div style={{color:'var(--text-muted)'}}>Best for juice or processing</div>
                    </div>
                  </button>
                </div>
                <div className="fd-nav-btns" style={{marginTop:24}}>
                  <button className="btn-farmer-red" onClick={goBack}>← पछि</button>
                </div>
              </div>
            )}

            {/* STEP 2: UNIT */}
            {step === 'unit' && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div>
                    {crop?.img && <img src={crop.img} className="fd-crop-thumb" alt={crop.nepali} />}
                    <div className="fd-step-title nepali">{crop?.nepali} — कसरी नाप्ने?</div>
                  </div>
                  <button className="fd-listen" onClick={()=>ask(`${crop?.nepali} किलोमा बेच्नु हुन्छ कि क्विन्टलमा?`)}>🔊</button>
                </div>
                <div className="fd-unit-grid">
                  <button className={`fd-unit-btn fd-unit-green ${unit==='kg'?'fd-unit-active':''}`}
                    onClick={()=>{setUnit('kg');setPrice(20);}}>
                    <div className="fd-unit-lbl nepali">किलो</div>
                    <div className="fd-unit-sub">1 kg</div>
                  </button>
                  <button className={`fd-unit-btn fd-unit-blue ${unit==='quintal'?'fd-unit-active-blue':''}`}
                    onClick={()=>{setUnit('quintal');setPrice(2000);}}>
                    <div className="fd-unit-lbl nepali">क्विन्टल</div>
                    <div className="fd-unit-sub">100 kg</div>
                  </button>
                </div>
                <div className="fd-nav-btns">
                  <button className="btn-farmer-red" onClick={goBack}>← पछि</button>
                  <button className="btn-farmer-green" onClick={()=>{ask(unit==='kg'?'किलो छानियो।':'क्विन्टल छानियो।');goNext();}}>अगाडि →</button>
                </div>
              </div>
            )}

            {/* STEP 3: QUANTITY */}
            {step === 'quantity' && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div className="fd-step-title nepali">कति {unit==='quintal'?'क्विन्टल':'किलो'}?</div>
                  <button className="fd-listen" onClick={()=>ask('बीचमा थिचेर नम्बर सिधा लेख्न सकिन्छ।')}>🔊</button>
                </div>
                <VoiceCounter value={quantity} onChange={setQuantity}
                  unit={unit==='quintal'?'क्विन्टल':'किलो'}
                  min={1} max={unit==='quintal'?9999:999999} nepaliLabel />
                {unit==='quintal' && <div className="fd-convert nepali">= {(quantity*100).toLocaleString()} किलो जम्मा</div>}
                <div className="fd-nav-btns">
                  <button className="btn-farmer-red" onClick={goBack}>← पछि</button>
                  <button className="btn-farmer-green" onClick={goNext}>अगाडि →</button>
                </div>
              </div>
            )}

            {/* STEP 4: DATE — Visual sun brightness picker (no reading needed) */}
            {step === 'date' && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div className="fd-step-title nepali">बाली काटेको कति दिन भयो?</div>
                  <button className="fd-listen" onClick={() => ask('बाली काटेको कति दिन भयो? घाम देखेर छान्नुस्।')}>🔊</button>
                </div>

                {/* Instruction image — sun row with arrow */}
                <div className="fd-date-hint">
                  <div className="fd-date-hint-text nepali">घाम जति उज्यालो = बाली त्यति ताजा</div>
                </div>

                {/* SUN ROW — single horizontal scroll of suns */}
                <div className="fd-sun-row">
                  {SUN_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      className={`fd-sun-btn ${harvestDays === opt.days ? 'fd-sun-active' : ''}`}
                      onClick={() => { setHarvestDays(opt.days); ask(opt.voice); }}
                    >
                      <div
                        className="fd-sun-icon"
                        style={{
                          opacity: opt.opacity,
                          filter: `brightness(${opt.brightness}) saturate(${opt.opacity * 100}%)`,
                        }}
                      >
                        ☀️
                      </div>
                      {harvestDays === opt.days && (
                        <div className="fd-sun-check">✓</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Arrow label: Fresh → Old */}
                <div className="fd-date-arrow">
                  <span style={{color:'var(--green)', fontSize:13}}>ताजा</span>
                  <div className="fd-date-arrow-line" />
                  <span style={{color:'var(--text-dim)', fontSize:13}}>पुरानो</span>
                </div>

                <div className="fd-nav-btns" style={{marginTop:24}}>
                  <button className="btn-farmer-red" onClick={goBack}>← पछि</button>
                  <button className="btn-farmer-green" onClick={goNext}>अगाडि →</button>
                </div>
              </div>
            )}

            {/* STEP 5: PRICE */}
            {step === 'price' && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div className="fd-step-title nepali">मूल्य / {unit==='quintal'?'क्विन्टल':'किलो'}</div>
                  <button className="fd-listen" onClick={()=>ask(kalimati?.available?`आज बजारमा ${crop?.nepali} को मूल्य ${kalimati.kalimatiMin} देखि ${kalimati.kalimatiMax} रुपैयाँ छ।`:'मूल्य राख्नुस्।')}>🔊</button>
                </div>

                {kalimati?.available && (
                  <div className="fd-km-box">
                    <div className="fd-km-label nepali">आजको कालीमाटी बजार</div>
                    <div className="fd-km-range">
                      रू {unit==='quintal'?kalimati.kalimatiMin*100:kalimati.kalimatiMin} – रू {unit==='quintal'?kalimati.kalimatiMax*100:kalimati.kalimatiMax}
                    </div>
                    <div className="fd-km-suggest nepali">
                      सुझाव: रू {unit==='quintal'?kalimati.suggestedMin*100:kalimati.suggestedMin} – {unit==='quintal'?kalimati.suggestedMax*100:kalimati.suggestedMax}
                    </div>
                  </div>
                )}

                <VoiceCounter value={price} onChange={v=>{if(v<=maxPrice)setPrice(v);}}
                  unit={`रू / ${unit==='quintal'?'क्विन्टल':'किलो'}`}
                  min={1} max={maxPrice} nepaliLabel />

                {priceOverMax && <div className="fd-price-warn nepali">⚠ मूल्य धेरै बढी — अधिकतम रू {maxPrice}</div>}

                <div className="fd-nav-btns">
                  <button className="btn-farmer-red" onClick={goBack}>← पछि</button>
                  <button className="btn-farmer-green" disabled={priceOverMax} onClick={goNext}>अगाडि →</button>
                </div>
              </div>
            )}

            {/* STEP 6: CONFIRM */}
            {step === 'confirm' && crop && (
              <div className="fd-step">
                <div className="fd-step-hd">
                  <div className="fd-step-title nepali">सही छ?</div>
                  <button className="fd-listen" onClick={()=>ask(`${quantity} ${unit==='quintal'?'क्विन्टल':'किलो'} ${crop.nepali}, ${price} रुपैयाँ। सही छ भने हरियो बटन थिच्नुस्।`)}>🔊</button>
                </div>
                <div className="fd-confirm card">
                  <div className="fd-confirm-img">
                    {crop.img && <img src={crop.img} alt={crop.nepali} />}
                  </div>
                  <div className="fd-confirm-rows">
                    {[
                      ['बाली', <span className="nepali">{crop.nepali}</span>],
                      ['गुणस्तर', <span className="nepali">{grade==='A'?'Grade A':grade==='B'?'Grade B':'Grade C'}</span>],
                      ['परिमाण', <span className="nepali">{quantity} {unit==='quintal'?'क्विन्टल':'किलो'}</span>],
                      ['मूल्य', `रू ${price} / ${unit==='quintal'?'क्विन्टल':'किलो'}`],
                      ['काटेको', harvestDays===0?'आजै':`${harvestDays} दिन अघि`],
                      ['जिल्ला', user?.district],
                    ].map(([k,v]) => (
                      <div key={k} className="fd-confirm-row">
                        <span className="nepali fd-confirm-key">{k}</span>
                        <strong className="fd-confirm-val">{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fd-nav-btns" style={{marginTop:16}}>
                  <button className="btn-farmer-red" onClick={goBack}>गलत छ</button>
                  <button className="btn-farmer-green" onClick={handlePost} disabled={loading}>
                    {loading ? 'राखिँदैछ...' : '✓ सही छ, राख्नुस्'}
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
