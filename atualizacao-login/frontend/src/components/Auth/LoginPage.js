import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useTema, CORES } from "../../theme/ThemeContext";
import AuthLayout from "./AuthLayout";
import AuthField from "./AuthField";
import AuthFooterLinks from "./AuthFooterLinks";
import axios from "axios";
import { API_URL } from "../../config/api";

gsap.registerPlugin(useGSAP);

// Animação 3D do painel de marca, em chunk separado (carrega depois do formulário).
// Três modelos com a mesma interface (pulso / estado / ligar):
//   "linha"    - linha SMT com esteira: várias placas passando por impressora,
//                montadoras, forno e inspeção AOI
//   "montagem" - uma placa sendo montada (pick-and-place, reflow, AOI)
//   "chip"     - chip do MGSP com trilhas se desenhando a partir do centro
const MODELO_DA_CENA = "linha";
const CENAS = {
  linha: () => import("./LinhaProducaoScene"),
  montagem: () => import("./MontagemScene"),
  chip: () => import("./LoginScene"),
};
const CenaDoLogin = lazy(CENAS[MODELO_DA_CENA]);

const ERRO = { light: { bg: "#fef2f2", texto: "#b91c1c" }, dark: { bg: "#3f1a1e", texto: "#f87171" } };
const REDUZIR = "(prefers-reduced-motion: reduce)";

export default function LoginPage() {
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [liberado, setLiberado] = useState(false);
  const { login } = useAuth();
  const { tema } = useTema();
  const navigate = useNavigate();
  const location = useLocation();
  const raiz = useRef(null);
  const cena = useRef(null);

  // Entrada da tela: cartão desliza; a marca aparece depois que a placa se monta
  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".auth-cartao", { x: 28, autoAlpha: 0, duration: 0.7, ease: "power3.out", delay: 0.15 });
        gsap.from(".auth-marca-item", { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: "power2.out", delay: 1.15 });
      });
      return () => mm.revert();
    },
    { scope: raiz }
  );

  // Senha/matrícula errada: o cartão balança
  const balancar = contextSafe(() => {
    if (window.matchMedia?.(REDUZIR).matches) return;
    gsap.fromTo(".auth-cartao", { x: 0 }, { keyframes: { x: [-10, 9, -6, 4, 0] }, duration: 0.45, ease: "power1.out" });
  });

  /**
   * Login aceito: o formulário sai, o painel ocupa a tela toda e a placa "liga"
   * e mergulha no chip (a Home abre com a placa do hero). No celular, onde o
   * painel não aparece, o botão vira um check. Nunca segura a entrada por mais
   * de 2,2 s.
   */
  const animarEntrada = contextSafe(() => {
    setLiberado(true);
    if (window.matchMedia?.(REDUZIR).matches) return Promise.resolve();
    const painel = raiz.current?.querySelector(".auth-painel");
    const tl = gsap.timeline();
    if (!painel || painel.offsetWidth === 0) {
      tl.to(".auth-cartao", { scale: 1.02, duration: 0.18, yoyo: true, repeat: 1 }).to(".auth-cartao", { autoAlpha: 0, y: -12, duration: 0.3 }, "+=0.25");
      return tl.then();
    }
    tl.to(".auth-cartao", { autoAlpha: 0, y: -14, scale: 0.97, duration: 0.4, ease: "power2.in" }, 0.15)
      .to(".auth-marca", { autoAlpha: 0, y: -24, duration: 0.45, ease: "power2.in" }, 0.2)
      .to(".auth-lado-form", { width: 0, padding: 0, duration: 0.85, ease: "power3.inOut" }, 0.3);
    const ligada = cena.current ? cena.current.ligar() : Promise.resolve();
    const limite = new Promise((resolve) => setTimeout(resolve, 2200));
    return Promise.race([Promise.all([tl.then(), ligada]), limite]);
  });

  // Estado para validação de matrícula em tempo real
  const [matriculaStatus, setMatriculaStatus] = useState(null); // null, 'loading', 'registered', 'not_registered'

  useEffect(() => {
    if (!matricula || matricula.trim().length < 3) {
      setMatriculaStatus(null);
      return;
    }

    let active = true;
    setMatriculaStatus('loading');

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/public/pessoa/${matricula.trim()}`);
        if (active) {
          if (response.data?.alreadyRegistered) {
            setMatriculaStatus('registered');
          } else {
            setMatriculaStatus('not_registered');
          }
        }
      } catch (err) {
        if (active) {
          setMatriculaStatus('not_registered');
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [matricula]);

  // Status da cena: verde com matrícula reconhecida, vermelho sem conta
  useEffect(() => {
    const tipo = matriculaStatus === "registered" ? "ok" : matriculaStatus === "not_registered" ? "erro" : null;
    cena.current?.estado(tipo);
  }, [matriculaStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(matricula, senha);
      const destino = location.state?.from?.pathname || "/";
      await animarEntrada();
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível entrar. Tente novamente.");
      balancar();
      // pisca vermelho e volta à cor da verificação da matrícula
      cena.current?.estado("erro");
      setTimeout(() => cena.current?.estado(matriculaStatus === "registered" ? "ok" : matriculaStatus === "not_registered" ? "erro" : null), 1500);
      setCarregando(false);
    }
  };

  return (
    <div ref={raiz}>
      <AuthLayout
        title="Acesse sua conta"
        subtitle="Entre com sua matrícula para continuar"
        cena={
          <Suspense fallback={null}>
            <CenaDoLogin ref={cena} />
          </Suspense>
        }
      >
        <form onSubmit={handleSubmit}>
          <AuthField
            label="Matrícula"
            value={matricula}
            onChange={(e) => {
              setMatricula(e.target.value);
              cena.current?.pulso(2); // cada tecla solta pulsos de luz na placa
            }}
            autoFocus
            required
            rightElement={
              matriculaStatus === "loading" ? (
                <span className="flex h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-ping" title="Verificando..." />
              ) : matriculaStatus === "registered" ? (
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" title="Matrícula cadastrada para login!" />
              ) : matriculaStatus === "not_registered" ? (
                <span className="flex h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" title="Matrícula não possui conta de login cadastrada!" />
              ) : null
            }
          />
          {matriculaStatus === "registered" && (
            <div className="text-[11px] text-emerald-500 mb-3.5 -mt-2.5 font-medium tracking-wide">
              ✓ Usuário cadastrado para login.
            </div>
          )}
          {matriculaStatus === "not_registered" && (
            <div className="text-[11px] text-rose-500 mb-3.5 -mt-2.5 font-medium tracking-wide">
              ✗ Matrícula não possui conta cadastrada neste sistema.
            </div>
          )}
          {matriculaStatus === "loading" && (
            <div className="text-[11px] text-amber-500 mb-3.5 -mt-2.5 font-medium tracking-wide">
              Verificando matrícula...
            </div>
          )}
          <AuthField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              cena.current?.pulso(2);
            }}
            required
          />

          {erro && (
            <div
              className="text-[13px] px-3 py-2 rounded-lg mb-3.5"
              style={{ background: ERRO[tema].bg, color: ERRO[tema].texto }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className={`w-full mt-1 flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-sm px-5 py-2.5 transition-colors ${
              liberado ? "bg-emerald-600" : "bg-[#1428A0] hover:bg-[#0f1f7a] disabled:opacity-60"
            }`}
          >
            {liberado ? (
              <>
                <Check size={16} strokeWidth={3} /> Acesso liberado
              </>
            ) : carregando ? (
              "Entrando..."
            ) : (
              "Entrar"
            )}
          </button>

          <AuthFooterLinks>
            <Link to="/EsqueciSenha" className="text-[#1428A0] hover:underline">
              Esqueci minha senha
            </Link>
            <span style={{ color: CORES[tema].textoMuted }}>
              Não tem conta?{" "}
              <Link to="/Registrar" className="text-[#1428A0] font-semibold hover:underline">
                Criar conta
              </Link>
            </span>
          </AuthFooterLinks>
        </form>
      </AuthLayout>
    </div>
  );
}
