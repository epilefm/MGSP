import { useTema, CORES } from "../../theme/ThemeContext";

// Rodapé de links secundários (ex: "Esqueci minha senha", "Criar conta"),
// separado do botão principal por uma linha sutil e com respiro entre as linhas.
export default function AuthFooterLinks({ children }) {
  const { tema } = useTema();
  return (
    <div
      className="mt-4 pt-3.5 flex flex-col items-center gap-2 text-[13px]"
      style={{ borderTop: `1px solid ${CORES[tema].borda}` }}
    >
      {children}
    </div>
  );
}
