import { Moon, Sun } from "lucide-react";
import { useTema } from "./ThemeContext";

// Botão de alternância claro/escuro. `variant="light"` é pra usar sobre fundo
// escuro/colorido (ex: cabeçalho com gradiente); "ghost" é pra usar sobre
// fundo claro/neutro (ex: painel de login).
export default function ThemeToggle({ variant = "light", className = "" }) {
  const { tema, alternarTema } = useTema();

  const estilos =
    variant === "light"
      ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";

  return (
    <button
      onClick={alternarTema}
      title={tema === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema claro/escuro"
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${estilos} ${className}`}
    >
      {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
