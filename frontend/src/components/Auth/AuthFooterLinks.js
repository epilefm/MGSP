// Rodapé de links secundários (ex: "Esqueci minha senha", "Criar conta"),
// separado do botão principal por uma linha sutil e com respiro entre as linhas.
export default function AuthFooterLinks({ children }) {
  return (
    <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col items-center gap-3 text-[13.5px]">
      {children}
    </div>
  );
}
