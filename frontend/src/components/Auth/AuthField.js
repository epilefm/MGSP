import { useTema, CORES } from "../../theme/ThemeContext";

// Input padronizado das telas de autenticação: label + campo, com estado de
// foco. No escuro, o campo fica um tom mais claro que o card ao redor dele
// (profundidade tipo Spotify), não a mesma cor.
export default function AuthField({ label, type = "text", value, onChange, autoFocus, ...rest }) {
  const { tema } = useTema();
  const cores = CORES[tema];

  return (
    <div className="mb-5 text-left">
      <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: cores.textoMuted }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        style={{
          background: cores.superficieClara,
          borderColor: cores.borda,
          color: cores.texto,
        }}
        className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] text-[14.5px] transition-colors focus:outline-none focus:border-[#1428A0] focus:ring-[3px] focus:ring-[#1428A0]/10"
        {...rest}
      />
    </div>
  );
}
