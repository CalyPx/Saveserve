import { Link } from 'react-router-dom';
export default function PaymentFailed() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24, padding:32, textAlign:'center' }}>
      <div style={{ fontSize:80 }}>❌</div>
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:36 }}>Payment Failed</h1>
      <p style={{ color:'var(--text-muted)', fontSize:18 }}>Your payment was not completed. No amount was charged.</p>
      <Link to="/vendor" className="btn btn-primary btn-lg">Try Again</Link>
    </div>
  );
}
