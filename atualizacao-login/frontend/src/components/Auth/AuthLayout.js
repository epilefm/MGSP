import { ShieldCheck, Activity, LayoutGrid } from "lucide-react";
import ThemeToggle from "../../theme/ThemeToggle";
import LanguageToggle from "../../i18n/LanguageToggle";
import { useTema, CORES } from "../../theme/ThemeContext";

// Casca visual compartilhada pelas telas de Login, Cadastro e Esqueci a senha:
// painel de marca (some em telas estreitas) + card com o formulário. Cores
// calculadas via CORES (theme/ThemeContext.js) em vez de classes dark: do
// Tailwind - nessa tela, em algum ponto do cascata, elas não estavam
// vencendo por um motivo que não valeu a pena perseguir mais.
//
// `cena` (opcional): animação do painel de marca (o login usa a placa 3D). Com
// cena, o painel vira três faixas - textos no alto, a animação numa área própria
// no meio e o rodapé embaixo - para a animação não ficar por baixo dos textos.
// O formulário tem largura fixa (480px; 520px em telas grandes) e o painel fica
// com o resto da tela.
// As classes auth-* são os alvos das animações do login (GSAP).
export default function AuthLayout({ title, subtitle, children, cena = null }) {
  const { tema } = useTema();
  const cores = CORES[tema];

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: cores.fundo }}>
      {/* Painel de marca */}
      <div
        className={`auth-painel hidden md:flex relative flex-1 flex-col items-center overflow-hidden px-12 text-white bg-gradient-to-br from-[#061542] via-[#1428A0] to-[#2f6fe0] ${
          cena ? "justify-between py-8" : "justify-center py-10"
        }`}
      >
        <div className="absolute -top-36 -right-40 w-[420px] h-[420px] rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-white/5" />

        <div className="auth-marca relative z-10 flex flex-col items-center max-w-md text-center">
          <div className="auth-marca-item inline-flex items-center gap-2.5 bg-white rounded-2xl px-5 py-3 mb-6 shadow-xl shadow-black/20">
            <img src="/images/icones/MGSP.png" alt="MGSP" className="block h-8 w-8" />
            <span className="text-xl font-extrabold tracking-tight text-[#0a1e5c]">MGSP</span>
          </div>
          <h1 className="auth-marca-item w-full text-2xl font-bold mb-2" style={{ fontFamily: "SamsungOne, sans-serif" }}>
            Intranet MX SMD
          </h1>
          <p className="auth-marca-item w-full text-sm leading-relaxed text-white/80 mb-6">
            Monitoramento, produção e gestão do SMD em um só lugar —
            acesso liberado por tela, conforme sua função.
          </p>
          <div className="auth-marca-item w-full flex flex-wrap justify-center gap-3">
            <span className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-xs font-medium">
              <Activity size={13} /> Monitoramento
            </span>
            <span className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-xs font-medium">
              <LayoutGrid size={13} /> Multi-departamento
            </span>
            <span className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-xs font-medium">
              <ShieldCheck size={13} /> Acesso controlado
            </span>
          </div>
        </div>

        {/* Área própria da animação: entre os textos e o rodapé, sem sobrepor nada */}
        {cena && <div className="auth-cena relative w-full flex-1 min-h-[220px] my-4">{cena}</div>}

        <div
          className={`auth-marca-item relative z-10 text-xs text-white/60 tracking-wide ${cena ? "" : "mt-10"}`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <div>SEDA(M) · MX SMD · © {new Date().getFullYear()}</div>
          <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.75 }}>
            Developed &amp; Maintained by <span className="font-semibold text-white/80">f.miguel</span> · Internal Support
          </div>
        </div>
      </div>

      {/* Card do formulário */}
      <div className="auth-lado-form relative w-full md:w-[480px] xl:w-[520px] md:flex-none flex items-center justify-center overflow-y-auto p-4">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <LanguageToggle variant="ghost" />
          <ThemeToggle variant="ghost" />
        </div>
        <div
          className="auth-cartao w-full max-w-[400px] my-auto rounded-2xl px-6 py-6 sm:px-8 sm:py-7 shadow-[0_18px_50px_rgba(20,40,160,0.10),0_2px_8px_rgba(0,0,0,0.04)]"
          style={{ background: cores.superficie }}
        >
          <div className="md:hidden text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-white rounded-xl px-3.5 py-2 shadow-sm">
              <img src="/images/icones/MGSP.png" alt="MGSP" className="block h-5 w-5" />
              <span className="text-sm font-extrabold tracking-tight text-[#0a1e5c]">MX SMD</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-1.5" style={{ color: cores.textoTitulo }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13px] text-center mb-5" style={{ color: cores.textoMuted }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
