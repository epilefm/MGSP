import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import IdleLogoutGuard from './IdleLogoutGuard';
import FloatingNav from '../components/Layout/FloatingNav';

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/Login" replace state={{ from: location }} />;
  }

  return (
    <>
      <IdleLogoutGuard />
      <FloatingNav />
      {children}
    </>
  );
}
