import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, Empty, Tag } from "antd";
import { ShieldCheck, ChevronRight, ArrowLeft, History } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API_URL } from "../../config/api";
import { GRUPOS, iconeParaTela } from "./screenIcons";
import ThemeToggle from "../../theme/ThemeToggle";
import { useTema, CORES } from "../../theme/ThemeContext";

const RECENTES_KEY = "mts_telas_recentes";
const RECENTES_MAX = 8;

function lerRecentes() {
  try {
    return JSON.parse(localStorage.getItem(RECENTES_KEY)) || [];
  } catch {
    return [];
  }
}

function registrarAcesso(slug) {
  const atuais = lerRecentes().filter((s) => s !== slug);
  localStorage.setItem(RECENTES_KEY, JSON.stringify([slug, ...atuais].slice(0, RECENTES_MAX)));
}

export default function Home() {
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [departamento, setDepartamento] = useState(null);
  const navigate = useNavigate();
  const { user, logout, podeAcessar } = useAuth();
  const { tema } = useTema();
  const cores = CORES[tema];

  useEffect(() => {
    axios
      .get(`${API_URL}/auth/screens`)
      .then((res) => setTelas(res.data))
      .catch(() => setTelas([]))
      .finally(() => setCarregando(false));
  }, []);

  const gruposComTelas = useMemo(() => {
    return GRUPOS.map((grupo) => ({
      ...grupo,
      itens: telas.filter((t) => t.grupo === grupo.id && podeAcessar(t.slug)),
    })).filter((grupo) => grupo.itens.length > 0);
  }, [telas, podeAcessar]);

  const recentes = useMemo(() => {
    const todasAcessiveis = gruposComTelas.flatMap((g) =>
      g.itens.map((t) => ({ ...t, grupoId: g.id, cor: g.cor }))
    );
    return lerRecentes()
      .map((slug) => todasAcessiveis.find((t) => t.slug === slug))
      .filter(Boolean);
  }, [gruposComTelas]);

  const irParaTela = (slug) => {
    registrarAcesso(slug);
    navigate(`/${slug}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/Login", { replace: true });
  };

  const grupoAberto = gruposComTelas.find((g) => g.id === departamento) || null;

  return (
    <div className="min-h-screen" style={{ background: cores.fundo }}>
      {/* Cabeçalho */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#061542] via-[#1428A0] to-[#2f6fe0] px-6 py-7 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-3.5 py-2 shadow-lg shadow-black/20 sm:px-4 sm:py-2.5">
              <img src="/images/icones/MGSP.png" alt="MGSP" className="block h-6 w-6 sm:h-7 sm:w-7" />
              <span className="text-base font-extrabold tracking-tight text-[#0a1e5c] sm:text-lg">MGSP</span>
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Intranet MX SMD</h1>
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

          <div className="flex items-center gap-2">
            <ThemeToggle variant="light" />
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
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {carregando ? (
          <p className="text-center" style={{ color: cores.textoMuted }}>Carregando suas telas...</p>
        ) : gruposComTelas.length === 0 ? (
          <Empty
            className="mt-16"
            description={
              <span style={{ color: cores.textoMuted }}>
                Nenhuma tela liberada ainda. Fale com o administrador do sistema
                para que ele libere o acesso às telas que você precisa usar.
              </span>
            }
          />
        ) : (
          <>
            {/* Acessados recentemente - atalho rápido, sem limite de departamento */}
            {!grupoAberto && recentes.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2" style={{ color: cores.textoMuted }}>
                  <History size={15} />
                  <span className="text-sm font-semibold">Acessados recentemente</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentes.map((item) => {
                    const Icone = iconeParaTela(item.slug, item.nome, item.grupoId);
                    return (
                      <button
                        key={item.slug}
                        onClick={() => irParaTela(item.slug)}
                        style={{ background: cores.superficie, borderColor: cores.borda, color: cores.texto }}
                        className="flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3.5 text-sm shadow-sm transition-colors"
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${item.cor}22`, color: item.cor }}
                        >
                          <Icone size={13} />
                        </span>
                        {item.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!grupoAberto ? (
              /* Cards de departamento - banner grande com ícone, não um ícone perdido no meio do card */
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {gruposComTelas.map((grupo) => {
                  const GrupoIcone = grupo.icone;
                  return (
                    <Card
                      key={grupo.id}
                      hoverable
                      onClick={() => setDepartamento(grupo.id)}
                      className="!overflow-hidden !rounded-2xl [&_.ant-card-body]:!p-0"
                    >
                      <div
                        className="flex h-28 items-center justify-center sm:h-36"
                        style={{
                          background: `linear-gradient(135deg, ${grupo.cor}, ${grupo.cor}cc)`,
                        }}
                      >
                        <GrupoIcone size={52} strokeWidth={1.5} className="text-white/90 sm:!h-16 sm:!w-16" />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <div>
                          <div className="font-semibold" style={{ color: cores.texto }}>{grupo.nome}</div>
                          <div className="mt-0.5 text-xs" style={{ color: cores.textoMuted }}>
                            {grupo.itens.length} tela(s)
                          </div>
                        </div>
                        <ChevronRight size={16} className="shrink-0" style={{ color: cores.textoMuted }} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Telas do departamento selecionado */
              <div>
                <button
                  onClick={() => setDepartamento(null)}
                  style={{ color: tema === "dark" ? "#7c93e6" : "#1428A0" }}
                  className="mb-5 flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <ArrowLeft size={15} /> Departamentos
                </button>

                <div className="mb-5 flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${grupoAberto.cor}22`, color: grupoAberto.cor }}
                  >
                    <grupoAberto.icone size={20} />
                  </span>
                  <h2 className="text-lg font-bold" style={{ color: cores.texto }}>{grupoAberto.nome}</h2>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {grupoAberto.itens.map((item) => {
                    const Icone = iconeParaTela(item.slug, item.nome, grupoAberto.id);
                    return (
                      <button
                        key={item.slug}
                        onClick={() => irParaTela(item.slug)}
                        style={{ background: cores.superficie, boxShadow: `0 1px 3px ${cores.borda}` }}
                        className="group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:shadow-md"
                      >
                        <span
                          className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                          style={{ backgroundColor: `${grupoAberto.cor}1f`, color: grupoAberto.cor }}
                        >
                          <Icone size={24} strokeWidth={1.8} />
                        </span>
                        <span className="line-clamp-2 text-[11.5px] font-medium leading-tight" style={{ color: cores.texto }}>
                          {item.nome}
                        </span>
                        {item.is_public && (
                          <Tag className="!m-0 !text-[9px] !leading-4" color="default">
                            pública
                          </Tag>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="pb-8 text-center text-xs" style={{ color: cores.textoMuted }}>
        SEDA(M) · MX SMD · © 2026
      </div>
    </div>
  );
}
