import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAdmin({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  if (!user.isAdmin) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <h3>Acesso restrito</h3>
        <p>Esta área é só para administradores.</p>
      </div>
    );
  }

  return children;
}
