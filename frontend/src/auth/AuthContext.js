import { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);

function applyAuthHeader(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

// Aplica o header assim que o módulo carrega, caso já exista um token salvo
// de uma sessão anterior (evita precisar logar de novo a cada refresh).
applyAuthHeader(localStorage.getItem('mts_token'));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mts_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (matricula, senha) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { matricula, senha });
    localStorage.setItem('mts_token', data.token);
    localStorage.setItem('mts_user', JSON.stringify(data.user));
    applyAuthHeader(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (matricula, senha, nome) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, { matricula, senha, nome });
    return data;
  };

  const solicitarReset = async (matricula) => {
    const { data } = await axios.post(`${API_URL}/auth/solicitar-reset`, { matricula });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('mts_token');
    localStorage.removeItem('mts_user');
    applyAuthHeader(null);
    setUser(null);
  };

  // Uma tela está liberada se o usuário for admin, ou se o slug estiver na
  // lista de telas que vieram no login (já inclui as públicas - ver backend).
  const podeAcessar = (slug) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return (user.screens || []).includes(slug);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, solicitarReset, logout, podeAcessar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
