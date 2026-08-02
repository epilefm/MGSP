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
    // Terminal compartilhado: se já tinha alguém logado neste navegador e não
    // apertou "Sair" antes de vir logar como outra pessoa, encerra a sessão
    // anterior no servidor agora - senão ela ficaria marcada "online agora"
    // no painel Admin pra sempre (ou até o ultimo_acesso ficar velho).
    const tokenAnterior = localStorage.getItem('mts_token');
    if (tokenAnterior) {
      try {
        await axios.post(`${API_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${tokenAnterior}` } });
      } catch {
        // Sessão anterior já pode ter expirado/sido encerrada - não impede o login novo.
      }
    }

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
    // A limpeza local precisa ser síncrona e vir PRIMEIRO: se isso esperasse
    // a resposta do servidor antes de rodar, sair do sistema e navegar pra
    // fora imediatamente (fechar a aba, ir pra outro site) podia interromper
    // a função no meio e nunca limpar o token - a pessoa voltava e o sistema
    // continuava logado como se nada tivesse acontecido. O aviso ao servidor
    // (pra marcar sessao_ativa = FALSE) é só melhor esforço, em segundo
    // plano, e não precisa terminar pra a sessão local já estar encerrada.
    const tokenAtual = localStorage.getItem('mts_token');
    localStorage.removeItem('mts_token');
    localStorage.removeItem('mts_user');
    applyAuthHeader(null);
    setUser(null);
    if (tokenAtual) {
      axios.post(`${API_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${tokenAtual}` } }).catch(() => {});
    }
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
