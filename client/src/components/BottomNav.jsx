import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

export default function BottomNav({ ordersCount = 0 }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const base = user.role === 'farmer' ? '/farmer' : '/vendor';

  const tabs = [
    {
      to: base,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      label: user.role === 'farmer' ? 'Home' : 'Browse',
      exact: true,
    },
    {
      to: user.role === 'vendor' ? '/vendor?tab=orders' : '/farmer?tab=orders',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      label: 'Orders',
      badge: ordersCount,
    },
    {
      to: '/impact',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      label: 'Impact',
    },
  ];

  const isActive = (tab) => {
    if (tab.exact) return pathname === tab.to;
    return pathname === tab.to || pathname.startsWith(tab.to.split('?')[0] + '?');
  };

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`bn-tab ${isActive(tab) ? 'bn-active' : ''}`}
        >
          <div className="bn-icon-wrap">
            {tab.icon}
            {tab.badge > 0 && <span className="bn-badge">{tab.badge}</span>}
          </div>
          <span className="bn-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
