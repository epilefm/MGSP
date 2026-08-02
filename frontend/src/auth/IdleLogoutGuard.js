import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "antd";
import { useAuth } from "./AuthContext";

// Terminal compartilhado (várias operadoras revezando no mesmo PC) -> se
// ninguém mexer no sistema por muito tempo, desloga sozinho pra próxima
// pessoa não continuar dentro da conta de quem usou antes.
const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000; // 30 min - ajustável
const AVISO_ANTES_MS = 60 * 1000; // avisa 1 min antes de derrubar de vez
const CHAVE_ULTIMA_ATIVIDADE = "mts_ultima_atividade";
const EVENTOS_DE_ATIVIDADE = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export default function IdleLogoutGuard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  const timeoutAvisoRef = useRef(null);
  const timeoutLogoutRef = useRef(null);
  const intervalContagemRef = useRef(null);
  const avisoAbertoRef = useRef(false);

  const limparTimers = useCallback(() => {
    clearTimeout(timeoutAvisoRef.current);
    clearTimeout(timeoutLogoutRef.current);
    clearInterval(intervalContagemRef.current);
  }, []);

  const deslogarPorInatividade = useCallback(() => {
    limparTimers();
    logout();
    navigate("/Login", { replace: true });
  }, [limparTimers, logout, navigate]);

  const agendarTimers = useCallback(() => {
    limparTimers();
    avisoAbertoRef.current = false;
    setAvisoAberto(false);

    timeoutAvisoRef.current = setTimeout(() => {
      avisoAbertoRef.current = true;
      setAvisoAberto(true);
      let restante = Math.floor(AVISO_ANTES_MS / 1000);
      setSegundosRestantes(restante);
      intervalContagemRef.current = setInterval(() => {
        restante -= 1;
        setSegundosRestantes(Math.max(restante, 0));
      }, 1000);
    }, LIMITE_INATIVIDADE_MS - AVISO_ANTES_MS);

    timeoutLogoutRef.current = setTimeout(deslogarPorInatividade, LIMITE_INATIVIDADE_MS);
  }, [limparTimers, deslogarPorInatividade]);

  const registrarAtividade = useCallback(() => {
    localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(Date.now()));
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    registrarAtividade();
    agendarTimers();

    // Enquanto o aviso estiver na tela, ignora atividade "passiva" (mouse
    // tremendo sozinho, etc.) - só reseta de verdade com o clique explícito
    // em "Continuar conectado", pra confirmar que tem alguém real ali.
    const aoDetectarAtividade = () => {
      if (avisoAbertoRef.current) return;
      registrarAtividade();
      agendarTimers();
    };
    EVENTOS_DE_ATIVIDADE.forEach((ev) => window.addEventListener(ev, aoDetectarAtividade));

    // Cobre sair pra outro site e voltar pelo botão de avançar/voltar do
    // navegador (bfcache): se já passou do limite enquanto a aba estava
    // fora, desloga ao restaurar em vez de manter a tela anterior visível.
    const aoRestaurarPagina = (event) => {
      if (!event.persisted) return;
      const ultima = Number(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE)) || 0;
      if (Date.now() - ultima >= LIMITE_INATIVIDADE_MS) {
        deslogarPorInatividade();
      } else {
        registrarAtividade();
        agendarTimers();
      }
    };
    window.addEventListener("pageshow", aoRestaurarPagina);

    return () => {
      limparTimers();
      EVENTOS_DE_ATIVIDADE.forEach((ev) => window.removeEventListener(ev, aoDetectarAtividade));
      window.removeEventListener("pageshow", aoRestaurarPagina);
    };
  }, [user, registrarAtividade, agendarTimers, deslogarPorInatividade, limparTimers]);

  if (!user) return null;

  return (
    <Modal
      open={avisoAberto}
      title="Você ainda está aí?"
      onOk={() => {
        registrarAtividade();
        agendarTimers();
      }}
      onCancel={deslogarPorInatividade}
      okText="Continuar conectado"
      cancelText="Sair agora"
      closable={false}
      maskClosable={false}
    >
      Por segurança, você vai ser desconectado por inatividade em {segundosRestantes}s.
    </Modal>
  );
}
