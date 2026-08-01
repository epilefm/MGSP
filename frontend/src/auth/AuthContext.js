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

  const logout = () => {
    localStorage.removeItem('mts_token');
    localStorage.removeItem('mts_user');
    applyAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
