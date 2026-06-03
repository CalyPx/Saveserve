import { Link } from 'react-router-dom';

export default function PaymentFailed() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0, padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Red top bar */}
        <div style={{ background: 'var(--red)', padding: '32px 24px 28px' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✕</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>
            Payment Failed
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 6, fontSize: 15 }}>
            No money was deducted from your account
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Your payment did not go through. This can happen if you cancelled the
            eSewa payment, had insufficient balance, or lost your internet connection.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/vendor" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Try Again
            </Link>
            <Link to="/vendor?tab=orders" className="btn btn-ghost" style={{ width: '100%' }}>
              My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
