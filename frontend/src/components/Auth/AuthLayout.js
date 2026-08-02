import { ShieldCheck, Activity, LayoutGrid } from "lucide-react";
import ThemeToggle from "../../theme/ThemeToggle";
import { useTema, CORES } from "../../theme/ThemeContext";

// Casca visual compartilhada pelas telas de Login, Cadastro e Esqueci a senha:
// painel de marca (some em telas estreitas) + card com o formulário. Cores
// calculadas via CORES (theme/ThemeContext.js) em vez de classes dark: do
// Tailwind - nessa tela, em algum ponto do cascata, elas não estavam
// vencendo por um motivo que não valeu a pena perseguir mais.
export default function AuthLayout({ title, subtitle, children }) {
  const { tema } = useTema();
  const cores = CORES[tema];

  return (
    <div className="min-h-screen flex" style={{ background: cores.fundo }}>
      {/* Painel de marca */}
      <div className="hidden md:flex relative flex-[1.1] flex-col items-center justify-center overflow-hidden px-14 py-14 text-white bg-gradient-to-br from-[#061542] via-[#1428A0] to-[#2f6fe0]">
        <div className="absolute -top-36 -right-40 w-[420px] h-[420px] rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          <div className="inline-flex bg-white rounded-2xl px-6 py-4 mb-7 shadow-xl shadow-black/20">
            <img src="/images/logo.png" alt="Logo" className="block max-w-[170px]" />
          </div>
          <h1 className="w-full text-3xl font-bold mb-2.5" style={{ fontFamily: "SamsungOne, sans-serif" }}>
            Intranet SMD
          </h1>
          <p className="w-full text-[15px] leading-relaxed text-white/80 mb-8">
            Monitoramento, produção e gestão do SMD em um só lugar —
            acesso liberado por tela, conforme sua função.
          </p>
          <div className="w-full flex flex-wrap justify-center gap-3.5">
            <span className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-2 text-xs font-medium">
              <Activity size={14} /> Monitoramento
            </span>
            <span className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-2 text-xs font-medium">
              <LayoutGrid size={14} /> Multi-departamento
            </span>
            <span className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-2 text-xs font-medium">
              <ShieldCheck size={14} /> Acesso controlado
            </span>
          </div>
        </div>
        <div className="relative z-10 mt-14 text-xs text-white/60 tracking-wide">
          SEDA(M) · MX SMD · © 2026 SAMSUNG.COM
        </div>
      </div>

      {/* Card do formulário */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="absolute right-5 top-5">
          <ThemeToggle variant="ghost" />
        </div>
        <div
          className="w-full max-w-[400px] rounded-3xl px-8 py-9 sm:px-10 sm:py-10 shadow-[0_18px_50px_rgba(20,40,160,0.10),0_2px_8px_rgba(0,0,0,0.04)]"
          style={{ background: cores.superficie }}
        >
          <div className="md:hidden text-center mb-6">
            <div className="inline-flex bg-white rounded-xl px-4 py-2.5 shadow-sm">
              <img src="/images/logo.png" alt="Logo" className="block max-w-[110px]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: cores.textoTitulo }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13.5px] text-center mb-8" style={{ color: cores.textoMuted }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
