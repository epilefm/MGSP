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

// Confere a atividade a cada poucos segundos em vez de agendar um timer fixo
// de 30min por aba. Isso importa pra quem abre várias abas do sistema ao
// mesmo tempo: a atividade em QUALQUER aba grava no mesmo localStorage
// (CHAVE_ULTIMA_ATIVIDADE, compartilhado entre abas da mesma origem), e cada
// aba confere essa MESMA fonte - então uma aba parada enquanto você mexe em
// outra não se desconecta sozinha (o timer antigo, por aba, não tinha como
// saber que "a pessoa" ainda está ali, só que ESSA aba estava parada).
const INTERVALO_VERIFICACAO_MS = 5 * 1000;

export default function IdleLogoutGuard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  const avisoAbertoRef = useRef(false);
  const intervalRef = useRef(null);

  const registrarAtividade = useCallback(() => {
    localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(Date.now()));
  }, []);

  const deslogarPorInatividade = useCallback(() => {
    clearInterval(intervalRef.current);
    logout();
    navigate("/Login", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    if (!user) return undefined;

    registrarAtividade();

    const verificar = () => {
      const ultima = Number(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE)) || Date.now();
      const decorrido = Date.now() - ultima;

      if (decorrido >= LIMITE_INATIVIDADE_MS) {
        deslogarPorInatividade();
        return;
      }

      const restanteMs = LIMITE_INATIVIDADE_MS - decorrido;
      if (restanteMs <= AVISO_ANTES_MS) {
        avisoAbertoRef.current = true;
        setAvisoAberto(true);
        setSegundosRestantes(Math.ceil(restanteMs / 1000));
      } else if (avisoAbertoRef.current) {
        avisoAbertoRef.current = false;
        setAvisoAberto(false);
      }
    };

    verificar();
    intervalRef.current = setInterval(verificar, INTERVALO_VERIFICACAO_MS);

    // Enquanto o aviso estiver na tela, ignora atividade "passiva" (mouse
    // tremendo sozinho, etc.) - só reseta de verdade com o clique explícito
    // em "Continuar conectado", pra confirmar que tem alguém real ali.
    const aoDetectarAtividade = () => {
      if (avisoAbertoRef.current) return;
      registrarAtividade();
    };
    EVENTOS_DE_ATIVIDADE.forEach((ev) => window.addEventListener(ev, aoDetectarAtividade));

    // Aba em segundo plano tem timers pausados/atrasados pelo navegador -
    // ao voltar a ficar visível (troca de aba, volta de outro site via
    // bfcache), confere na hora em vez de esperar o próximo tick do interval.
    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") verificar();
    };
    document.addEventListener("visibilitychange", aoFicarVisivel);

    return () => {
      clearInterval(intervalRef.current);
      EVENTOS_DE_ATIVIDADE.forEach((ev) => window.removeEventListener(ev, aoDetectarAtividade));
      document.removeEventListener("visibilitychange", aoFicarVisivel);
    };
  }, [user, registrarAtividade, deslogarPorInatividade]);

  if (!user) return null;

  return (
    <Modal
      open={avisoAberto}
      title="Você ainda está aí?"
      onOk={() => {
        registrarAtividade();
        avisoAbertoRef.current = false;
        setAvisoAberto(false);
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
