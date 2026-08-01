import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API_URL } from "../../config/api";
import { GRUPOS, iconeParaTela } from "./screenIcons";

export default function Home() {
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(null);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const { user, logout, podeAcessar } = useAuth();

  useEffect(() => {
    axios
      .get(`${API_URL}/auth/screens`)
      .then((res) => setTelas(res.data))
      .catch(() => setTelas([]))
      .finally(() => setCarregando(false));
  }, []);

  // Só mostra telas que o usuário pode acessar (liberadas + públicas + tudo, se admin).
  const gruposComTelas = useMemo(() => {
    return GRUPOS.map((grupo) => ({
      ...grupo,
      itens: telas.filter((t) => t.grupo === grupo.id && podeAcessar(t.slug)),
    })).filter((grupo) => grupo.itens.length > 0);
  }, [telas, podeAcessar]);

  useEffect(() => {
    const fecharSeForaDoMenu = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setAberto(null);
      }
    };
    document.addEventListener("mousedown", fecharSeForaDoMenu);
    return () => document.removeEventListener("mousedown", fecharSeForaDoMenu);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/Login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho + navegação por departamento */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#061542] via-[#1428A0] to-[#2f6fe0] pb-5 pt-6 text-white">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <div className="inline-flex shrink-0 rounded-2xl bg-white px-4 py-2.5 shadow-lg shadow-black/20">
              <img src="/images/logo.png" alt="Logo" className="block h-6 sm:h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Intranet SMD</h1>
              {user && (
                <p className="text-sm text-white/75">
                  Bem-vindo(a), {user.nome}
                  {user.isAdmin && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                      <ShieldCheck size={12} /> administrador
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {user?.isAdmin && (
              <button
                onClick={() => navigate("/Admin")}
                className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
              >
                Painel Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a1e5c] transition-colors hover:bg-white/90"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Barra de departamentos - discreta, expande sob demanda */}
        {!carregando && gruposComTelas.length > 0 && (
          <div ref={wrapperRef} className="relative z-10 mx-auto mt-6 max-w-6xl px-6">
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {gruposComTelas.map((grupo) => {
                const GrupoIcone = grupo.icone;
                const estaAberto = aberto === grupo.id;
                return (
                  <div key={grupo.id} className="relative">
                    <button
                      onClick={() => setAberto(estaAberto ? null : grupo.id)}
                      onMouseEnter={() => setAberto(grupo.id)}
                      className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                        estaAberto ? "bg-white text-[#0a1e5c]" : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <GrupoIcone size={16} />
                      {grupo.nome}
                      <span className={`text-xs ${estaAberto ? "text-slate-400" : "text-white/60"}`}>
                        {grupo.itens.length}
                      </span>
                      <ChevronDown size={14} className={`transition-transform ${estaAberto ? "rotate-180" : ""}`} />
                    </button>

                    {estaAberto && (
                      <div
                        onMouseLeave={() => setAberto(null)}
                        className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(90vw,420px)] rounded-2xl bg-white p-3 text-left shadow-2xl shadow-black/20"
                      >
                        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
                          {grupo.itens.map((item) => {
                            const Icone = iconeParaTela(item.slug, item.nome, grupo.id);
                            return (
                              <button
                                key={item.slug}
                                onClick={() => {
                                  setAberto(null);
                                  navigate(`/${item.slug}`);
                                }}
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-colors hover:bg-slate-50"
                              >
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1428A0]/10 text-[#1428A0] transition-transform group-hover:scale-105">
                                  <Icone size={20} strokeWidth={1.8} />
                                </span>
                                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-600">
                                  {item.nome}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Corpo */}
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        {carregando ? (
          <p className="text-slate-400">Carregando suas telas...</p>
        ) : gruposComTelas.length === 0 ? (
          <div className="mx-auto max-w-md text-slate-500">
            <h2 className="mb-2 text-lg font-semibold text-slate-700">Nenhuma tela liberada ainda</h2>
            <p className="text-sm">
              Fale com o administrador do sistema para que ele libere o acesso
              às telas que você precisa usar.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Escolha um departamento acima para ver as telas disponíveis.
          </p>
        )}
      </div>

      <div className="pb-8 text-center text-xs text-slate-400">
        SEDA(M) · MX SMD · © 2026 SAMSUNG.COM
      </div>
    </div>
  );
}
