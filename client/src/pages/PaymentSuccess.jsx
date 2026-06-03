import { useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const oid = params.get('oid');
  const amt = params.get('amt');

  useEffect(() => {
    if (oid) api.patch(`/orders/${oid}`, { status: 'deposit_paid' }).catch(() => {});
  }, [oid]);

  const deposit    = Number(amt) || 0;
  const estimated  = Math.round(deposit / 0.10); // total = deposit / 10%
  const cashOnDel  = estimated - deposit;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0, padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Green top bar */}
        <div style={{ background: 'var(--green)', padding: '32px 24px 28px' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✓</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000', margin: 0 }}>
            Advance Paid!
          </h1>
          <p style={{ color: 'rgba(0,0,0,0.65)', marginTop: 6, fontSize: 15 }}>
            Your order is now confirmed
          </p>
        </div>

        {/* Details */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '14px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Advance paid (eSewa)</span>
            <strong style={{ color: 'var(--green)', fontSize: 16 }}>Rs {deposit.toLocaleString()}</strong>
          </div>
          {cashOnDel > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '14px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Pay on delivery (Cash/QR)</span>
              <strong style={{ fontSize: 16 }}>Rs {cashOnDel.toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            background: 'var(--surface2)', borderRadius: 10,
            padding: '14px 16px', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
              📋 What happens next
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              1. The farmer has been notified of your order.<br />
              2. A logistics partner (Upaya CityCargo) will collect the goods.<br />
              3. You will receive the goods and pay the remaining balance directly to the farmer by Cash or eSewa QR.
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/vendor?tab=orders" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            View My Orders →
          </Link>
          <Link to="/vendor" className="btn btn-ghost" style={{ width: '100%' }}>
            Browse More Produce
          </Link>
        </div>
      </div>
    </div>
  );
}
