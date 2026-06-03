import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing          from './pages/Landing';
import Login            from './pages/Login';
import Register         from './pages/Register';
import FarmerDashboard  from './pages/FarmerDashboard';
import VendorDashboard  from './pages/VendorDashboard';
import ImpactBoard      from './pages/ImpactBoard';
import PaymentSuccess   from './pages/PaymentSuccess';
import PaymentFailed    from './pages/PaymentFailed';

const PrivateRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<Landing />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/impact"          element={<ImpactBoard />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed"  element={<PaymentFailed />} />
          <Route path="/farmer" element={
            <PrivateRoute role="farmer"><FarmerDashboard /></PrivateRoute>
          } />
          <Route path="/vendor" element={
            <PrivateRoute role="vendor"><VendorDashboard /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
