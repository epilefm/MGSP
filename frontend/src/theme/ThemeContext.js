import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

const ThemeContext = createContext(null);
const STORAGE_KEY = "mts_theme";

function temaInicial() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (salvo === "light" || salvo === "dark") return salvo;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Deixa o tema disponível pro app inteiro (classe "dark" no <html>, pra
// funcionar com o dark: do Tailwind) e também repassa pro antd, que tem seu
// próprio sistema de cores e não segue a classe do Tailwind sozinho.
export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  const alternarTema = () => setTema((t) => (t === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ tema, alternarTema }), [tema]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: tema === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: { colorPrimary: "#1428A0" },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTema() {
  return useContext(ThemeContext);
}
