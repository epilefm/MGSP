import { useTema, CORES } from "../../theme/ThemeContext";

// Rodapé de links secundários (ex: "Esqueci minha senha", "Criar conta"),
// separado do botão principal por uma linha sutil e com respiro entre as linhas.
export default function AuthFooterLinks({ children }) {
  const { tema } = useTema();
  return (
    <div
      className="mt-7 pt-5 flex flex-col items-center gap-3 text-[13.5px]"
      style={{ borderTop: `1px solid ${CORES[tema].borda}` }}
    >
      {children}
    </div>
  );
}
