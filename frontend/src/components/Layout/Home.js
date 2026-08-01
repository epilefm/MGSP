import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API_URL } from "../../config/api";
import { GRUPOS, iconeParaTela } from "./screenIcons";

export default function Home() {
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
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

  const handleLogout = () => {
    logout();
    navigate("/Login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#061542] via-[#1428A0] to-[#2f6fe0] px-6 pb-10 pt-8 text-white">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
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
      </div>

      {/* Conteúdo */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {carregando ? (
          <p className="text-center text-slate-400">Carregando suas telas...</p>
        ) : gruposComTelas.length === 0 ? (
          <div className="mx-auto max-w-md text-center text-slate-500">
            <h2 className="mb-2 text-lg font-semibold text-slate-700">Nenhuma tela liberada ainda</h2>
            <p className="text-sm">
              Fale com o administrador do sistema para que ele libere o acesso
              às telas que você precisa usar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {gruposComTelas.map((grupo) => (
              <section key={grupo.id}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${grupo.cor}1a`, color: grupo.cor }}
                  >
                    <grupo.icone size={18} strokeWidth={2} />
                  </span>
                  <h2 className="text-base font-bold text-slate-800">{grupo.nome}</h2>
                  <span className="text-sm text-slate-400">{grupo.itens.length} tela(s)</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {grupo.itens.map((item) => {
                    const Icone = iconeParaTela(item.slug, item.nome, grupo.id);
                    return (
                      <button
                        key={item.slug}
                        onClick={() => navigate(`/${item.slug}`)}
                        className="group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors hover:bg-white hover:shadow-md"
                      >
                        <span
                          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105 group-active:scale-95"
                          style={{ backgroundColor: `${grupo.cor}1a`, color: grupo.cor }}
                        >
                          <Icone size={24} strokeWidth={1.8} />
                        </span>
                        <span className="line-clamp-2 text-[11.5px] font-medium leading-tight text-slate-600">
                          {item.nome}
                        </span>
                        {item.is_public && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                            pública
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="pb-8 pt-4 text-center text-xs text-slate-400">
        SEDA(M) · MX SMD · © 2026 SAMSUNG.COM
      </div>
    </div>
  );
}
