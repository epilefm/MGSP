import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Collapse } from "antd";
import { Compass, Home as HomeIcon, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API_URL } from "../../config/api";
import { GRUPOS, iconeParaTela } from "./screenIcons";
import { useTema, CORES } from "../../theme/ThemeContext";

// Ícone flutuante de acesso rápido, presente em todas as telas de conteúdo
// (embutido em RequireAuth.js, não precisa editar tela por tela). Fica
// fechado por padrão, num canto, sem atrapalhar a tela - só expande quando
// clicado. Não mexe/substitui o navbar antigo (NavbarComp) que é obrigatório
// por norma da empresa em várias telas - isso aqui é um atalho a mais.
export default function FloatingNav() {
  const [aberto, setAberto] = useState(false);
  const [telas, setTelas] = useState([]);
  const location = useLocation();
  const { podeAcessar } = useAuth();
  const { tema } = useTema();
  const cores = CORES[tema];

  // Só busca o catálogo de telas quando abrir pela primeira vez - a maioria
  // das visitas a uma tela nunca vai nem clicar nisso.
  useEffect(() => {
    if (!aberto || telas.length > 0) return;
    axios
      .get(`${API_URL}/auth/screens`)
      .then((res) => setTelas(res.data))
      .catch(() => setTelas([]));
  }, [aberto, telas.length]);

  useEffect(() => {
    setAberto(false);
  }, [location.pathname]);

  const gruposComTelas = useMemo(() => {
    return GRUPOS.map((grupo) => ({
      ...grupo,
      itens: telas.filter((t) => t.grupo === grupo.id && podeAcessar(t.slug)),
    })).filter((grupo) => grupo.itens.length > 0);
  }, [telas, podeAcessar]);

  // Na própria Home não faz sentido oferecer "voltar pra Home".
  const caminho = location.pathname.toLowerCase();
  if (caminho === "/" || caminho === "/home") return null;

  return (
    <div className="fixed bottom-5 right-5 z-[999] print:hidden">
      {aberto && (
        <div
          className="mb-3 max-h-[70vh] w-72 overflow-y-auto rounded-2xl p-3 shadow-2xl"
          style={{ background: cores.superficie, border: `1px solid ${cores.borda}` }}
        >
          <Link
            to="/Home"
            className="mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold no-underline transition-opacity hover:opacity-80"
            style={{ background: "#1428A01f", color: tema === "dark" ? "#7c93e6" : "#1428A0" }}
          >
            <HomeIcon size={16} /> Início
          </Link>

          {gruposComTelas.length === 0 ? (
            <p className="px-1 py-2 text-xs" style={{ color: cores.textoMuted }}>
              Nenhuma outra tela liberada.
            </p>
          ) : (
            <Collapse
              ghost
              accordion
              size="small"
              items={gruposComTelas.map((grupo) => {
                const GrupoIcone = grupo.icone;
                return {
                  key: grupo.id,
                  label: (
                    <span className="flex items-center gap-2 text-sm font-medium" style={{ color: cores.texto }}>
                      <GrupoIcone size={15} style={{ color: grupo.cor }} />
                      {grupo.nome}
                    </span>
                  ),
                  children: (
                    <div className="flex flex-col gap-1">
                      {grupo.itens.map((item) => {
                        const Icone = iconeParaTela(item.slug, item.nome, grupo.id);
                        return (
                          <Link
                            key={item.slug}
                            to={`/${item.slug}`}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs no-underline transition-opacity hover:opacity-80"
                            style={{ color: cores.texto, background: cores.superficieClara }}
                          >
                            <Icone size={13} style={{ color: grupo.cor }} />
                            {item.nome}
                          </Link>
                        );
                      })}
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>
      )}

      <button
        onClick={() => setAberto((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg, #1428A0, #2f6fe0)" }}
        title="Acesso rápido às suas telas"
      >
        {aberto ? <X size={22} /> : <Compass size={22} />}
      </button>
    </div>
  );
}
