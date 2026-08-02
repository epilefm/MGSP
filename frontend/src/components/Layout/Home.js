import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, Empty, Tag } from "antd";
import { ChevronRight, ArrowLeft, History, Settings } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API_URL } from "../../config/api";
import { GRUPOS, iconeParaTela } from "./screenIcons";
import ThemeToggle from "../../theme/ThemeToggle";
import { useTema, CORES } from "../../theme/ThemeContext";

const RECENTES_MAX = 8;

// Chave por usuário (não por navegador) - terminal compartilhado: se não
// escopar por conta, quem loga depois vê os "recentes" de quem usou antes.
function chaveRecentes(userId) {
  return `mts_telas_recentes_${userId}`;
}

function lerRecentes(userId) {
  try {
    return JSON.parse(localStorage.getItem(chaveRecentes(userId))) || [];
  } catch {
    return [];
  }
}

function registrarAcesso(slug, userId) {
  const atuais = lerRecentes(userId).filter((s) => s !== slug);
  localStorage.setItem(chaveRecentes(userId), JSON.stringify([slug, ...atuais].slice(0, RECENTES_MAX)));
}

export default function Home() {
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [departamento, setDepartamento] = useState(null);
  const [pendencias, setPendencias] = useState(0);
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

  // Selo de "pendências" pro admin (hoje: pedidos de redefinição de senha) -
  // só busca isso se a pessoa logada for admin, senão a rota nem deixaria.
  useEffect(() => {
    if (!user?.isAdmin) return;
    axios
      .get(`${API_URL}/admin/pendencias`)
      .then((res) => setPendencias(res.data.resetSenha || 0))
      .catch(() => setPendencias(0));
  }, [user?.isAdmin]);

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
    return lerRecentes(user?.id)
      .map((slug) => todasAcessiveis.find((t) => t.slug === slug))
      .filter(Boolean);
  }, [gruposComTelas, user?.id]);

  const irParaTela = (slug) => {
    registrarAcesso(slug, user?.id);
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
      <div
        className="relative overflow-hidden bg-gradient-to-br from-[#061542] via-[#1428A0] to-[#2f6fe0] text-white"
        style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 14 }}
      >
        <div className="pointer-events-none absolute -top-14 -right-14 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-28 w-28 rounded-full bg-white/5" />

        {/*
          Grid de verdade com 2 linhas explícitas (não flex-col empilhando
          "por cima"/"embaixo" e torcendo pro espaçamento bater) - assim o
          nome da pessoa fica na MESMA linha do grid que o subtítulo,
          garantido pela estrutura, não por eu acertar um valor de gap no
          escuro. 3 colunas (esquerda/centro/direita) x 2 linhas
          (logo+título+controles / vazio+subtítulo+nome).
        */}
        <div
          className="relative z-10 mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center"
          style={{ columnGap: 16, rowGap: 6 }}
        >
          {/* Linha 1 */}
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/95 px-4 py-2">
              <img src="/images/icones/MGSP.png" alt="MGSP" className="block h-7 w-7" />
              <span className="text-lg font-extrabold tracking-tight text-[#0a1e5c]">MGSP</span>
            </div>
          </div>
          <div style={{ margin: 0, padding: 0, lineHeight: 1.2 }} className="text-center text-3xl font-bold sm:text-4xl">
            Intranet MX SMD
          </div>
          <div className="flex items-center justify-end gap-3">
            <ThemeToggle variant="light" />
            <button
              onClick={handleLogout}
              className="rounded-lg bg-white px-4 py-2 text-base font-semibold text-[#0a1e5c] transition-colors hover:bg-white/90"
            >
              Sair
            </button>
          </div>

          {/* Linha 2 - subtítulo e nome ficam garantidamente alinhados */}
          <div />
          <div style={{ margin: 0, padding: 0, lineHeight: 1.2 }} className="text-center text-base text-white/70">
            Monitoramento e gestão do SMD
          </div>
          <div className="flex justify-end">
            {user && (
              <span className="rounded-lg bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white">
                {user.nome}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-5">
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
              <div className="mb-5">
                <div className="mb-2.5 flex items-center gap-2" style={{ color: cores.textoMuted }}>
                  <History size={14} />
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
              /* Cards de departamento - banner com ícone. Pra quem é admin,
                 entra um card extra de "Gestão do Sistema" (era um botão
                 separado no cabeçalho, agora é um card como os outros). */
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
                {user?.isAdmin && (
                  <div className="relative">
                    <Card
                      hoverable
                      onClick={() => navigate("/Admin")}
                      className="!overflow-hidden !rounded-2xl [&_.ant-card-body]:!p-0"
                    >
                      <div
                        className="flex h-20 items-center justify-center sm:h-24"
                        style={{ background: "linear-gradient(135deg, #1428A0, #1428A0cc)" }}
                      >
                        <Settings size={36} strokeWidth={1.6} className="text-white/90" />
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: cores.texto }}>Gestão do Sistema</div>
                          <div className="text-xs" style={{ color: cores.textoMuted }}>
                            {pendencias > 0
                              ? `${pendencias} pedido(s) de redefinição de senha`
                              : "Usuários e acessos"}
                          </div>
                        </div>
                        <ChevronRight size={16} className="shrink-0" style={{ color: cores.textoMuted }} />
                      </div>
                    </Card>
                    {/* Selo estilo notificação de app - círculo vermelho com
                        anel de contorno no canto do card, tipo iOS/Android. */}
                    {pendencias > 0 && (
                      <span
                        className="pointer-events-none absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                        style={{ background: "#ff4d4f", border: `3px solid ${cores.superficie}` }}
                      >
                        {pendencias > 9 ? "9+" : pendencias}
                      </span>
                    )}
                  </div>
                )}
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
                        className="flex h-20 items-center justify-center sm:h-24"
                        style={{
                          background: `linear-gradient(135deg, ${grupo.cor}, ${grupo.cor}cc)`,
                        }}
                      >
                        <GrupoIcone size={36} strokeWidth={1.6} className="text-white/90" />
                      </div>
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: cores.texto }}>{grupo.nome}</div>
                          <div className="text-xs" style={{ color: cores.textoMuted }}>
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
