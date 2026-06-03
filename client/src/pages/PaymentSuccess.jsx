import { useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const oid = params.get('oid');
  const amt = params.get('amt');

  useEffect(() => {
    // Mark order deposit as paid
    if (oid) api.patch(`/orders/${oid}`, { status: 'deposit_paid' }).catch(() => {});
  }, [oid]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24, padding:32, textAlign:'center' }}>
      <div style={{ fontSize: 80 }}>✅</div>
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:36 }}>Payment Successful!</h1>
      <p style={{ color:'var(--text-muted)', fontSize:18 }}>
        Your deposit of <strong style={{color:'var(--success)'}}>Rs {Number(amt).toLocaleString()}</strong> has been received.
      </p>
      <p style={{ color:'var(--text-muted)' }}>The farmer has been notified and your order is now confirmed.</p>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, maxWidth:400 }}>
        <p style={{ fontSize:14, color:'var(--text-muted)' }}>
          📞 Please coordinate pickup time directly with the farmer.<br/>
          The remaining balance will be paid on delivery.
        </p>
      </div>
      <Link to="/vendor" className="btn btn-primary btn-lg">Go to My Orders</Link>
    </div>
  );
}
